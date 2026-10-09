import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    // Masque la section Support (SupportSection, au-dessus du footer).
    hideSupport?: boolean
  }
}
import HomeView from '../views/HomeView.vue'
import ProfileView from '../views/ProfileView.vue'
import ProgrammationView from '../views/ProgrammationView.vue'
import BilletterieView from '../views/BilletterieView.vue'
import MonProgrammeView from '../views/MonProgrammeView.vue'
import ExposantsView from '../views/ExposantsView.vue'
import ConferencesView from '../views/ConferencesView.vue'
import AProposView from '../views/AProposView.vue'
import InfosPratiquesView from '../views/InfosPratiquesView.vue'
import ActualitesView from '../views/ActualitesView.vue'
import FicheDetail from '../views/FicheDetail.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    // Pas de garde de navigation : accessible déconnecté, ProfileView
    // affiche alors les boutons connexion/inscription à la place du
    // formulaire de profil.
    // hideSupport : pas de section « Ils nous soutiennent » sur le profil.
    { path: '/profil', name: 'profil', component: ProfileView, meta: { hideSupport: true } },
    { path: '/programmation', name: 'programmation', component: ProgrammationView },
    { path: '/billetterie', name: 'billetterie', component: BilletterieView },
    { path: '/mon-programme', name: 'mon-programme', component: MonProgrammeView },
    { path: '/exposants', name: 'exposants', component: ExposantsView },
    { path: '/conferences', name: 'conferences', component: ConferencesView },
    { path: '/a-propos', name: 'a-propos', component: AProposView },
    { path: '/infos-pratiques', name: 'infos-pratiques', component: InfosPratiquesView },
    { path: '/actualites', name: 'actualites', component: ActualitesView },
    {
      path: '/:type(artiste|conference|exposant)/fiche/:id(\\d+)',
      name: 'fiche',
      component: FicheDetail,
      props: (route) => ({ type: route.params.type, id: Number(route.params.id) }),
    },
  ],
  // Fiche ouverte depuis le bas d'une liste : on repart du haut de page.
  // Un simple changement de query (filtres) ne fait pas défiler.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.path === from.path) return false
    return { top: 0 }
  },
})
