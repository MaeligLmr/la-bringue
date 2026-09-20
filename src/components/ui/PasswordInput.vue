<script setup lang="ts">
import { ref } from 'vue'
import Icon from './Icon.vue'

const props = withDefaults(
  defineProps<{
    id: string
    autocomplete?: string
    required?: boolean
    ariaInvalid?: boolean
    ariaDescribedby?: string
  }>(),
  {
    required: false,
  }
)

const model = defineModel<string>({ default: '' })

const showPassword = ref(false)

const inputEl = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<template>
  <div class="password-input">
    <input
      :id="props.id"
      ref="inputEl"
      v-model="model"
      :type="showPassword ? 'text' : 'password'"
      :autocomplete="props.autocomplete"
      :required="props.required"
      :aria-invalid="props.ariaInvalid"
      :aria-describedby="props.ariaDescribedby"
    />
    <button
      type="button"
      class="password-input__toggle"
      :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      :aria-pressed="showPassword"
      @click="showPassword = !showPassword"
    >
      <Icon :name="showPassword ? 'eye-off' : 'eye'" size="small" />
    </button>
  </div>
</template>

<style scoped>
.password-input {
  position: relative;
  display: flex;
}

.password-input input {
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-2);
  padding-right: var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
}

.password-input input[aria-invalid='true'] {
  border-color: var(--alert-danger-border);
}

.password-input__toggle {
  position: absolute;
  top: 50%;
  right: var(--space-1);
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1);
  border: none;
  background: none;
  color: var(--text-h);
  cursor: pointer;
  border-radius: var(--radius-small);
  opacity: 0.7;
}

.password-input__toggle:hover {
  opacity: 1;
}
</style>
