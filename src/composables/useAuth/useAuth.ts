import { computed, ref, watch } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../supabase.js'

const user = ref<User | null>(null)
const role = ref<string | null>(null)

let roleLoaded: Promise<void> = Promise.resolve()

async function loadRole(id: string | undefined) {
  if (!id) {
    role.value = null
    return
  }
  try {
    const { data } = await supabase.from('Profil').select('role').eq('id', id).maybeSingle()
    if (user.value?.id === id) role.value = data?.role ?? null
  } catch {
    if (user.value?.id === id) role.value = null
  }
}

watch(
  () => user.value?.id,
  (id) => {
    roleLoaded = loadRole(id)
  },
  { flush: 'sync' }
)

// Resolves once the initial session (if any persisted in localStorage by
// Supabase) and its role have been loaded, so route guards can await it
// instead of racing a false "not logged in" on page refresh.
let resolveReady!: () => void
const ready = new Promise<void>((resolve) => {
  resolveReady = resolve
})

supabase.auth.getSession().then(async ({ data }) => {
  user.value = data.session?.user ?? null
  await roleLoaded
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
    isAdmin: computed(() => role.value === 'admin'),
    ready,
    signOut: () => supabase.auth.signOut(),
  }
}
