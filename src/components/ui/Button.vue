<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from './Icon.vue'
import type { IconName, IconSize } from '../../types/icon'
import type { ButtonColor, ButtonVariant, ButtonSize } from '../../types/button'

const props = withDefaults(
  defineProps<{
    color?: ButtonColor
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    iconLeft?: IconName
    iconRight?: IconName
    /** Renders an icon-only button (no visible text) using this icon. Requires `label`. */
    iconOnly?: IconName
    /** Accessible label, used as aria-label when `iconOnly` is set (required in that case). */
    label?: string
  }>(),
  {
    color: 'primary',
    variant: 'full',
    size: 'medium',
    type: 'button',
    disabled: false,
  }
)

if (import.meta.env.DEV && props.iconOnly && !props.label) {
  console.warn('[Button] the `label` prop is required for accessibility when `iconOnly` is set.')
}

const iconSize = computed<IconSize>(() => (props.size === 'large' ? 'large' : 'medium'))

const buttonEl = ref<HTMLButtonElement | null>(null)
defineExpose({
  /** Programmatically focus this button — e.g. `buttonRef.value?.focus()`. */
  focus: () => buttonEl.value?.focus(),
})

// Points this button's local --btn-* custom properties at the right set
// of design tokens for its color/variant/size, instead of hand-writing a
// CSS rule for every color × variant × state combination — see
// src/styles/tokens/theme.css (--button-{color}-{variant}-{state}-{prop},
// including the hand-authored --button-danger-* block).
const tokenStyle = computed(() => {
  const colorVariant = `--button-${props.color}-${props.variant}`
  const sizeSlot = `--button-${props.size}-${props.iconOnly ? 'icon-only' : 'with-text'}`
  return {
    '--btn-idle-bg': `var(${colorVariant}-idle-background)`,
    '--btn-idle-text': `var(${colorVariant}-idle-text)`,
    '--btn-idle-border': `var(${colorVariant}-idle-border)`,
    '--btn-hover-bg': `var(${colorVariant}-hover-background)`,
    '--btn-hover-text': `var(${colorVariant}-hover-text)`,
    '--btn-hover-border': `var(${colorVariant}-hover-border)`,
    '--btn-disabled-bg': `var(${colorVariant}-disabled-background)`,
    '--btn-disabled-text': `var(${colorVariant}-disabled-text)`,
    '--btn-disabled-border': `var(${colorVariant}-disabled-border)`,
    '--btn-padding-x': `var(${sizeSlot}-padding-x)`,
    '--btn-padding-y': `var(${sizeSlot}-padding-y)`,
    '--btn-gap': `var(${sizeSlot}-gap)`,
  }
})
</script>

<template>
  <button
    ref="buttonEl"
    :type="type"
    class="button"
    :class="[`button--${size}`, { 'button--icon-only': !!iconOnly }]"
    :style="tokenStyle"
    :disabled="disabled"
    :aria-label="iconOnly ? label : undefined"
  >
    <Icon v-if="iconOnly" :name="iconOnly" :size="iconSize" />
    <template v-else>
      <Icon v-if="iconLeft" :name="iconLeft" :size="iconSize" />
      <span v-if="$slots.default" class="button__label"><slot /></span>
      <Icon v-if="iconRight" :name="iconRight" :size="iconSize" />
    </template>
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--btn-gap);
  padding: var(--btn-padding-y) var(--btn-padding-x);
  border: 1px solid var(--btn-idle-border);
  border-radius: var(--button-radius);
  background: var(--btn-idle-bg);
  color: var(--btn-idle-text);
  font-family: inherit;
  font-weight: var(--font-weight-medium);
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.button--medium {
  font-size: var(--font-size-button-medium);
}

.button--large {
  font-size: var(--font-size-button-large);
}

.button--icon-only {
  aspect-ratio: 1 / 1;
  padding: var(--btn-padding-y);
}

.button:hover:not(:disabled) {
  background: var(--btn-hover-bg);
  color: var(--btn-hover-text);
  border-color: var(--btn-hover-border);
}

.button:disabled {
  background: var(--btn-disabled-bg);
  color: var(--btn-disabled-text);
  border-color: var(--btn-disabled-border);
  cursor: not-allowed;
}

.button__label {
  white-space: nowrap;
}
</style>
