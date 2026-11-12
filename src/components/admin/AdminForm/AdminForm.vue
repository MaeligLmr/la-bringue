<script setup lang="ts" generic="T extends object">
import { onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { supabase } from '../../../supabase.js'
import Button from '../../ui/Button/Button.vue'
import Select from '../../ui/Select/Select.vue'
import type { AdminFormField, AdminFormHandler } from '../../../types/ui/admin-form.ts'

const props = defineProps<{
  fields: AdminFormField<T>[]
  handler: AdminFormHandler<T>
  id?: string | number
  rules?: (values: Record<string, unknown>) => Partial<Record<string, string>>
}>()

const emit = defineEmits<{ saved: [item: T] }>()

const ERROR_MESSAGE = 'L’enregistrement a échoué. Réessaie plus tard.'

const values = reactive<Record<string, any>>({})
const files = reactive<Record<string, File | undefined>>({})
const errors = reactive<Record<string, string | undefined>>({})
const submitting = ref(false)

function toFormValue(field: AdminFormField<T>, value: unknown) {
  if (field.type === 'checkbox') return Boolean(value)
  if (field.type === 'select') return value == null ? '' : String(value)
  return value ?? ''
}

function fill(item: Partial<T>) {
  for (const field of props.fields) {
    values[field.key] = toFormValue(field, (item as Record<string, unknown>)[field.key])
  }
}

fill({})

onMounted(async () => {
  if (props.id === undefined) return
  try {
    const item = await props.handler.getById(props.id as never)
    if (item) fill(item)
  } catch {
    toast.error(ERROR_MESSAGE)
  }
})

function isEmpty(field: AdminFormField<T>) {
  if (field.type === 'checkbox') return false
  if (field.type === 'image') return !values[field.key] && !files[field.key]
  return String(values[field.key] ?? '').trim() === ''
}

function validate() {
  const ruleErrors = props.rules?.(values) ?? {}
  for (const field of props.fields) {
    errors[field.key] = field.required && isEmpty(field) ? 'Ce champ est obligatoire.' : ruleErrors[field.key]
  }
  return props.fields.every((field) => !errors[field.key])
}

function onFileChange(key: string, event: Event) {
  files[key] = (event.target as HTMLInputElement).files?.[0]
}

// Envoie le fichier dans le bucket « images »
async function upload(field: AdminFormField<T>, file: File) {
  const path = `${field.folder}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('images').upload(path, file)
  if (error) throw error
  return `/${path}`
}

async function submit() {
  if (!validate()) return

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {}
    for (const field of props.fields) {
      const file = files[field.key]
      const value = field.type === 'image' && file ? await upload(field, file) : values[field.key]
      // Champ vide : null en base plutôt qu'une chaîne vide (dates, heures…).
      payload[field.key] = value === '' ? null : value
    }

    const item =
      props.id === undefined
        ? await props.handler.create(payload as never)
        : await props.handler.update(props.id as never, payload as never)

    toast.success('Enregistré.')
    emit('saved', item)
  } catch {
    toast.error(ERROR_MESSAGE)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="admin-form" novalidate @submit.prevent="submit">
    <div v-for="field in fields" :key="field.key" class="admin-form__field">
      <label :for="`admin-${field.key}`">{{ field.label }}</label>

      <textarea v-if="field.type === 'textarea'" :id="`admin-${field.key}`" v-model="values[field.key]" />

      <Select
        v-else-if="field.type === 'select'"
        :id="`admin-${field.key}`"
        v-model="values[field.key]"
        :options="field.options ?? []"
        :aria-label="field.label"
      />

      <input
        v-else-if="field.type === 'checkbox'"
        :id="`admin-${field.key}`"
        v-model="values[field.key]"
        type="checkbox"
      />

      <input
        v-else-if="field.type === 'image'"
        :id="`admin-${field.key}`"
        type="file"
        accept="image/*"
        @change="onFileChange(field.key, $event)"
      />

      <input v-else :id="`admin-${field.key}`" v-model="values[field.key]" :type="field.type" />

      <p v-if="errors[field.key]" class="admin-form__error">{{ errors[field.key] }}</p>
    </div>

    <slot :values="values" />

    <Button type="submit" :disabled="submitting">
      {{ submitting ? 'Enregistrement…' : 'Enregistrer' }}
    </Button>
  </form>
</template>

<style scoped>
.admin-form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
}

.admin-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
}

.admin-form__field label {
  font-weight: var(--font-weight-medium);
  color: var(--text-h);
}

.admin-form__field input:not([type='checkbox']):not([type='file']),
.admin-form__field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
}

.admin-form__field input[type='checkbox'] {
  align-self: flex-start;
}

.admin-form__error {
  margin: 0;
  color: var(--alert-danger-text);
  font-size: 0.85em;
}
</style>
