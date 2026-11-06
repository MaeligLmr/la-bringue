import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    // Masque la section Support (SupportSection, au-dessus du footer).
    hideSupport?: boolean
  }
}
// HomeView reste importée statiquement (page d'arrivée) ; les autres vues sont
// chargées à la demande pour alléger le bundle initial.
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
