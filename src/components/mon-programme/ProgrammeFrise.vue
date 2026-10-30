<script setup lang="ts">
import { computed } from 'vue'
import Like from '../ui/Like.vue'
import { construireFrise, formatCreneau, messageConflit } from '../../lib/mon-programme'
import type { ProgrammeItem } from '../../types/ui/mon-programme'

const props = defineProps<{ items: ProgrammeItem[] }>()

const frise = computed(() => construireFrise(props.items))

function ficheDe(item: ProgrammeItem) {
  return { name: 'fiche', params: { type: item.target.type, id: item.target.id } }
}
</script>

<template>
  <div class="frise">

    <div v-if="frise.colonnes.length" class="frise__defilement">
      <div
        class="frise__grille"
        :style="{ '--frise-duree': frise.duree, '--frise-colonnes': frise.colonnes.length }"
      >
        <div class="frise__coin" aria-hidden="true" />
        <p v-for="colonne in frise.colonnes" :key="colonne.id" class="frise__entete" aria-hidden="true">
          {{ colonne.label }}
        </p>

        <ol class="frise__axe" aria-hidden="true">
          <li
            v-for="heure in frise.heures"
            :key="heure.position"
            class="frise__heure"
            :style="{ '--position': heure.position }"
          >
            {{ heure.label }}
          </li>
        </ol>

        <ul
          v-for="colonne in frise.colonnes"
          :key="colonne.id"
          class="frise__colonne"
          :aria-label="colonne.label"
        >
          <li
            v-for="bloc in colonne.blocs"
            :key="bloc.item.key"
            class="frise__bloc"
            :class="{
              'frise__bloc--conflit': bloc.item.conflits.length > 0,
              'frise__bloc--fin-inconnue': bloc.finInconnue,
            }"
            :style="{
              '--debut': bloc.debut,
              '--duree': bloc.duree,
              '--piste': bloc.piste,
              '--pistes': bloc.pistes,
            }"
          >
            <div class="frise__contenu">
              <RouterLink :to="ficheDe(bloc.item)" class="frise__nom">{{ bloc.item.nom }}</RouterLink>
              <p class="frise__details">{{ formatCreneau(bloc.item) }}</p>
              <p v-if="bloc.item.target.type === 'conference' && bloc.item.lieu" class="frise__details">
                {{ bloc.item.lieu }}
              </p>
              <p v-if="bloc.item.conflits.length" class="frise__sr-only">{{ messageConflit(bloc.item) }}</p>
              <Like
                class="frise__like"
                :target="bloc.item.target"
                :label="`Ajouter ${bloc.item.nom} à Mon programme`"
              />
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="frise.sansHoraire.length" class="frise__sans-horaire">
      <p class="frise__sans-horaire-titre">Horaire à confirmer</p>
      <ul>
        <li v-for="item in frise.sansHoraire" :key="item.key" class="frise__sans-horaire-item">
          <RouterLink :to="ficheDe(item)" class="frise__nom">{{ item.nom }}</RouterLink>
          <Like :target="item.target" :label="`Ajouter ${item.nom} à Mon programme`" />
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.frise {
  --frise-minute: 0.09rem;
  --frise-axe-largeur: 3rem;
  --frise-colonne-min: 11rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.frise__defilement {
  overflow-x: auto;
  padding-bottom: var(--space-3);
}

.frise__grille {
  display: grid;
  grid-template-columns:
    var(--frise-axe-largeur)
    repeat(var(--frise-colonnes), minmax(var(--frise-colonne-min), 1fr));
  grid-template-rows: auto calc(var(--frise-duree) * var(--frise-minute));
  row-gap: var(--space-3);
}

.frise__coin,
.frise__axe {
  position: sticky;
  left: 0;
  z-index: 1;
  background-color: var(--bg);
}

.frise__entete {
  margin: 0;
  padding: 0 var(--space-1);
  font-weight: var(--font-weight-semi-bold);
  color: var(--text-h);
  text-align: center;
}

.frise__axe,
.frise__colonne,
.frise__sans-horaire ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.frise__heure {
  position: absolute;
  top: calc(var(--position) * var(--frise-minute));
  transform: translateY(-50%);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semi-bold);
  color: var(--text-h);
}

.frise__colonne {
  position: relative;
  border-left: 1px solid var(--border);
  background-image: linear-gradient(var(--border) 1px, transparent 1px);
  background-size: 100% calc(60 * var(--frise-minute));
}

.frise__bloc {
  position: absolute;
  top: calc(var(--debut) * var(--frise-minute));
  height: calc(var(--duree) * var(--frise-minute));
  left: calc(var(--piste) / var(--pistes) * 100%);
  width: calc(100% / var(--pistes));
  padding: 2px var(--space-1);
  box-sizing: border-box;
}

.frise__contenu {
  position: relative;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) 2.5rem var(--space-2) var(--space-3);
  border-left: 4px solid var(--card-text);
  border-radius: var(--radius-small);
  background-color: var(--card-background);
  color: var(--card-text);
}

.frise__bloc--conflit .frise__contenu {
  border-left-color: var(--alert-danger-border);
  outline: 2px solid var(--alert-danger-border);
  outline-offset: -2px;
  background-color: var(--alert-danger-background);
  color: var(--alert-danger-text);
}

.frise__bloc--fin-inconnue .frise__contenu {
  border-bottom: 2px dashed currentColor;
}

.frise__nom {
  font-weight: var(--font-weight-semi-bold);
  line-height: 1.2;
  color: inherit;
  text-decoration: none;
  overflow-wrap: break-word;
}

.frise__nom:hover,
.frise__nom:focus-visible {
  text-decoration: underline;
}

.frise__details {
  margin: 0;
  font-size: var(--font-size-small);
  white-space: nowrap;
}

.frise__like {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
}

.frise__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.frise__sans-horaire {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.frise__sans-horaire-titre {
  margin: 0;
  font-weight: var(--font-weight-semi-bold);
}

.frise__sans-horaire-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-small);
  background-color: var(--card-background);
  color: var(--card-text);
}

@media (min-width: 1025px) {
  .frise {
    --frise-minute: 0.1rem;
    --frise-axe-largeur: 4rem;
  }
}
</style>
