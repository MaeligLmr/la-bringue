<script setup lang="ts">
import Icon from '../Icon/Icon.vue'

defineProps<{
  id?: string
  disabled?: boolean
}>()

const model = defineModel<boolean>({ default: false })

function onChange(event: Event) {
  model.value = (event.target as HTMLInputElement).checked
}
</script>

<template>
  <label class="checkbox" :class="{ 'checkbox--disabled': disabled }">
    <!-- Vraie case native, masquée visuellement : clavier, lecteurs d'écran et formulaires restent natifs. -->
    <input :id="id" class="checkbox__input" type="checkbox" :checked="model" :disabled="disabled" @change="onChange" />
    <span class="checkbox__box" aria-hidden="true">
      <Icon name="check" size="small" class="checkbox__check" />
    </span>
    <span v-if="$slots.default" class="checkbox__label"><slot /></span>
  </label>
</template>

<style scoped>
.checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text);
  cursor: pointer;
  user-select: none;
}

.checkbox--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.checkbox__box {
  display: grid;
  flex: none;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  box-sizing: border-box;
  border: 1.5px solid var(--select-trigger-border, var(--border));
  border-radius: var(--radius-small);
  background: transparent;
  color: var(--button-primary-full-idle-text);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.checkbox__check {
  width: 0.8rem;
  height: 0.8rem;
  transform: scale(0.4);
  opacity: 0;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}

.checkbox:hover:not(.checkbox--disabled) .checkbox__box {
  border-color: var(--accent);
}

.checkbox__input:checked + .checkbox__box {
  border-color: var(--accent);
  background: var(--accent);
}

.checkbox__input:checked + .checkbox__box .checkbox__check {
  transform: scale(1);
  opacity: 1;
}

.checkbox__input:focus-visible + .checkbox__box {
  box-shadow: 0 0 0 3px var(--select-trigger-focus-ring);
}

.checkbox__label {
  line-height: 1.2;
}
</style>
