<script setup lang="ts">
import { computed } from 'vue'
import Tag from './Tag.vue'
import Like from './Like.vue'
import cardBg from '../../assets/card/card-bg.png'

const props = withDefaults(
  defineProps<{
    nom: string
    photo: string
    date?: string
    scene?: string
    categorie?: string
    likable?: boolean
    onClick?: () => void
  }>(),
  {
    likable: false,
  }
)

const isLiked = defineModel<boolean>('isLiked', { default: false })

const patternStyle = {
  backgroundImage: `url(${cardBg})`,
}

// `photo` est un chemin absolu (ex: "/programmation/placeholder.svg") vers
// public/ : il faut le préfixer par BASE_URL pour rester valide une fois
// l'app déployée sous un sous-chemin (voir vite.config.ts `base`).
const photoSrc = computed(() => import.meta.env.BASE_URL + props.photo.replace(/^\//, ''))
</script>

<template>
  <article
    class="content-card shadow"
    :class="{ 'content-card--clickable': !!onClick }"
    :tabindex="onClick ? 0 : undefined"
    @click="props.onClick?.()"
    @keydown.enter.self="props.onClick?.()"
  >
    <div class="content-card__pattern" :style="patternStyle" aria-hidden="true" />

    <div class="content-card__informations">
      <div class="content-card__details">
        <h3 class="content-card__nom">{{ nom }}</h3>
        <div v-if="scene || date" class="content-card__meta">
          <p v-if="scene" class="content-card__scene">{{ scene }}</p>
          <p v-if="date" class="content-card__date">{{ date }}</p>
        </div>
      </div>

      <div v-if="categorie || likable" class="content-card__actions">
        <Tag v-if="categorie" :label="categorie" variant="pink-bright" />
        <Like
          v-if="likable"
          v-model="isLiked"
          :label="`Ajouter ${nom} à Mon programme`"
          @click.stop
        />
      </div>
    </div>

    <img :src="photoSrc" alt="" class="content-card__photo" />
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
  max-width: 288px;
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
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-2);
}

.content-card__details {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.content-card__nom {
  margin: 0;
  font-size: var(--font-size-heading-2);
  line-height: var(--line-height-heading-2);
  color: inherit;
  min-height: 108px;
}

.content-card__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-semi-bold);
  line-height: var(--line-height-medium);
}

.content-card--clickable {
  cursor: pointer;
}

.content-card__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
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
