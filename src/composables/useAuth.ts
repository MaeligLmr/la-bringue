import { computed, ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../supabase.js'

const user = ref<User | null>(null)

// Resolves once the initial session (if any persisted in localStorage by
// Supabase) has been loaded, so route guards can await it instead of
// racing a false "not logged in" on page refresh.
let resolveReady!: () => void
const ready = new Promise<void>((resolve) => {
  resolveReady = resolve
})

supabase.auth.getSession().then(({ data }) => {
  user.value = data.session?.user ?? null
  resolveReady()
})

// Keeps `user` in sync with every future auth event (sign in, sign out,
// token refresh) — regardless of which part of the app triggered it.
supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ?? null
})

export function useAuth() {
  return {
    user,
    isLoggedIn: computed(() => user.value !== null),
    ready,
    signOut: () => supabase.auth.signOut(),
  }
}
