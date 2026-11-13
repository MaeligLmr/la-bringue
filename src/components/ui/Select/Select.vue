<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../Icon/Icon.vue'
import type { SelectOption } from '../../../types/ui/select.ts'
// Reusing Button's size type/tokens on purpose: a Select must line up at
// the same height as a Button of the same size wherever they sit next to
// each other (e.g. the Navbar), so they share one size vocabulary.
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

// Points --select-size-* at the matching Button size tokens (padding,
// gap, font-size) — see Button.vue's tokenStyle for the same pattern.
const sizeStyle = computed(() => {
  const sizeSlot = `--button-${props.size}-with-text`
  return {
    '--select-padding-x': `var(${sizeSlot}-padding-x)`,
    '--select-padding-y': `var(${sizeSlot}-padding-y)`,
    '--select-gap': `var(${sizeSlot}-gap)`,
    '--select-font-size': `var(--font-size-button-${props.size})`,
  }
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const isOpen = ref(false)
const activeIndex = ref(-1)
const rootEl = ref<HTMLElement | null>(null)
const listboxEl = ref<HTMLElement | null>(null)
// Le listbox est téléporté dans <body> (pas rogné par un overflow parent, ex: modale ou
// tableau admin) : on le positionne donc en `fixed` d'après le bouton.
const listboxStyle = ref<Record<string, string>>({})
// One id per instance so aria-controls/id stay unique with several <Select> on a page.
const listboxId = `select-listbox-${Math.random().toString(36).slice(2, 9)}`

const selectedOption = computed(
  () => props.options.find((option) => option.value === props.modelValue) ?? null
)

const VIEWPORT_MARGIN = 8
const GAP = 4
const MAX_LISTBOX_HEIGHT = 320

function updatePosition() {
  const rect = rootEl.value?.getBoundingClientRect()
  if (!rect) return
  const below = window.innerHeight - rect.bottom - GAP - VIEWPORT_MARGIN
  const above = rect.top - GAP - VIEWPORT_MARGIN
  // S'ouvre vers le haut seulement s'il y a nettement plus de place qu'en dessous.
  const openUp = below < Math.min(MAX_LISTBOX_HEIGHT, 160) && above > below
  const maxHeight = Math.max(80, Math.min(MAX_LISTBOX_HEIGHT, openUp ? above : below))
  listboxStyle.value = {
    ...(openUp
      ? { bottom: `${window.innerHeight - rect.top + GAP}px` }
      : { top: `${rect.bottom + GAP}px` }),
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
    maxWidth: `calc(100vw - ${2 * VIEWPORT_MARGIN}px)`,
    maxHeight: `${maxHeight}px`,
  }
}

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

function onClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (rootEl.value?.contains(target) || listboxEl.value?.contains(target)) return
  close()
}

function onViewportChange() {
  if (isOpen.value) updatePosition()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})
</script>

<template>
  <div ref="rootEl" class="select" :class="{ 'select--open': isOpen }" :style="sizeStyle">
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

.select__trigger {
  /* Same box model as a Button of the same size (padding tokens,
     font-size, line-height, border width) so a Select sits at the same
     height as a Button next to it — e.g. the theme switcher and the auth
     buttons in the Navbar. --select-* set by sizeStyle in the script. */
  display: flex;
  align-items: center;
  gap: var(--select-gap);
  width: 100%;
  box-sizing: border-box;
  padding: var(--select-padding-y) var(--select-padding-x);
  border: 1px solid var(--select-trigger-border);
  border-radius: var(--radius-medium);
  background: var(--select-trigger-background);
  color: var(--select-trigger-text);
  font-family: inherit;
  font-size: var(--select-font-size);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease;
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
  font-size: var(--select-font-size);
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
  padding: var(--space-1);
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
  padding: var(--space-2) var(--space-3);
  border-radius: calc(var(--radius-medium) - var(--space-1));
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
