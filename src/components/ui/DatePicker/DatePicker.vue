<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
import { useFloatingPanel } from '../../../composables/useFloatingPanel/useFloatingPanel'
import { calendarDays, formatDisplay, joinValue, splitValue, todayIso, WEEKDAYS } from '../../../lib/date-picker/date-picker'
import type { DatePickerMode } from '../../../types/ui/date-picker'

// Valeur : « 2026-08-28 » (date), « 16:30 » (time) ou « 2026-08-28T16:30 » (datetime).
// Chaîne vide = pas de valeur.
const props = withDefaults(
  defineProps<{
    modelValue: string
    mode?: DatePickerMode
    id?: string
    placeholder?: string
    ariaLabel?: string
    disabled?: boolean
    /** Affiche « Effacer » quand une valeur est choisie. */
    clearable?: boolean
    /** Pas des minutes proposées (une valeur existante hors pas reste affichée). */
    minuteStep?: number
  }>(),
  { mode: 'date', disabled: false, clearable: false, minuteStep: 5 }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const isOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const panelId = `datepicker-panel-${Math.random().toString(36).slice(2, 9)}`

const { style: panelStyle, updatePosition } = useFloatingPanel({
  anchor: rootEl,
  panel: panelEl,
  isOpen,
  close,
  maxHeight: 460,
})

const hasDate = computed(() => props.mode !== 'time')
const hasTime = computed(() => props.mode !== 'date')

const parts = computed(() => splitValue(props.modelValue, props.mode))
const display = computed(() => formatDisplay(props.modelValue, props.mode))
const defaultPlaceholder = computed(() =>
  props.mode === 'time' ? 'Choisir une heure' : props.mode === 'datetime' ? 'Choisir une date et une heure' : 'Choisir une date'
)

// Mois affiché dans le calendrier (indépendant de la valeur tant qu'on navigue).
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth()) // 0-11

function syncView() {
  const [year, month] = (parts.value.date || todayIso()).split('-').map(Number)
  viewYear.value = year
  viewMonth.value = month - 1
}

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(viewYear.value, viewMonth.value, 1))
  )
)
const days = computed(() => calendarDays(viewYear.value, viewMonth.value, parts.value.date))

const hourText = computed(() => parts.value.time.slice(0, 2) || '--')
const minuteText = computed(() => parts.value.time.slice(3) || '--')

function shiftMonth(delta: number) {
  const date = new Date(Date.UTC(viewYear.value, viewMonth.value + delta, 1))
  viewYear.value = date.getUTCFullYear()
  viewMonth.value = date.getUTCMonth()
}

function emitValue(date: string, time: string) {
  emit('update:modelValue', joinValue(date, time, props.mode))
}

function pickDay(iso: string) {
  emitValue(iso, parts.value.time)
  if (props.mode === 'date') close()
}

const MINUTES_PER_DAY = 24 * 60

function emitMinutes(total: number) {
  const wrapped = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hour = String(Math.floor(wrapped / 60)).padStart(2, '0')
  const minute = String(wrapped % 60).padStart(2, '0')
  emitValue(parts.value.date, `${hour}:${minute}`)
}

function currentMinutes() {
  const [hour = 0, minute = 0] = parts.value.time.split(':').map(Number)
  return hour * 60 + minute
}

// Flèches haut / bas façon PrimeNG : l'heure boucle sur 24 h, les minutes avancent
// par pas (en se calant d'abord sur le pas) et reportent sur l'heure.
function stepHour(delta: number) {
  emitMinutes(currentMinutes() + delta * 60)
}

function stepMinute(delta: number) {
  const minute = currentMinutes() % 60
  const step = props.minuteStep
  const snapped = delta > 0 ? (Math.floor(minute / step) + 1) * step : (Math.ceil(minute / step) - 1) * step
  emitMinutes(currentMinutes() - minute + snapped)
}

function clear() {
  emit('update:modelValue', '')
  close()
}

async function open() {
  if (props.disabled) return
  syncView()
  isOpen.value = true
  await nextTick()
  updatePosition()
}

function close() {
  isOpen.value = false
}

function toggle() {
  if (isOpen.value) close()
  else open()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !isOpen.value) return
  event.preventDefault()
  close()
}

// Si la date change pendant que le panneau est ouvert, le calendrier suit.
watch(
  () => parts.value.date,
  (date) => {
    if (isOpen.value && date) syncView()
  }
)
</script>

