<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'
import type { SelectOption } from './select-types'

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    ariaLabel?: string
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    disabled: false,
  }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const isOpen = ref(false)
const activeIndex = ref(-1)
const rootEl = ref<HTMLElement | null>(null)
// One id per instance so aria-controls/id stay unique with several <Select> on a page.
const listboxId = `select-listbox-${Math.random().toString(36).slice(2, 9)}`

const selectedOption = computed(
  () => props.options.find((option) => option.value === props.modelValue) ?? null
)

function open() {
  if (props.disabled || props.options.length === 0) return
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
  if (rootEl.value && !rootEl.value.contains(event.target as Node)) close()
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="rootEl" class="select" :class="{ 'select--open': isOpen }">
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
      <Icon name="arrow-right" size="small" class="select__arrow" />
    </button>

    <ul v-if="isOpen" :id="listboxId" class="select__listbox" role="listbox">
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
  </div>
</template>

<style scoped>
.select {
  position: relative;
  display: inline-block;
}

.select__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 9rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-medium, 8px);
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.select__trigger:hover:not(:disabled) {
  border-color: var(--accent);
}

.select__trigger:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
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
}

.select__arrow {
  flex-shrink: 0;
  color: var(--text);
  transform: rotate(90deg);
  transition: transform 0.15s ease;
}

.select--open .select__arrow {
  transform: rotate(-90deg);
}

.select__listbox {
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.25rem);
  left: 0;
  min-width: 100%;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-medium, 8px);
  background: var(--bg);
  box-shadow: var(--shadow);
}

.select__option {
  padding: 0.5rem 0.75rem;
  border-radius: calc(var(--radius-medium, 8px) - 4px);
  color: var(--text-h);
  white-space: nowrap;
  cursor: pointer;
}

.select__option--active {
  background: var(--accent-bg);
}

.select__option--selected {
  color: var(--accent);
  font-weight: var(--font-weight-medium, 500);
}
</style>
