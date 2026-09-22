<script setup lang="ts">
import Tag from './Tag.vue'
import cardBg from '../../assets/card/card-bg.png'

defineProps<{
  nom: string
  photo: string
  date?: string
  scene?: string
  categorie?: string
}>()

const patternStyle = {
  backgroundImage: `url(${cardBg})`,
}
</script>

<template>
  <article class="content-card shadow">
    <div class="content-card__pattern" :style="patternStyle" aria-hidden="true" />

    <div class="content-card__informations">
      <div class="content-card__details">
        <h3 class="content-card__nom">{{ nom }}</h3>
        <div v-if="scene || date" class="content-card__meta">
          <p v-if="scene" class="content-card__scene">{{ scene }}</p>
          <p v-if="date" class="content-card__date">{{ date }}</p>
        </div>
      </div>

      <Tag v-if="categorie" :label="categorie" variant="pink-bright" class="content-card__categorie" />
    </div>

    <img :src="photo" alt="" class="content-card__photo" />
  </article>
</template>

<style scoped>
.content-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--card-gap);
  width: 17.8125rem;
  box-sizing: border-box;
  border-radius: var(--card-radius);
  padding: var(--card-padding-y) var(--card-padding-x);
  background-color: var(--card-background);
  color: var(--card-text);
}

.content-card__pattern {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.25;
  pointer-events: none;
}

.content-card__informations {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.content-card__details {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  word-break: break-word;
}

.content-card__nom {
  margin: 0;
  font-size: var(--font-size-heading-2);
  line-height: var(--line-height-heading-2);
  color: inherit;
}

.content-card__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-semi-bold);
  line-height: var(--line-height-medium);
}

.content-card__categorie {
  flex-shrink: 0;
}

.content-card__photo {
  position: relative;
  display: block;
  width: 100%;
  height: 10rem;
  object-fit: cover;
}
</style>
