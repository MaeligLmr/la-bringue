<script setup lang="ts">
import Icon from './Icon.vue'
import { useAuth } from '../../composables/useAuth'
import { useAuthModal } from '../../composables/useAuthModal'
import type { LikeTarget } from '../../types/ui/like'

const props = withDefaults(
  defineProps<{
    label?: string
    target?: LikeTarget
  }>(),
  {
    label: 'Ajouter à Mon programme',
  }
)

const isLiked = defineModel<boolean>({ default: false })

const { isLoggedIn, ready } = useAuth()
const { open } = useAuthModal()

async function toggle() {
  await ready
  if (!isLoggedIn.value) {
    open('login', props.target)
    return
  }
  isLiked.value = !isLiked.value
}
</script>

<template>
  <button
    type="button"
    class="like"
    :aria-label="label"
    :aria-pressed="isLiked"
    @click="toggle"
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
