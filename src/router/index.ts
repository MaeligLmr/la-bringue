import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import HomeView from '../views/HomeView.vue'
import ProfileView from '../views/ProfileView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/profil', name: 'profil', component: ProfileView, meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  // Wait for the persisted session (if any) to be checked before deciding
  // — otherwise a logged-in user refreshing directly on /profil would be
  // bounced to / by a false "not logged in" read before Supabase has
  // resolved.
  const { ready, isLoggedIn } = useAuth()
  await ready

  return isLoggedIn.value || { name: 'home' }
})
