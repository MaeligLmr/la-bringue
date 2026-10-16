<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import Hero from '../components/layout/Hero.vue'
import Loader from '../components/ui/Loader.vue'
import { infoPratiqueHandler } from '../handlers/info-pratique'
import type { InfoPratique } from '../types/database/info-pratique'

const LOAD_ERROR_MESSAGE = 'Impossible de charger les infos pratiques pour le moment.'

// Déjà triées par id_info côté Supabase : l'ordre de la page est celui de la base.
const sections = ref<InfoPratique[]>([])
const loading = ref(true)
const failed = ref(false)

onMounted(async () => {
  try {
    sections.value = await infoPratiqueHandler.getAll()
  } catch (error) {
    console.error(error)
    failed.value = true
    toast.error(LOAD_ERROR_MESSAGE)
  } finally {
    loading.value = false
  }
})

// Ancre stable d'une section : « Accès & transport » → « acces-transport ».
function anchor(titre: string | null, id: number) {
  const slug = (titre ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || `section-${id}`
}
</script>

<template>
  <main class="infos-pratiques">
    <Hero />
    <div class="infos-pratiques__content">
      <h1>Infos pratiques</h1>

      <Loader v-if="loading" />
      <p v-else-if="failed" class="infos-pratiques__erreur" role="alert">
        Impossible de charger les infos pratiques pour le moment. Réessayez dans quelques instants.
      </p>

      <template v-else>
        <nav class="infos-pratiques__nav" aria-label="Sections de la page">
          <a v-for="section in sections" :key="section.id_info" :href="`#${anchor(section.titre, section.id_info)}`">
            {{ section.titre }}
          </a>
        </nav>

        <section
          v-for="section in sections"
          :id="anchor(section.titre, section.id_info)"
          :key="section.id_info"
          class="infos-section"
          :aria-labelledby="`${anchor(section.titre, section.id_info)}-titre`"
        >
          <h2 :id="`${anchor(section.titre, section.id_info)}-titre`">{{ section.titre }}</h2>
          <p v-if="section.intro" class="infos-section__intro">{{ section.intro }}</p>
          <dl class="infos-section__points">
            <div v-for="point in section.points" :key="point.label" class="infos-section__point">
              <dt>{{ point.label }}</dt>
              <dd>{{ point.detail }}</dd>
            </div>
          </dl>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.infos-pratiques__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: 60rem;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}

.infos-pratiques__nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.infos-pratiques__nav a {
  padding: var(--space-1-5) var(--space-3);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-h);
  text-decoration: none;
}

.infos-pratiques__nav a:hover,
.infos-pratiques__nav a:focus-visible {
  text-decoration: underline;
}

.infos-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  scroll-margin-top: var(--space-20);
}

.infos-section__intro {
  margin: 0;
}

.infos-section__points {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.infos-section__point {
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--space-3);
}

.infos-section__point dt {
  font-weight: 700;
  color: var(--text-h);
}

.infos-section__point dd {
  margin: var(--space-1) 0 0;
}
</style>
