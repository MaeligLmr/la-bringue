<script setup lang="ts">
import type { TagVariant } from '../../types/tag'

withDefaults(
  defineProps<{
    label: string
    variant?: TagVariant
  }>(),
  {
    variant: 'pink',
  }
)
</script>

<template>
  <span class="tag" :class="`tag--${variant}`">{{ label }}</span>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  padding: var(--tag-padding-y) var(--tag-padding-x);
  border-radius: var(--tag-radius);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  white-space: nowrap;
}

.tag--pink {
  background-color: var(--tag-pink-background);
  color: var(--tag-pink-text);
}

.tag--pink-bright {
  background-color: var(--tag-pink-bright-background);
  color: var(--tag-pink-bright-text);
}

.tag--violet {
  background-color: var(--tag-violet-background);
  color: var(--tag-violet-text);
}

.tag--blue {
  background-color: var(--tag-blue-background);
  color: var(--tag-blue-text);
}
</style>
