import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AVATAR_MAX_BYTES, profilHandler } from './profil'

const { storage, supabase, maybeSingle, toWebp } = vi.hoisted(() => {
  const maybeSingle = vi.fn()
  const storage = {
    upload: vi.fn(),
    remove: vi.fn(),
    createSignedUrl: vi.fn(),
  }
  return {
    maybeSingle,
    storage,
    toWebp: vi.fn(),
    supabase: {
      from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle }) }) })),
      rpc: vi.fn(),
      storage: { from: vi.fn(() => storage) },
    },
  }
})

vi.mock('../supabase.js', () => ({ supabase }))
vi.mock('../lib/image/to-webp', () => ({ toWebp }))

const WEBP = new File(['webp'], 'photo.webp', { type: 'image/webp' })
const USER = '8c1f0a52-0000-4000-8000-000000000001'

beforeEach(() => {
  vi.clearAllMocks()
  toWebp.mockResolvedValue(WEBP)
  storage.upload.mockResolvedValue({ error: null })
  storage.remove.mockResolvedValue({ error: null })
  supabase.rpc.mockResolvedValue({ error: null })
})

describe('profilHandler.getPp', () => {
  it('renvoie le chemin de la photo du profil', async () => {
    maybeSingle.mockResolvedValue({ data: { pp: `${USER}/a.webp` }, error: null })

    expect(await profilHandler.getPp(USER)).toBe(`${USER}/a.webp`)
    expect(supabase.from).toHaveBeenCalledWith('Profil')
  })

  it('renvoie null sans photo ou sans profil', async () => {
    maybeSingle.mockResolvedValue({ data: { pp: null }, error: null })
    expect(await profilHandler.getPp(USER)).toBeNull()

    maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await profilHandler.getPp(USER)).toBeNull()
  })
})

describe('profilHandler.getPpUrl', () => {
  it('demande une URL signée à durée limitée sur le bucket privé', async () => {
    storage.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed/pp' }, error: null })

    expect(await profilHandler.getPpUrl(`${USER}/a.webp`)).toBe('https://signed/pp')
    expect(supabase.storage.from).toHaveBeenCalledWith('profilepictures')
    expect(storage.createSignedUrl).toHaveBeenCalledWith(`${USER}/a.webp`, 3600)
  })

  it('remonte l’erreur de Storage', async () => {
    storage.createSignedUrl.mockResolvedValue({ data: null, error: new Error('denied') })

    await expect(profilHandler.getPpUrl('x')).rejects.toThrow('denied')
  })
})

describe('profilHandler.changePp', () => {
  it('convertit en WebP, envoie dans le dossier de l’utilisatrice, enregistre le chemin puis supprime l’ancienne', async () => {
    const original = new File(['jpg'], 'moi.jpg', { type: 'image/jpeg' })

    const path = await profilHandler.changePp(USER, original, `${USER}/old.webp`)

    expect(toWebp).toHaveBeenCalledWith(original, { maxWidth: 512, maxBytes: AVATAR_MAX_BYTES })
    expect(path).toMatch(new RegExp(`^${USER}/[0-9a-f-]{36}\\.webp$`))
    expect(storage.upload).toHaveBeenCalledWith(path, WEBP, { contentType: 'image/webp' })
    expect(supabase.rpc).toHaveBeenCalledWith('set_my_pp', { new_pp: path })
    expect(storage.remove).toHaveBeenCalledWith([`${USER}/old.webp`])
  })

  it('ne supprime rien quand il n’y avait pas de photo avant', async () => {
    await profilHandler.changePp(USER, WEBP, null)

    expect(storage.remove).not.toHaveBeenCalled()
  })

  it('n’enregistre rien si la conversion échoue', async () => {
    toWebp.mockRejectedValue(new Error('trop lourde'))

    await expect(profilHandler.changePp(USER, WEBP)).rejects.toThrow('trop lourde')
    expect(storage.upload).not.toHaveBeenCalled()
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('n’enregistre rien si l’envoi échoue', async () => {
    storage.upload.mockResolvedValue({ error: new Error('denied') })

    await expect(profilHandler.changePp(USER, WEBP, `${USER}/old.webp`)).rejects.toThrow('denied')
    expect(supabase.rpc).not.toHaveBeenCalled()
    expect(storage.remove).not.toHaveBeenCalled()
  })

  it('supprime le fichier envoyé, et garde l’ancienne photo, si l’enregistrement du chemin échoue', async () => {
    supabase.rpc.mockResolvedValue({ error: new Error('rpc') })

    await expect(profilHandler.changePp(USER, WEBP, `${USER}/old.webp`)).rejects.toThrow('rpc')

    expect(storage.remove).toHaveBeenCalledTimes(1)
    const [removed] = storage.remove.mock.calls[0][0] as string[]
    expect(removed).toMatch(new RegExp(`^${USER}/[0-9a-f-]{36}\\.webp$`))
    expect(removed).not.toBe(`${USER}/old.webp`)
  })

  it('réussit même si la suppression de l’ancienne photo échoue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    storage.remove.mockRejectedValue(new Error('boom'))

    await expect(profilHandler.changePp(USER, WEBP, `${USER}/old.webp`)).resolves.toMatch(/\.webp$/)
  })
})
