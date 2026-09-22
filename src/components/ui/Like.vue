<script setup lang="ts">
import Icon from './Icon.vue'

withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: 'Ajouter à Mon programme',
  }
)

const isLiked = defineModel<boolean>({ default: false })
</script>

<template>
  <button
    type="button"
    class="like"
    :aria-label="label"
    :aria-pressed="isLiked"
    @click="isLiked = !isLiked"
  >
    <Icon :name="isLiked ? 'heart-filled' : 'heart'" size="medium" />
  </button>
</template>

<style scoped>
.like {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--like-padding-y) var(--like-padding-x);
  border: none;
  border-radius: var(--like-radius);
  background-color: var(--like-background);
  color: var(--like-icon);
  cursor: pointer;
}
</style>
