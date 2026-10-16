<script setup lang="ts">
import Button from '../ui/Button.vue'
import Tag from '../ui/Tag.vue'
import type { FormuleCard } from '../../types/ui/billetterie'

// Une formule de la grille de billetterie : durée, dates, prix, contenu, statut
// et bouton d'achat. Purement présentationnelle : l'ouverture de la billetterie
// externe est laissée à la page, via l'événement `buy`.
defineProps<{ formule: FormuleCard }>()

const emit = defineEmits<{ buy: [] }>()

// « Plus que 3 jours », « Dernier jour ! » : l'urgence se dit en jours restants.
function delai(joursRestants: number) {
  if (joursRestants <= 0) return 'Dernier jour !'
  return joursRestants === 1 ? 'Plus que 1 jour' : `Plus que ${joursRestants} jours`
}
</script>

<template>
  <article class="formule shadow" :class="{ 'formule--complet': formule.complet }">
    <!-- Date limite : mise en avant en tête de carte, renforcée quand elle approche. -->
    <p v-if="formule.promo" class="formule__promo" :class="{ 'formule__promo--urgente': formule.promo.urgente }">
      <strong>{{ formule.promo.nom }} −{{ formule.promo.reduction }} %</strong>
      <span v-if="formule.promo.jusquAu">jusqu’au {{ formule.promo.jusquAu }}</span>
      <span v-if="formule.promo.urgente && formule.promo.joursRestants !== null" class="formule__delai">
        {{ delai(formule.promo.joursRestants) }}
      </span>
    </p>

    <header class="formule__entete">
      <h2 class="formule__titre">{{ formule.titre }}</h2>
      <Tag v-if="formule.duree" :label="formule.duree" variant="blue" />
    </header>

    <p v-if="formule.dates" class="formule__dates">{{ formule.dates }}</p>

    <p v-if="formule.prix" class="formule__prix">
      <s v-if="formule.prixInitial" class="formule__prix-initial">
        <span class="sr-only">Prix initial :</span>{{ formule.prixInitial }}
      </s>
      <strong class="formule__prix-final">{{ formule.prix }}</strong>
    </p>

    <p v-if="formule.description" class="formule__contenu">{{ formule.description }}</p>

    <p class="formule__statut">
      <Tag v-if="formule.complet" label="Complet" variant="pink-bright" />
      <Tag
        v-else-if="formule.placesRestantes"
        :label="`Plus que ${formule.placesRestantes} places`"
        variant="pink-bright"
      />
      <Tag v-else label="Disponible" variant="violet" />
    </p>

    <Button
      class="formule__cta"
      :disabled="formule.complet || !formule.lienShotgun"
      icon-right="ticket"
      @click="emit('buy')"
    >
      {{ formule.complet ? 'Complet' : formule.lienShotgun ? 'Acheter' : 'Bientôt disponible' }}
    </Button>
  </article>
</template>

<style scoped>
.formule {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
  box-sizing: border-box;
  overflow: hidden;
  padding: var(--card-padding-y) var(--card-padding-x) var(--card-padding-y);
  border-radius: var(--card-radius);
  background: var(--card-background);
  color: var(--card-text);
}

/* Formule complète : atténuée, mais toujours lisible. */
.formule--complet {
  opacity: 0.7;
}

/* Bandeau de promotion : pleine largeur de carte, couleurs vives des Tag. */
.formule__promo {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1) var(--space-3);
  margin: calc(var(--card-padding-y) * -1) calc(var(--card-padding-x) * -1) 0;
  padding: var(--space-2) var(--card-padding-x);
  background: var(--tag-pink-bright-background);
  color: var(--tag-pink-bright-text);
}

/* Date limite proche : fond d'accent, impossible à manquer. */
.formule__promo--urgente {
  background: var(--accent);
  color: var(--bg);
}

.formule__delai {
  margin-left: auto;
  font-weight: var(--font-weight-medium);
}

.formule__entete {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.formule__titre {
  margin: 0;
  font-size: var(--font-size-heading-3);
  line-height: var(--line-height-heading-3);
}

.formule__dates {
  margin: 0;
}

.formule__prix {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin: 0;
}

.formule__prix-initial {
  opacity: 0.7;
}

.formule__prix-final {
  font-size: var(--font-size-heading-2);
  line-height: 1;
}

.formule__contenu {
  margin: 0;
  white-space: pre-line;
}

.formule__statut {
  margin: 0;
}

/* Pousse le bouton en bas : les cartes d'une même rangée restent alignées. */
.formule__cta {
  margin-top: auto;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
