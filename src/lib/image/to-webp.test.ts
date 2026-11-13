import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImageError, isWebp, toWebp } from './to-webp'

const close = vi.fn()
const drawImage = vi.fn()
let blobType = 'image/webp'
// Contenu du Blob produit par le canvas : un vrai WebP, ou autre chose.
let blobBytes: BlobPart[] = []
// Poids du WebP produit, selon la qualité demandée.
let sizeFor: (quality: number) => number = () => 12

// En-tête minimal d'un fichier WebP : « RIFF » + taille + « WEBP ».
const WEBP_HEADER: BlobPart[] = ['RIFF', new Uint8Array(4), 'WEBP']

beforeEach(() => {
  blobType = 'image/webp'
  blobBytes = WEBP_HEADER
  sizeFor = () => 12
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 3200, height: 1600, close }))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as never)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback, _type, quality) {
    // Complète le contenu pour atteindre le poids voulu (l'en-tête compte pour 12 octets).
    const padding = new Uint8Array(Math.max(0, sizeFor(quality as number) - 12))
    callback(new Blob([...blobBytes, padding], { type: blobType }))
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

const jpeg = () => new File(['x'], 'Photo Angèle.JPG', { type: 'image/jpeg' })
const realWebp = (name = 'a.webp') => new File(WEBP_HEADER, name, { type: 'image/webp' })

describe('isWebp', () => {
  it('reconnaît la signature WebP, pas une autre image', async () => {
    expect(await isWebp(new Blob(WEBP_HEADER))).toBe(true)
    expect(await isWebp(new Blob(['\xFF\xD8\xFF\xE0 jpeg']))).toBe(false)
    expect(await isWebp(new Blob(['RIFF']))).toBe(false)
  })
})

describe('toWebp', () => {
  it('renvoie tel quel un vrai fichier WebP', async () => {
    const file = realWebp()

    expect(await toWebp(file)).toBe(file)
    expect(createImageBitmap).not.toHaveBeenCalled()
  })

  it('ré-encode un « .webp » qui n’en est pas un (JPEG renommé)', async () => {
    const fake = new File(['\xFF\xD8\xFF\xE0 jpeg'], 'photo.webp', { type: 'image/webp' })

    const result = await toWebp(fake)

    expect(result).not.toBe(fake)
    expect(createImageBitmap).toHaveBeenCalledWith(fake)
    expect(await isWebp(result)).toBe(true)
  })

  it('convertit un JPEG en WebP et remplace l’extension', async () => {
    const result = await toWebp(jpeg())

    expect(result.type).toBe('image/webp')
    expect(result.name).toBe('Photo Angèle.webp')
    expect(await isWebp(result)).toBe(true)
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.85)
    expect(close).toHaveBeenCalled()
  })

  it('réduit une image plus large que maxWidth en gardant le ratio', async () => {
    await toWebp(jpeg(), { maxWidth: 1600 })

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 800)
  })

  it('n’agrandit pas une image plus petite que maxWidth', async () => {
    await toWebp(jpeg(), { maxWidth: 6400 })

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 3200, 1600)
  })

  it('refuse un format non pris en charge', async () => {
    await expect(toWebp(new File(['x'], 'a.svg', { type: 'image/svg+xml' }))).rejects.toThrow(ImageError)
    await expect(toWebp(new File(['x'], 'a.gif', { type: 'image/gif' }))).rejects.toThrow('non pris en charge')
  })

  it('refuse une image illisible avec un message clair', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode')))

    await expect(toWebp(jpeg())).rejects.toThrow(ImageError)
  })

  it('baisse la qualité par paliers quand le WebP dépasse la limite', async () => {
    sizeFor = (quality) => (quality > 0.6 ? 2000 : 800) // 0.85 et 0.7 : trop lourd, 0.55 : ok

    const result = await toWebp(jpeg(), { maxBytes: 1000 })

    expect(result.type).toBe('image/webp')
    const qualities = vi.mocked(HTMLCanvasElement.prototype.toBlob).mock.calls.map((call) => call[2])
    expect(qualities).toEqual([0.85, 0.7, 0.55])
  })

  it('refuse une image encore trop lourde après tous les paliers', async () => {
    sizeFor = () => 2000

    await expect(toWebp(jpeg(), { maxBytes: 1000 })).rejects.toThrow(ImageError)
    expect(close).toHaveBeenCalled()
  })

  it('refuse un WebP déjà trop lourd, sans le convertir', async () => {
    const heavy = realWebp()
    Object.defineProperty(heavy, 'size', { value: 6 * 1024 * 1024 })

    await expect(toWebp(heavy)).rejects.toThrow('plus de 5 Mo')
    expect(createImageBitmap).not.toHaveBeenCalled()
  })

  it('accepte par défaut un WebP converti jusqu’à 5 Mo', async () => {
    sizeFor = () => 4.5 * 1024 * 1024

    expect((await toWebp(jpeg())).type).toBe('image/webp')
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledTimes(1)
  })

  it('refuse un navigateur qui n’encode pas en WebP (retombe sur du PNG)', async () => {
    blobType = 'image/png'

    await expect(toWebp(jpeg())).rejects.toThrow('WebP')
    expect(close).toHaveBeenCalled()
  })

  it('refuse un blob étiqueté WebP dont le contenu n’en est pas un', async () => {
    blobBytes = ['\x89PNG fake']

    await expect(toWebp(jpeg())).rejects.toThrow('WebP')
  })
})
