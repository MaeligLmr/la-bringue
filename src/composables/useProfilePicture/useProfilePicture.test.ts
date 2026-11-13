import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

const getPp = vi.fn()
const getPpUrl = vi.fn()
// État partagé au niveau du module : chaque test charge une copie neuve du module, avec
// sa propre référence `user` (sinon les observateurs des copies précédentes réagiraient aussi).
let user = ref<{ id: string } | null>(null)

async function load() {
  vi.resetModules()
  user = ref<{ id: string } | null>(null)
  vi.doMock('../../handlers/profil', () => ({ profilHandler: { getPp, getPpUrl } }))
  vi.doMock('../useAuth/useAuth', () => ({ useAuth: () => ({ user }) }))
  const { useProfilePicture } = await import('./useProfilePicture')
  return effectScope().run(() => useProfilePicture())!
}

// Laisse les promesses en attente se résoudre (sans dépendre des minuteries simulées).
const settle = () => vi.advanceTimersByTimeAsync(0)

beforeEach(() => {
  vi.useFakeTimers()
  getPp.mockReset().mockResolvedValue(null)
  getPpUrl.mockReset().mockImplementation(async (path: string) => `https://signed/${path}`)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useProfilePicture', () => {
  it('n’a ni chemin ni URL quand personne n’est connecté', async () => {
    const { ppPath, ppUrl } = await load()
    await settle()

    expect(ppPath.value).toBeNull()
    expect(ppUrl.value).toBeUndefined()
    expect(getPp).not.toHaveBeenCalled()
  })

  it('charge la photo de la personne qui se connecte', async () => {
    getPp.mockResolvedValue('1/a.webp')
    const { ppPath, ppUrl } = await load()

    user.value = { id: '1' }
    await nextTick()
    await settle()

    expect(getPp).toHaveBeenCalledWith('1')
    expect(ppPath.value).toBe('1/a.webp')
    expect(ppUrl.value).toBe('https://signed/1/a.webp')
  })

  it('reste sans URL quand le profil n’a pas de photo', async () => {
    const { ppPath, ppUrl } = await load()

    user.value = { id: '1' }
    await nextTick()
    await settle()

    expect(ppPath.value).toBeNull()
    expect(ppUrl.value).toBeUndefined()
    expect(getPpUrl).not.toHaveBeenCalled()
  })

  it('efface la photo à la déconnexion', async () => {
    getPp.mockResolvedValue('1/a.webp')
    const { ppPath, ppUrl } = await load()
    user.value = { id: '1' }
    await nextTick()
    await settle()

    user.value = null
    await nextTick()

    expect(ppPath.value).toBeNull()
    expect(ppUrl.value).toBeUndefined()
  })

  it('ignore la réponse d’un compte précédent si l’on change de compte entre-temps', async () => {
    let resolveFirst!: (path: string) => void
    getPp.mockImplementationOnce(() => new Promise<string>((resolve) => (resolveFirst = resolve))).mockResolvedValueOnce('2/b.webp')
    const { ppPath } = await load()

    user.value = { id: '1' }
    await nextTick()
    user.value = { id: '2' }
    await nextTick()
    await settle()
    resolveFirst('1/a.webp')
    await settle()

    expect(ppPath.value).toBe('2/b.webp')
  })

  it('retombe sur l’absence de photo, sans planter, si la lecture échoue', async () => {
    getPp.mockRejectedValue(new Error('boom'))
    const { ppPath, ppUrl } = await load()

    user.value = { id: '1' }
    await nextTick()
    await settle()

    expect(ppPath.value).toBeNull()
    expect(ppUrl.value).toBeUndefined()
    expect(console.error).toHaveBeenCalled()
  })

  it('setPp met à jour la photo partout, ou la retire avec null', async () => {
    const { ppPath, ppUrl, setPp } = await load()

    await setPp('1/new.webp')
    expect(ppPath.value).toBe('1/new.webp')
    expect(ppUrl.value).toBe('https://signed/1/new.webp')

    await setPp(null)
    expect(ppPath.value).toBeNull()
    expect(ppUrl.value).toBeUndefined()
  })

  it('renouvelle l’URL signée avant son expiration (1 h)', async () => {
    const { ppUrl, setPp } = await load()
    await setPp('1/a.webp')
    expect(getPpUrl).toHaveBeenCalledTimes(1)

    getPpUrl.mockResolvedValue('https://signed/renewed')
    await vi.advanceTimersByTimeAsync(50 * 60 * 1000)

    expect(getPpUrl).toHaveBeenCalledTimes(2)
    expect(ppUrl.value).toBe('https://signed/renewed')
  })
})
