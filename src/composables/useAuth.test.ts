import { describe, it, expect, beforeEach, vi } from 'vitest'

// useAuth holds module-level singleton state (initialized from
// supabase.auth.getSession() the moment the module loads), so each test
// resets the module registry and re-mocks supabase before re-importing it
// fresh — otherwise state (and which mock it captured) would leak
// between tests.
function mockSupabase({
  session = null,
}: {
  session?: { user: { id: string; email: string } } | null
} = {}) {
  const onAuthStateChange = vi.fn()
  const signOut = vi.fn().mockResolvedValue({ error: null })
  const getSession = vi.fn().mockResolvedValue({ data: { session } })

  vi.doMock('../supabase.js', () => ({
    supabase: { auth: { getSession, onAuthStateChange, signOut } },
  }))

  return { getSession, onAuthStateChange, signOut }
}

beforeEach(() => {
  vi.resetModules()
})

describe('useAuth', () => {
  it('reprend la session persistée une fois ready résolu', async () => {
    const user = { id: '1', email: 'alice@example.com' }
    mockSupabase({ session: { user } })

    const { useAuth } = await import('./useAuth')
    const { user: userRef, isLoggedIn, ready } = useAuth()

    await ready

    expect(userRef.value).toEqual(user)
    expect(isLoggedIn.value).toBe(true)
  })

  it("reste déconnecté si getSession ne renvoie aucune session", async () => {
    mockSupabase({ session: null })

    const { useAuth } = await import('./useAuth')
    const { user: userRef, isLoggedIn, ready } = useAuth()
    await ready

    expect(userRef.value).toBeNull()
    expect(isLoggedIn.value).toBe(false)
  })

  it('se met à jour quand onAuthStateChange émet un nouvel état', async () => {
    const { onAuthStateChange } = mockSupabase({ session: null })

    const { useAuth } = await import('./useAuth')
    const { user: userRef, isLoggedIn, ready } = useAuth()
    await ready

    const user = { id: '2', email: 'bob@example.com' }
    const listener = onAuthStateChange.mock.calls[0][0]
    listener('SIGNED_IN', { user })

    expect(userRef.value).toEqual(user)
    expect(isLoggedIn.value).toBe(true)

    listener('SIGNED_OUT', null)

    expect(userRef.value).toBeNull()
    expect(isLoggedIn.value).toBe(false)
  })

  it('signOut() appelle supabase.auth.signOut', async () => {
    const { signOut } = mockSupabase({ session: null })

    const { useAuth } = await import('./useAuth')
    await useAuth().signOut()

    expect(signOut).toHaveBeenCalledOnce()
  })
})
