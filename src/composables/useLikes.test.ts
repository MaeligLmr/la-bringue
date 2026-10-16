import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLikes, LIKE_ADDED_MESSAGE } from './useLikes'

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn() } }))
vi.mock('vue-sonner', () => ({ toast }))

const ARTISTE = { id: 7, type: 'artiste' } as const
const CONFERENCE = { id: 7, type: 'conference' } as const

beforeEach(() => {
  vi.clearAllMocks()
  useLikes().setLiked(ARTISTE, false)
  useLikes().setLiked(CONFERENCE, false)
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
})
