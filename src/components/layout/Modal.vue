<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useFocusTrap } from '../../composables/useFocusTrap'
import Button from '../ui/Button.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    closeLabel?: string
  }>(),
  {
    closeLabel: 'Fermer',
  }
)

const emit = defineEmits<{ close: [] }>()

const dialogEl = ref<HTMLElement | null>(null)
useFocusTrap(dialogEl, toRef(props, 'open'))

// One id per instance so aria-labelledby/id stay unique with several
// <Modal> mounted at once.
const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal__backdrop" @click.self="close" @keydown.esc="close">
      <div
        ref="dialogEl"
        class="modal__dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
      >
        <Button
          type="button"
          color="secondary"
          variant="ghost"
          icon-only="close"
          :label="closeLabel"
          class="modal__close"
          @click="close"
        />
        <h2 v-if="title" :id="titleId">{{ title }}</h2>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal__backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.modal__dialog {
  position: relative;
  width: min(90vw, 400px);
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--space-8) var(--space-6) var(--space-6);
  background: var(--bg);
  color: var(--text-h);
  border: 1px solid var(--border);
  border-radius: var(--radius-medium);
}

.modal__dialog h2 {
  margin: 0 0 var(--space-4);
}

.modal__close {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
}
</style>
