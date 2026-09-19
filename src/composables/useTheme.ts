import { computed, ref, watchEffect } from 'vue'

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

function readStoredPreference(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

function prefersDarkSystemTheme(): boolean {
  if (typeof matchMedia === 'undefined') return false
  return matchMedia('(prefers-color-scheme: dark)').matches
}

const preference = ref<ThemePreference>(readStoredPreference())
const systemPrefersDark = ref(prefersDarkSystemTheme())

if (typeof matchMedia !== 'undefined') {
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    systemPrefersDark.value = event.matches
  })
}

// Effective theme actually applied: the explicit user choice, or the OS
// preference when the user hasn't overridden it ('system').
const resolvedTheme = computed<'light' | 'dark'>(() =>
  preference.value === 'system' ? (systemPrefersDark.value ? 'dark' : 'light') : preference.value
)

// Reflects the resolved theme onto <html data-theme="…">, which
// src/styles/tokens/theme.css and style.css read to pick the light or
// dark set of design tokens.
watchEffect(() => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = resolvedTheme.value
})

function setPreference(next: ThemePreference) {
  preference.value = next
  if (typeof localStorage === 'undefined') return
  if (next === 'system') localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, next)
}

function toggleTheme() {
  setPreference(resolvedTheme.value === 'dark' ? 'light' : 'dark')
}

export function useTheme() {
  return { preference, resolvedTheme, setPreference, toggleTheme }
}