<template>
  <div ref="rootEl" class="date-picker" :class="{ 'date-picker--open': isOpen }" @keydown="onKeydown">
    <button
      :id="id"
      type="button"
      class="date-picker__trigger"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="date-picker__value" :class="{ 'date-picker__value--placeholder': !display }">
        {{ display || placeholder || defaultPlaceholder }}
      </span>
      <Icon :name="hasDate ? 'calendar' : 'clock'" size="small" class="date-picker__icon" />
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        :id="panelId"
        ref="panelEl"
        class="date-picker__panel"
        :style="panelStyle"
        role="dialog"
        :aria-label="ariaLabel ?? defaultPlaceholder"
        @keydown="onKeydown"
      >
        <div class="date-picker__body">
          <div v-if="hasDate" class="date-picker__calendar">
            <div class="date-picker__nav">
              <Button variant="ghost" color="secondary" icon-only="arrow-left" label="Mois précédent" @click="shiftMonth(-1)" />
              <span class="date-picker__month" aria-live="polite">{{ monthLabel }}</span>
              <Button variant="ghost" color="secondary" icon-only="arrow-right" label="Mois suivant" @click="shiftMonth(1)" />
            </div>

            <div class="date-picker__grid">
              <span v-for="(weekday, index) in WEEKDAYS" :key="index" class="date-picker__weekday" aria-hidden="true">
                {{ weekday }}
              </span>
              <button
                v-for="day in days"
                :key="day.iso"
                type="button"
                class="date-picker__day"
                :class="{
                  'date-picker__day--outside': day.outside,
                  'date-picker__day--today': day.today,
                  'date-picker__day--selected': day.selected,
                }"
                :aria-pressed="day.selected"
                :aria-label="day.label"
                @click="pickDay(day.iso)"
              >
                {{ day.day }}
              </button>
            </div>
          </div>

        </div>

        <div v-if="hasTime" class="date-picker__time" :class="{ 'date-picker__time--separated': hasDate }">
          <div class="date-picker__spinner" role="group" aria-label="Heures">
            <button type="button" class="date-picker__step" aria-label="Heure suivante" @click="stepHour(1)">
              <Icon name="chevron-down" size="small" class="date-picker__step-icon date-picker__step-icon--up" />
            </button>
            <span class="date-picker__digits" aria-live="polite">{{ hourText }}</span>
            <button type="button" class="date-picker__step" aria-label="Heure précédente" @click="stepHour(-1)">
              <Icon name="chevron-down" size="small" class="date-picker__step-icon" />
            </button>
          </div>

          <span class="date-picker__colon" aria-hidden="true">:</span>

          <div class="date-picker__spinner" role="group" aria-label="Minutes">
            <button type="button" class="date-picker__step" aria-label="Minute suivante" @click="stepMinute(1)">
              <Icon name="chevron-down" size="small" class="date-picker__step-icon date-picker__step-icon--up" />
            </button>
            <span class="date-picker__digits" aria-live="polite">{{ minuteText }}</span>
            <button type="button" class="date-picker__step" aria-label="Minute précédente" @click="stepMinute(-1)">
              <Icon name="chevron-down" size="small" class="date-picker__step-icon" />
            </button>
          </div>
        </div>

        <div v-if="(clearable && modelValue) || hasTime" class="date-picker__footer">
          <Button v-if="clearable && modelValue" variant="ghost" color="secondary" @click="clear">Effacer</Button>
          <Button v-if="hasTime" @click="close">OK</Button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.date-picker {
  position: relative;
  display: block;
  width: 100%;
}

.date-picker__trigger {
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
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.date-picker__trigger:hover:not(:disabled) {
  background: var(--select-trigger-hover-background);
}

.date-picker__trigger:focus-visible,
.date-picker--open .date-picker__trigger {
  outline: none;
  box-shadow: 0 0 0 3px var(--select-trigger-focus-ring);
}

.date-picker__trigger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.date-picker__value {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-transform: capitalize;
}

.date-picker__value--placeholder {
  opacity: 0.7;
  text-transform: none;
}

.date-picker__icon {
  flex: none;
  width: 1em;
  height: 1em;
}

.date-picker__panel {
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  box-sizing: border-box;
  padding: var(--space-4);
  overflow-y: auto;
  border: 1px solid var(--select-listbox-border);
  border-radius: var(--radius-medium);
  background: var(--select-listbox-background);
  color: var(--select-option-text);
  box-shadow: var(--shadow);
  scrollbar-width: thin;
  scrollbar-color: var(--select-listbox-border) transparent;
}

.date-picker__body {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.date-picker__calendar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 17.5rem;
}

.date-picker__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date-picker__month {
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
}

.date-picker__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.date-picker__weekday {
  padding: var(--space-1) 0;
  font-size: 0.75em;
  text-align: center;
  opacity: 0.7;
}

.date-picker__day {
  border: 1px solid transparent;
  border-radius: var(--radius-small);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.date-picker__day {
  aspect-ratio: 1 / 1;
}

.date-picker__day--outside {
  opacity: 0.4;
}

.date-picker__day--today {
  border-color: var(--accent-border);
}

.date-picker__day:hover {
  background: var(--select-option-hover-background);
}

.date-picker__day:focus-visible,
.date-picker__step:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--select-trigger-focus-ring);
}

.date-picker__day--selected {
  background: var(--accent);
  color: var(--button-primary-full-idle-text);
  font-weight: var(--font-weight-medium);
}

/* Sélecteur d'heure façon PrimeNG : flèche, valeur, flèche — pour chaque unité. */
.date-picker__time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.date-picker__time--separated {
  padding-top: var(--space-3);
  border-top: 1px solid var(--select-listbox-border);
}

.date-picker__spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.date-picker__step {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.date-picker__step:hover {
  background: var(--select-option-hover-background);
}

.date-picker__step-icon {
  width: 1rem;
  height: 1rem;
}

.date-picker__step-icon--up {
  transform: rotate(180deg);
}

.date-picker__digits {
  min-width: 2ch;
  font-size: 1.5rem;
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium);
  text-align: center;
}

.date-picker__colon {
  font-size: 1.5rem;
  opacity: 0.7;
}

.date-picker__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
