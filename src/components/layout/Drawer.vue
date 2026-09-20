<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useFocusTrap } from '../../composables/useFocusTrap'
import Button from '../ui/Button.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    closeLabel?: string
    /** Décale le drawer sous un en-tête fixe/sticky (ex. "4rem"). */
    top?: string
  }>(),
  {
    closeLabel: 'Fermer',
    top: '0px',
  }
)

const emit = defineEmits<{ close: [] }>()

const panelEl = ref<HTMLElement | null>(null)
useFocusTrap(panelEl, toRef(props, 'open'))

// One id per instance so aria-labelledby/id stay unique with several
// <Drawer> mounted at once.
const titleId = `drawer-title-${Math.random().toString(36).slice(2, 9)}`

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="open"
        class="drawer__backdrop"
        :style="{ top: props.top }"
        @click.self="close"
        @keydown.esc="close"
      >
        <div
          ref="panelEl"
          class="drawer__panel"
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
            class="drawer__close"
            @click="close"
          />
          <h2 v-if="title" :id="titleId">{{ title }}</h2>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer__backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.drawer__panel {
  position: relative;
  width: min(85vw, 360px);
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  padding: var(--space-8) var(--space-6) var(--space-6);
  background: var(--bg);
  color: var(--text-h);
  border-left: 1px solid var(--border);
}

.drawer__panel h2 {
  margin: 0 0 var(--space-4);
}

.drawer__close {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-enter-active .drawer__panel,
.drawer-leave-active .drawer__panel {
  transition: transform 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer__panel,
.drawer-leave-to .drawer__panel {
  transform: translateX(100%);
}
</style>
