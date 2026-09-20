import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProfileView from '../views/ProfileView.vue'
import ProgrammationView from '../views/ProgrammationView.vue'
import BilletterieView from '../views/BilletterieView.vue'
import MonProgrammeView from '../views/MonProgrammeView.vue'
import ExposantsView from '../views/ExposantsView.vue'
import ConferencesView from '../views/ConferencesView.vue'
import AProposView from '../views/AProposView.vue'
import InfosPratiquesView from '../views/InfosPratiquesView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    // Pas de garde de navigation : accessible déconnecté, ProfileView
    // affiche alors les boutons connexion/inscription à la place du
    // formulaire de profil.
    { path: '/profil', name: 'profil', component: ProfileView },
    { path: '/programmation', name: 'programmation', component: ProgrammationView },
    { path: '/billetterie', name: 'billetterie', component: BilletterieView },
    { path: '/mon-programme', name: 'mon-programme', component: MonProgrammeView },
    { path: '/exposants', name: 'exposants', component: ExposantsView },
    { path: '/conferences', name: 'conferences', component: ConferencesView },
    { path: '/a-propos', name: 'a-propos', component: AProposView },
    { path: '/infos-pratiques', name: 'infos-pratiques', component: InfosPratiquesView },
  ],
})
