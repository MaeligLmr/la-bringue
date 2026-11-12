<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import Hero from '../../components/layout/Hero/Hero.vue'
import Button from '../../components/ui/Button/Button.vue'
import Loader from '../../components/ui/Loader/Loader.vue'
import ProgrammeFrise from '../../components/mon-programme/ProgrammeFrise/ProgrammeFrise.vue'
import { useAuth } from '../../composables/useAuth/useAuth'
import { useAuthModal } from '../../composables/useAuthModal/useAuthModal'
import { useLikes } from '../../composables/useLikes/useLikes'
import { useNotifications } from '../../composables/useNotifications/useNotifications'
import { concertHandler } from '../../handlers/concert'
import { conferenceHandler } from '../../handlers/conference'
import { toArtisteCards, toConferenceCards } from '../../lib/cards/cards'
import { EMPTY_MESSAGE, groupProgrammeByJour } from '../../lib/mon-programme/mon-programme'
import type { ArtisteCard } from '../../types/ui/programmation'
import type { ConferenceCard } from '../../types/ui/conferences'
import { useScrollReveal } from '../../composables/useScrollReveal/useScrollReveal'

const router = useRouter()
const { isLoggedIn, ready } = useAuth()
const { open } = useAuthModal()
const { isLiked, likedIds, likesReady } = useLikes()
const { unread, markAllRead } = useNotifications()

const artistes = ref<ArtisteCard[]>([])
const conferences = ref<ConferenceCard[]>([])
const contentLoading = ref(true)

// Tant que la session n'est pas restaurée, isLoggedIn vaut false : on attend
// avant d'afficher l'invitation à se connecter.
const authChecked = ref(false)
ready.then(() => (authChecked.value = true))

// On ne charge que les concerts et conférences likés, et seulement une fois
// les likes connus : déconnectée, aucune requête n'est envoyée.
watch(
  () => isLoggedIn.value && likesReady.value,
  async (shouldLoad) => {
    if (!shouldLoad) return
    contentLoading.value = true
    try {
      const [concerts, rows] = await Promise.all([
        concertHandler.getByArtistes(likedIds('artiste')),
        conferenceHandler.getByIds(likedIds('conference')),
      ])
      artistes.value = toArtisteCards(concerts)
      conferences.value = toConferenceCards(rows)
    } catch (error) {
      console.error(error)
      toast.error('Impossible de charger ton programme.')
    } finally {
      contentLoading.value = false
    }
  },
  { immediate: true }
)

const loading = computed(
  () => !authChecked.value || (isLoggedIn.value && (contentLoading.value || !likesReady.value))
)

const jours = computed(() =>
  groupProgrammeByJour(
    artistes.value.filter((card) => isLiked({ id: card.idArtiste, type: 'artiste' })),
    conferences.value.filter((card) => isLiked({ id: card.id, type: 'conference' }))
  )
)

// Apparition des titres, textes et cartes au défilement.
useScrollReveal()
</script>

<template>
  <main class="mon-programme">
    <Hero />
    <div class="mon-programme__content">
      <h2 class="mon-programme__title">Mon programme</h2>

      <section
        v-if="isLoggedIn && unread.length"
        class="mon-programme__changements"
        aria-labelledby="mon-programme-changements"
      >
        <h3 id="mon-programme-changements">Changements récents</h3>
        <ul>
          <li v-for="notification in unread" :key="notification.id_notification">{{ notification.message }}</li>
        </ul>
        <Button color="primary" variant="outlined" @click="markAllRead">Marquer comme lu</Button>
      </section>

      <Loader v-if="loading" />

      <div v-else-if="!isLoggedIn" class="mon-programme__message">
        <p>Connecte-toi pour retrouver les artistes et conférences que tu as likés.</p>
        <Button color="primary" variant="full" @click="open('login')">Se connecter</Button>
      </div>

      <div v-else-if="jours.length === 0" class="mon-programme__message">
        <p>{{ EMPTY_MESSAGE }}</p>
        <Button color="primary" variant="full" @click="router.push('/programmation')">
          Voir la programmation
        </Button>
      </div>

      <template v-else>
        <section
          v-for="jour in jours"
          :key="jour.jour"
          class="mon-programme__jour"
          :aria-labelledby="`mon-programme-${jour.jour || 'a-confirmer'}`"
        >
          <h3 :id="`mon-programme-${jour.jour || 'a-confirmer'}`" class="mon-programme__jour-titre">
            {{ jour.label }}
          </h3>
          <ProgrammeFrise :items="jour.items" />
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.mon-programme__changements {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-medium);
  background: var(--accent-bg);
}

.mon-programme__changements h3,
.mon-programme__changements ul {
  margin: 0;
}

.mon-programme__changements ul {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-left: var(--space-5);
}

.mon-programme__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-8) var(--space-4) var(--space-10);
}

.mon-programme__title,
.mon-programme__jour-titre {
  margin: 0;
}

.mon-programme__message {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
}

.mon-programme__message p {
  margin: 0;
}

.mon-programme__jour + .mon-programme__jour {
  margin-top: var(--space-8);
}

.mon-programme__jour {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

@media (min-width: 1025px) {
  .mon-programme__content {
    padding: var(--space-8) var(--space-20) var(--space-10);
  }
}
</style>
