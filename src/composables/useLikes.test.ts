import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useLikes, LIKE_ADDED_MESSAGE, LIKE_SAVE_ERROR_MESSAGE, LIKES_LOAD_ERROR_MESSAGE } from './useLikes'

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('vue-sonner', () => ({ toast }))

const { likeHandler } = vi.hoisted(() => ({
  likeHandler: { setLike: vi.fn(), getMine: vi.fn() },
}))
vi.mock('../handlers/like', () => ({ likeHandler }))

const ARTISTE = { id: 7, type: 'artiste' } as const
const CONFERENCE = { id: 7, type: 'conference' } as const

beforeEach(() => {
  vi.clearAllMocks()
  likeHandler.setLike.mockResolvedValue(undefined)
  likeHandler.getMine.mockResolvedValue([])
  useLikes().clearLikes()
})

describe('useLikes', () => {
  it('marque le contenu comme liké et affiche le toast "Ajouté à Mon programme"', () => {
    const { addLike, isLiked } = useLikes()

    addLike(ARTISTE)

    expect(isLiked(ARTISTE)).toBe(true)
    expect(toast.success).toHaveBeenCalledWith(LIKE_ADDED_MESSAGE)
  })

  it("distingue un artiste et une conférence de même id", () => {
    const { addLike, isLiked } = useLikes()

    addLike(ARTISTE)

    expect(isLiked(CONFERENCE)).toBe(false)
  })

  it('partage l’état entre tous les appels à useLikes', () => {
    useLikes().setLiked(CONFERENCE, true)
    expect(useLikes().isLiked(CONFERENCE)).toBe(true)

    useLikes().setLiked(CONFERENCE, false)
    expect(useLikes().isLiked(CONFERENCE)).toBe(false)
  })

  it('enregistre chaque like et unlike en base', async () => {
    const { setLiked } = useLikes()

    await setLiked(ARTISTE, true)
    await setLiked(ARTISTE, false)

    expect(likeHandler.setLike).toHaveBeenNthCalledWith(1, ARTISTE, true)
    expect(likeHandler.setLike).toHaveBeenNthCalledWith(2, ARTISTE, false)
  })

  it("envoie les clics d'un même contenu l'un après l'autre", async () => {
    let finishFirst!: () => void
    likeHandler.setLike.mockImplementationOnce(() => new Promise<void>((resolve) => (finishFirst = resolve)))
    const { setLiked } = useLikes()

    setLiked(ARTISTE, true)
    setLiked(ARTISTE, false)
    await flushPromises()
    expect(likeHandler.setLike).toHaveBeenCalledTimes(1)

    finishFirst()
    await flushPromises()
    expect(likeHandler.setLike).toHaveBeenLastCalledWith(ARTISTE, false)
  })

  it("revient à l'état précédent et prévient quand l'enregistrement échoue", async () => {
    likeHandler.setLike.mockRejectedValueOnce(new Error('réseau'))
    const { setLiked, isLiked } = useLikes()

    await setLiked(ARTISTE, true)

    expect(isLiked(ARTISTE)).toBe(false)
    expect(toast.error).toHaveBeenCalledWith(LIKE_SAVE_ERROR_MESSAGE)
  })

  it('charge les likes enregistrés en base', async () => {
    likeHandler.getMine.mockResolvedValue([ARTISTE])
    const { setLiked, loadLikes, isLiked } = useLikes()
    await setLiked(CONFERENCE, true)

    await loadLikes()

    expect(isLiked(ARTISTE)).toBe(true)
    expect(isLiked(CONFERENCE)).toBe(false)
  })

  it("garde un like en cours d'enregistrement quand le chargement arrive avant", async () => {
    likeHandler.setLike.mockImplementationOnce(() => new Promise(() => {}))
    const { setLiked, loadLikes, isLiked } = useLikes()

    setLiked(ARTISTE, true)
    await loadLikes()

    expect(isLiked(ARTISTE)).toBe(true)
  })

  it('ignore un chargement terminé après la déconnexion', async () => {
    let finishLoad!: (targets: unknown[]) => void
    likeHandler.getMine.mockImplementationOnce(() => new Promise((resolve) => (finishLoad = resolve)))
    const { loadLikes, clearLikes, isLiked } = useLikes()

    const loading = loadLikes()
    clearLikes()
    finishLoad([ARTISTE])
    await loading

    expect(isLiked(ARTISTE)).toBe(false)
  })

  it('prévient quand le chargement échoue', async () => {
    likeHandler.getMine.mockRejectedValueOnce(new Error('réseau'))

    await useLikes().loadLikes()

    expect(toast.error).toHaveBeenCalledWith(LIKES_LOAD_ERROR_MESSAGE)
  })
})
