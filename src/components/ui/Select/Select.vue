<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '../Icon/Icon.vue'
import { useFloatingPanel } from '../../../composables/useFloatingPanel/useFloatingPanel'
import type { SelectOption } from '../../../types/ui/select.ts'
// Même vocabulaire de tailles que Button (medium / large) pour qu'un Select
// s'aligne à côté d'un Button, mais les valeurs viennent des tokens propres
// au Select (--select-{taille}-*), pas de ceux de Button.
import type { ButtonSize } from '../../../types/ui/button.ts'

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    size?: ButtonSize
    ariaLabel?: string
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    size: 'medium',
    disabled: false,
  }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const isOpen = ref(false)
const activeIndex = ref(-1)
const rootEl = ref<HTMLElement | null>(null)
const listboxEl = ref<HTMLElement | null>(null)
// Le listbox est téléporté dans <body> (voir useFloatingPanel).
const { style: listboxStyle, updatePosition } = useFloatingPanel({
  anchor: rootEl,
  panel: listboxEl,
  isOpen,
  close,
  matchWidth: true,
})
// One id per instance so aria-controls/id stay unique with several <Select> on a page.
const listboxId = `select-listbox-${Math.random().toString(36).slice(2, 9)}`

const selectedOption = computed(
  () => props.options.find((option) => option.value === props.modelValue) ?? null
)

function open() {
  if (props.disabled || props.options.length === 0) return
  updatePosition()
  isOpen.value = true
  activeIndex.value = Math.max(
    0,
    props.options.findIndex((option) => option.value === props.modelValue)
  )
}

function close() {
  isOpen.value = false
  activeIndex.value = -1
}

function toggle() {
  if (isOpen.value) close()
  else open()
}

function selectOption(option: SelectOption) {
  if (option.value !== props.modelValue) emit('update:modelValue', option.value)
  close()
}

function moveActive(delta: number) {
  const count = props.options.length
  if (count === 0) return
  activeIndex.value = (activeIndex.value + delta + count) % count
}

function onTriggerKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) open()
      else moveActive(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) open()
      else moveActive(-1)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!isOpen.value) open()
      else if (activeIndex.value >= 0) selectOption(props.options[activeIndex.value])
      break
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault()
        close()
      }
      break
    case 'Tab':
      close()
      break
  }
}

</script>

<template>
  <div ref="rootEl" class="select" :class="[`select--${size}`, { 'select--open': isOpen }]">
    <button
      type="button"
      class="select__trigger"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="select__value">{{ selectedOption?.label ?? placeholder }}</span>
      <!-- Sized to exactly 1em via :deep() below (not the small/medium/large
           scale): a content icon that size would make the trigger taller
           than a same-size Button with no icon (Button's own height is
           driven by line-height when it has no icon). -->
      <Icon name="chevron-down" size="small" class="select__arrow" />
    </button>

    <Teleport to="body">
    <ul v-if="isOpen" :id="listboxId" ref="listboxEl" class="select__listbox" :style="listboxStyle" role="listbox">
      <li
        v-for="(option, index) in options"
        :key="option.value"
        role="option"
        :aria-selected="option.value === modelValue"
        class="select__option"
        :class="{
          'select__option--active': index === activeIndex,
          'select__option--selected': option.value === modelValue,
        }"
        @click="selectOption(option)"
        @mouseenter="activeIndex = index"
      >
        {{ option.label }}
      </li>
    </ul>
    </Teleport>
  </div>
</template>

<style scoped>
.select {
  position: relative;
  display: block;
  width: 100%;
}

/* Les tailles viennent directement des tokens --select-{medium|large}-* de
   theme.css (medium par défaut, large via .select--large). */
.select__trigger {
  display: flex;
  align-items: center;
  gap: var(--select-medium-gap);
  width: 100%;
  box-sizing: border-box;
  padding: var(--select-medium-padding-y) var(--select-medium-padding-x);
  border: 1px solid var(--select-trigger-border);
  border-radius: var(--radius-medium);
  background: var(--select-trigger-background);
  color: var(--select-trigger-text);
  font-family: inherit;
  font-size: var(--select-medium-font-size);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.select--large .select__trigger {
  gap: var(--select-large-gap);
  padding: var(--select-large-padding-y) var(--select-large-padding-x);
  font-size: var(--select-large-font-size);
}

.select__trigger:hover:not(:disabled) {
  background: var(--select-trigger-hover-background);
}

.select__trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--select-trigger-focus-ring);
}

.select__trigger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.select__value {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: inherit;
  font-size: inherit;
  font-weight: var(--font-weight-medium);
  line-height: 1;
}

.select__arrow {
  flex-shrink: 0;
  color: var(--select-trigger-text);
  transition: transform 0.15s ease;
}

/* Overrides Icon's small/medium/large scale: sized relative to the
   trigger's own font-size (1em) instead, so — combined with line-height:
   1 above — the chevron never exceeds the text's line box and the
   trigger ends up exactly as tall as a same-size Button with no icon. */
.select__trigger :deep(.icon) {
  width: 1em;
  height: 1em;
}

.select--open .select__arrow {
  transform: rotate(180deg);
}

.select__listbox {
  position: fixed;
  z-index: 1000;
  overflow-y: auto;
  box-sizing: border-box;
  /* Barre de défilement fine, qui reprend les couleurs du thème. */
  scrollbar-width: thin;
  scrollbar-color: var(--select-listbox-border) transparent;
  margin: 0;
  padding: var(--select-listbox-padding);
  list-style: none;
  border: 1px solid var(--select-listbox-border);
  border-radius: var(--radius-medium);
  background: var(--select-listbox-background);
  box-shadow: var(--shadow);
}

.select__listbox::-webkit-scrollbar {
  width: 8px;
}

.select__listbox::-webkit-scrollbar-track {
  background: transparent;
}

.select__listbox::-webkit-scrollbar-thumb {
  border-radius: var(--radius-full);
  background: var(--select-listbox-border);
}

.select__option {
  padding: var(--select-option-padding-y) var(--select-option-padding-x);
  border-radius: var(--select-option-radius);
  color: var(--select-option-text);
  white-space: nowrap;
  cursor: pointer;
}

.select__option--active {
  background: var(--select-option-hover-background);
}

.select__option--selected {
  color: var(--select-option-selected-text);
  font-weight: var(--font-weight-medium);
}
</style>
