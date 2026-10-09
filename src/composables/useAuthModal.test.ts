import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthModal } from './useAuthModal'

const TARGET = { id: 3, type: 'conference' } as const

beforeEach(() => {
  useAuthModal().close()
})

describe('useAuthModal', () => {
  it("s'ouvre sans like en attente par défaut", () => {
    const { open, isOpen, pendingLike } = useAuthModal()

    open('signup')

    expect(isOpen.value).toBe(true)
    expect(pendingLike.value).toBeNull()
  })

  it('mémorise le like en attente à l’ouverture', () => {
    const { open, pendingLike } = useAuthModal()

    open('login', TARGET)

    expect(pendingLike.value).toEqual(TARGET)
  })

  it('abandonne le like en attente quand on ferme sans se connecter', () => {
    const { open, close, isOpen, pendingLike } = useAuthModal()

    open('login', TARGET)
    close()

    expect(isOpen.value).toBe(false)
    expect(pendingLike.value).toBeNull()
  })

  it('conserve le like en attente après une connexion réussie', () => {
    const { open, complete, isOpen, pendingLike } = useAuthModal()

    open('login', TARGET)
    complete()

    expect(isOpen.value).toBe(false)
    expect(pendingLike.value).toEqual(TARGET)
  })
})
