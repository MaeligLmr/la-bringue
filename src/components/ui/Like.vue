<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import { useAuth } from '../../composables/useAuth'
import { useAuthModal } from '../../composables/useAuthModal'
import { useLikes } from '../../composables/useLikes'
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
const likes = useLikes()

const liked = computed(() => (props.target ? likes.isLiked(props.target) : isLiked.value))

async function toggle() {
  await ready
  if (!isLoggedIn.value) {
    open('login', props.target)
    return
  }
  const next = !liked.value
  if (props.target) likes.setLiked(props.target, next)
  isLiked.value = next
}
</script>

<template>
  <button
    type="button"
    class="like"
    :aria-label="label"
    :aria-pressed="liked"
    @click="toggle"
  >
    <Icon :name="liked ? 'heart-filled' : 'heart'" size="medium" />
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
