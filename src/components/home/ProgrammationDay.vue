<script setup lang="ts">
import Icon from '../ui/Icon.vue'
import type { DayLineup } from '../../lib/programmation'

defineProps<{
  label: string
  lineup: DayLineup
}>()
</script>

<template>
  <div class="programmation-day">
    <p class="programmation-day__jour">{{ label }}</p>

    <p v-if="lineup.headliner" class="programmation-day__headliner">{{ lineup.headliner.nom }}</p>

    <ul v-if="lineup.others.length" class="programmation-day__others">
      <li v-for="(artiste, index) in lineup.others" :key="artiste.id" class="programmation-day__artiste">
        <Icon v-if="index > 0" name="star-separation" size="small" class="programmation-day__separator" />
        {{ artiste.nom }}<template v-if="index === lineup.others.length - 1">…</template>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.programmation-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
  color: var(--main-color);
}

.programmation-day__jour {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  max-width: 32rem;
  margin: 0 0 var(--space-1);
  color: var(--hero-section-h1);
}

.programmation-day__jour::before,
.programmation-day__jour::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: currentColor;
}

.programmation-day__headliner {
  margin: 0;
  overflow-wrap: break-word;
  font-size: var(--font-size-heading-3);
  line-height: var(--line-height-heading-3);
  font-family: var(--heading);
  font-weight: var(--font-weight-medium);
  color: var(--text-h);
}

.programmation-day__others {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-1) var(--space-3);
  max-width: 48rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.programmation-day__artiste {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
}

.programmation-day__separator {
  color: var(--hero-section-h1);
}
</style>
