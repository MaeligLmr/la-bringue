import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'

// useTheme holds module-level singleton state (shared across every call to
// useTheme()), so each test resets the module registry and re-imports it
// fresh — otherwise state (and the matchMedia listener) would leak between
// tests.
function mockMatchMedia(matches: boolean) {
  const listeners: Array<(event: { matches: boolean }) => void> = []
  const mql = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_event: string, cb: (event: { matches: boolean }) => void) => {
      listeners.push(cb)
    },
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue(mql)
  )
  return {
    fireChange(next: boolean) {
      mql.matches = next
      listeners.forEach((cb) => cb({ matches: next }))
    },
  }
}

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useTheme', () => {
  it('suit la préférence système par défaut (clair)', async () => {
    mockMatchMedia(false)
    const { useTheme } = await import('./useTheme')
    const { preference, resolvedTheme } = useTheme()

    expect(preference.value).toBe('system')
    expect(resolvedTheme.value).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('suit la préférence système par défaut (sombre)', async () => {
    mockMatchMedia(true)
    const { useTheme } = await import('./useTheme')
    const { resolvedTheme } = useTheme()

    expect(resolvedTheme.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('reprend un choix déjà stocké dans localStorage au chargement', async () => {
    localStorage.setItem('theme', 'dark')
    mockMatchMedia(false) // système en clair : le choix stocké doit primer

    const { useTheme } = await import('./useTheme')
    const { preference, resolvedTheme } = useTheme()

    expect(preference.value).toBe('dark')
    expect(resolvedTheme.value).toBe('dark')
  })

  it('mémorise un choix explicite et applique data-theme sur <html>', async () => {
    mockMatchMedia(false)
    const { useTheme } = await import('./useTheme')
    const { setPreference, resolvedTheme } = useTheme()

    setPreference('dark')
    await nextTick()

    expect(resolvedTheme.value).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('revenir sur "system" efface le choix stocké et reprend la préférence système', async () => {
    mockMatchMedia(true)
    const { useTheme } = await import('./useTheme')
    const { setPreference, resolvedTheme } = useTheme()

    setPreference('light')
    expect(localStorage.getItem('theme')).toBe('light')

    setPreference('system')
    await nextTick()

    expect(localStorage.getItem('theme')).toBeNull()
    expect(resolvedTheme.value).toBe('dark') // le système simulé préfère le sombre
  })

  it('toggleTheme bascule entre clair et sombre', async () => {
    mockMatchMedia(false)
    const { useTheme } = await import('./useTheme')
    const { toggleTheme, resolvedTheme } = useTheme()

    expect(resolvedTheme.value).toBe('light')

    toggleTheme()
    expect(resolvedTheme.value).toBe('dark')

    toggleTheme()
    expect(resolvedTheme.value).toBe('light')
  })

  it('réagit en direct à un changement de préférence système tant que rien n\'a été forcé', async () => {
    const { fireChange } = mockMatchMedia(false)
    const { useTheme } = await import('./useTheme')
    const { resolvedTheme } = useTheme()

    expect(resolvedTheme.value).toBe('light')

    fireChange(true)
    await nextTick()

    expect(resolvedTheme.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
