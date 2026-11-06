import { describe, it, expect, beforeEach, vi } from 'vitest'

// useAuth holds module-level singleton state (initialized from
// supabase.auth.getSession() the moment the module loads), so each test
// resets the module registry and re-mocks supabase before re-importing it
// fresh — otherwise state (and which mock it captured) would leak
// between tests.
function mockSupabase({
  session = null,
  roles = {},
}: {
  session?: { user: { id: string; email: string } } | null
  roles?: Record<string, string>
} = {}) {
  const onAuthStateChange = vi.fn()
  const signOut = vi.fn().mockResolvedValue({ error: null })
  const getSession = vi.fn().mockResolvedValue({ data: { session } })
  const eq = vi.fn((_column: string, id: string) => ({
    maybeSingle: vi.fn().mockResolvedValue({ data: roles[id] ? { role: roles[id] } : null, error: null }),
  }))
  const from = vi.fn(() => ({ select: vi.fn(() => ({ eq })) }))

  vi.doMock('../../supabase.js', () => ({
    supabase: { from, auth: { getSession, onAuthStateChange, signOut } },
  }))

  return { getSession, onAuthStateChange, signOut, from }
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

  it('isAdmin vaut true dès ready pour une session admin persistée', async () => {
    const user = { id: 'admin-1', email: 'orga@example.com' }
    mockSupabase({ session: { user }, roles: { 'admin-1': 'admin' } })

    const { useAuth } = await import('./useAuth')
    const { isAdmin, ready } = useAuth()
    await ready

    expect(isAdmin.value).toBe(true)
  })

  it("isAdmin reste false pour une utilisatrice sans rôle admin", async () => {
    const user = { id: 'user-1', email: 'alice@example.com' }
    mockSupabase({ session: { user }, roles: { 'user-1': 'user' } })

    const { useAuth } = await import('./useAuth')
    const { isAdmin, ready } = useAuth()
    await ready

    expect(isAdmin.value).toBe(false)
  })

  it('isAdmin suit la connexion puis la déconnexion sans recharger la page', async () => {
    const { onAuthStateChange } = mockSupabase({ session: null, roles: { 'admin-1': 'admin' } })

    const { useAuth } = await import('./useAuth')
    const { isAdmin, ready } = useAuth()
    await ready
    expect(isAdmin.value).toBe(false)

    const listener = onAuthStateChange.mock.calls[0][0]
    listener('SIGNED_IN', { user: { id: 'admin-1', email: 'orga@example.com' } })
    await vi.waitFor(() => expect(isAdmin.value).toBe(true))

    listener('SIGNED_OUT', null)
    expect(isAdmin.value).toBe(false)
  })

  it('ne relit pas le rôle à un simple rafraîchissement du token', async () => {
    const user = { id: 'admin-1', email: 'orga@example.com' }
    const { onAuthStateChange, from } = mockSupabase({ session: { user }, roles: { 'admin-1': 'admin' } })

    const { useAuth } = await import('./useAuth')
    await useAuth().ready

    const listener = onAuthStateChange.mock.calls[0][0]
    listener('TOKEN_REFRESHED', { user: { ...user } })

    expect(from).toHaveBeenCalledOnce()
  })

  it('ready se résout même si getSession rejette, et reste déconnecté', async () => {
    const { getSession } = mockSupabase()
    getSession.mockRejectedValue(new Error('réseau'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { useAuth } = await import('./useAuth')
    const { user, ready } = useAuth()
    await ready

    expect(user.value).toBeNull()
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })

  it('journalise une erreur de lecture du rôle et laisse isAdmin à false', async () => {
    const user = { id: 'admin-1', email: 'orga@example.com' }
    mockSupabase({ session: { user } })
    vi.doMock('../../supabase.js', () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: null, error: { message: 'permission denied' } }) }),
          }),
        }),
        auth: {
          getSession: async () => ({ data: { session: { user } } }),
          onAuthStateChange: vi.fn(),
        },
      },
    }))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { useAuth } = await import('./useAuth')
    const { isAdmin, ready } = useAuth()
    await ready

    expect(isAdmin.value).toBe(false)
    expect(error).toHaveBeenCalledWith('[useAuth] lecture du rôle impossible', { message: 'permission denied' })
    error.mockRestore()
  })

  it('signOut() appelle supabase.auth.signOut', async () => {
    const { signOut } = mockSupabase({ session: null })

    const { useAuth } = await import('./useAuth')
    await useAuth().signOut()

    expect(signOut).toHaveBeenCalledOnce()
  })
})
