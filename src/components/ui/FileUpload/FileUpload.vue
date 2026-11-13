<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'

const props = withDefaults(
  defineProps<{
    /** Fichier choisi (v-model). */
    modelValue?: File
    /** URL de l'image déjà enregistrée, affichée tant qu'aucun fichier n'est choisi. */
    currentUrl?: string
    id?: string
    accept?: string
    /** Taille max en octets. */
    maxSize?: number
    /** Remplace la consigne sous le titre (ex : une limite qui ne porte pas sur l’original). */
    hint?: string
    disabled?: boolean
  }>(),
  { accept: 'image/*', maxSize: 5 * 1024 * 1024, disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [file: File | undefined] }>()

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const error = ref('')
const previewUrl = ref('')

function revoke() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

watch(
  () => props.modelValue,
  (file) => {
    revoke()
    if (file?.type.startsWith('image/')) previewUrl.value = URL.createObjectURL(file)
  },
  { immediate: true }
)
onBeforeUnmount(revoke)

const shownUrl = computed(() => previewUrl.value || props.currentUrl || '')
const fileName = computed(() => props.modelValue?.name ?? '')

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} Ko` : `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function matchesAccept(file: File) {
  return props.accept.split(',').some((rule) => {
    const r = rule.trim()
    if (r.endsWith('/*')) return file.type.startsWith(r.slice(0, -1))
    if (r.startsWith('.')) return file.name.toLowerCase().endsWith(r)
    return file.type === r
  })
}

function select(file: File | undefined) {
  if (!file) return
  if (!matchesAccept(file)) {
    error.value = 'Ce type de fichier n’est pas accepté.'
    return
  }
  if (file.size > props.maxSize) {
    error.value = `Le fichier dépasse ${formatSize(props.maxSize)}.`
    return
  }
  error.value = ''
  emit('update:modelValue', file)
}

function onChange(event: Event) {
  select((event.target as HTMLInputElement).files?.[0])
}

function onDrop(event: DragEvent) {
  dragging.value = false
  if (!props.disabled) select(event.dataTransfer?.files?.[0])
}

function clear() {
  error.value = ''
  if (input.value) input.value.value = ''
  emit('update:modelValue', undefined)
}

function browse() {
  input.value?.click()
}
</script>

<template>
  <div class="file-upload">
    <div
      class="file-upload__zone"
      :class="{ 'file-upload__zone--dragging': dragging, 'file-upload__zone--disabled': disabled }"
      @dragenter.prevent="dragging = true"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <img v-if="shownUrl" class="file-upload__preview" :src="shownUrl" alt="Aperçu" />
      <span v-else class="file-upload__icon" aria-hidden="true"><Icon name="plus" size="large" /></span>

      <div class="file-upload__text">
        <template v-if="modelValue">
          <strong class="file-upload__name">{{ fileName }}</strong>
          <span class="file-upload__hint">{{ formatSize(modelValue.size) }}</span>
        </template>
        <template v-else>
          <strong>{{ currentUrl ? 'Remplacer l’image' : 'Glisse un fichier ici' }}</strong>
          <span class="file-upload__hint">{{ hint ?? `ou parcours tes fichiers · max ${formatSize(maxSize)}` }}</span>
        </template>
      </div>

      <div class="file-upload__actions">
        <Button variant="outlined" size="medium" :disabled="disabled" @click="browse">Parcourir</Button>
        <Button
          v-if="modelValue"
          variant="outlined"
          icon-only="close"
          label="Retirer le fichier"
          :disabled="disabled"
          @click="clear"
        />
      </div>

      <input
        :id="id"
        ref="input"
        class="file-upload__input"
        type="file"
        :accept="accept"
        :disabled="disabled"
        @change="onChange"
      />
    </div>

    <p v-if="error" class="file-upload__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.file-upload {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
}

.file-upload__zone {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-4);
  border: 2px dashed var(--border);
  border-radius: var(--radius-medium);
  background: var(--bg);
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.file-upload__zone:hover:not(.file-upload__zone--disabled),
.file-upload__zone--dragging {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.file-upload__zone--disabled {
  opacity: 0.6;
}

.file-upload__preview,
.file-upload__icon {
  flex: none;
  width: 72px;
  height: 72px;
  border-radius: var(--radius-small);
}

.file-upload__preview {
  object-fit: cover;
  border: 1px solid var(--border);
}

.file-upload__icon {
  display: grid;
  place-items: center;
  background: var(--accent-bg);
  color: var(--accent);
}

.file-upload__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-0-5);
  min-width: 140px;
  color: var(--text-h);
}

.file-upload__name {
  overflow-wrap: anywhere;
}

.file-upload__hint {
  color: var(--text);
  font-size: 0.85em;
}

.file-upload__actions {
  display: flex;
  gap: var(--space-2);
}

/* Masqué visuellement mais reste dans le DOM (label[for] et tests). */
.file-upload__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.file-upload__error {
  margin: 0;
  color: var(--alert-danger-text);
  font-size: 0.85em;
}
</style>
