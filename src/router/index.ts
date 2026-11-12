import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    // Masque la section Support (SupportSection, au-dessus du footer).
    hideSupport?: boolean
    requiresAdmin?: boolean
  }
}
import { useAuth } from '../composables/useAuth/useAuth'
import { ADMIN_SECTIONS } from '../lib/admin-sections/admin-sections'
import HomeView from '../views/HomeView/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    // Pas de garde de navigation : accessible déconnecté, ProfileView
    // affiche alors les boutons connexion/inscription à la place du
    // formulaire de profil.
    // hideSupport : pas de section « Ils nous soutiennent » sur le profil.
    { path: '/profil', name: 'profil', component: () => import('../views/ProfileView/ProfileView.vue'), meta: { hideSupport: true } },
    { path: '/programmation', name: 'programmation', component: () => import('../views/ProgrammationView/ProgrammationView.vue') },
    { path: '/billetterie', name: 'billetterie', component: () => import('../views/BilletterieView/BilletterieView.vue') },
    { path: '/mon-programme', name: 'mon-programme', component: () => import('../views/MonProgrammeView/MonProgrammeView.vue') },
    { path: '/exposants', name: 'exposants', component: () => import('../views/ExposantsView/ExposantsView.vue') },
    { path: '/conferences', name: 'conferences', component: () => import('../views/ConferencesView/ConferencesView.vue') },
    { path: '/a-propos', name: 'a-propos', component: () => import('../views/AProposView/AProposView.vue') },
    { path: '/infos-pratiques', name: 'infos-pratiques', component: () => import('../views/InfosPratiquesView/InfosPratiquesView.vue') },
    { path: '/actualites', name: 'actualites', component: () => import('../views/ActualitesView/ActualitesView.vue') },
    {
      path: '/actualites/:id(\\d+)',
      name: 'actualite',
      component: () => import('../views/ActualiteDetailView/ActualiteDetailView.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
    },
    {
      path: '/:type(artiste|conference|exposant)/fiche/:id(\\d+)',
      name: 'fiche',
      component: () => import('../views/FicheDetail/FicheDetail.vue'),
      props: (route) => ({ type: route.params.type, id: Number(route.params.id) }),
    },
    {
      path: '/admin',
      component: () => import('../components/layout/AdminLayout/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        { path: '', name: 'admin', redirect: { name: ADMIN_SECTIONS[0].name } },
        {
          path: 'artistes',
          children: [
            {
              path: '',
              name: 'admin-artistes',
              component: () => import('../views/admin/AdminArtistesView/AdminArtistesView.vue'),
            },
            {
              path: 'nouvelle',
              name: 'admin-artiste-nouvelle',
              component: () => import('../views/admin/AdminArtisteFormView/AdminArtisteFormView.vue'),
            },
            {
              path: ':id(\\d+)',
              name: 'admin-artiste',
              component: () => import('../views/admin/AdminArtisteFormView/AdminArtisteFormView.vue'),
              props: (route) => ({ id: Number(route.params.id) }),
            },
          ],
        },
        {
          path: 'concerts',
          children: [
            {
              path: '',
              name: 'admin-concerts',
              component: () => import('../views/admin/AdminConcertsView/AdminConcertsView.vue'),
            },
            {
              path: 'nouveau',
              name: 'admin-concert-nouveau',
              component: () => import('../views/admin/AdminConcertFormView/AdminConcertFormView.vue'),
            },
            {
              path: ':id(\\d+)',
              name: 'admin-concert',
              component: () => import('../views/admin/AdminConcertFormView/AdminConcertFormView.vue'),
              props: (route) => ({ id: Number(route.params.id) }),
            },
          ],
        },
        ...ADMIN_SECTIONS.filter((section) => !['admin-artistes', 'admin-concerts'].includes(section.name)).map((section) => ({
          path: section.path,
          name: section.name,
          component: () => import('../views/admin/AdminSectionView/AdminSectionView.vue'),
          props: { title: section.label },
        })),
      ],
    },
  ],
  // Fiche ouverte depuis le bas d'une liste : on repart du haut de page.
  // Un simple changement de query (filtres) ne fait pas défiler.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // Lien d'ancre vers une autre page : la vue défile elle-même vers la
    // section une fois ses données chargées (elle n'existe pas encore ici).
    if (to.hash) return false
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAdmin) return
  const { ready, isAdmin } = useAuth()
  await ready
  if (!isAdmin.value) return { name: 'home' }
})
