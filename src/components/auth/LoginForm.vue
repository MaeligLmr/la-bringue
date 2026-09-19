<script setup lang="ts">
import { reactive, ref } from 'vue'
import { supabase } from '../../supabase.js'
import { validateLoginFields, type FieldErrors } from '../../lib/auth-validation'
import { mapAuthError } from '../../lib/auth-errors'
import { withTimeout } from '../../lib/with-timeout'

const emit = defineEmits<{ switch: []; success: [] }>()

const email = ref('')
const password = ref('')
const errors = reactive<FieldErrors>({})
const formError = ref('')
const isSubmitting = ref(false)

const emailInputEl = ref<HTMLInputElement | null>(null)
const passwordInputEl = ref<HTMLInputElement | null>(null)

function focusFirstField() {
  emailInputEl.value?.focus()
}

defineExpose({ focusFirstField })

async function handleSubmit() {
  if (isSubmitting.value) return

  errors.email = undefined
  errors.password = undefined
  formError.value = ''

  const fieldErrors = validateLoginFields(email.value, password.value)
  if (fieldErrors.email || fieldErrors.password) {
    Object.assign(errors, fieldErrors)
    if (fieldErrors.email) emailInputEl.value?.focus()
    else passwordInputEl.value?.focus()
    return
  }

  isSubmitting.value = true
  try {
    const { error } = await withTimeout(
      supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    )

    if (error) {
      formError.value = mapAuthError(error)
      emailInputEl.value?.focus()
      return
    }

    emit('success')
  } catch (thrown) {
    formError.value = mapAuthError(thrown)
    emailInputEl.value?.focus()
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form class="auth-form" novalidate @submit.prevent="handleSubmit">
    <p v-if="formError" class="auth-form__error auth-form__error--general" role="alert">
      {{ formError }}
    </p>

    <div class="auth-form__field">
      <label for="login-email">Email</label>
      <input
        id="login-email"
        ref="emailInputEl"
        v-model="email"
        type="email"
        autocomplete="email"
        :aria-invalid="Boolean(errors.email)"
        :aria-describedby="errors.email ? 'login-email-error' : undefined"
      />
      <p v-if="errors.email" id="login-email-error" class="auth-form__error" role="alert">
        {{ errors.email }}
      </p>
    </div>

    <div class="auth-form__field">
      <label for="login-password">Mot de passe</label>
      <input
        id="login-password"
        ref="passwordInputEl"
        v-model="password"
        type="password"
        autocomplete="current-password"
        :aria-invalid="Boolean(errors.password)"
        :aria-describedby="errors.password ? 'login-password-error' : undefined"
      />
      <p v-if="errors.password" id="login-password-error" class="auth-form__error" role="alert">
        {{ errors.password }}
      </p>
    </div>

    <button type="submit" class="auth-form__submit" :disabled="isSubmitting">
      {{ isSubmitting ? 'Connexion en cours…' : 'Se connecter' }}
    </button>

    <button type="button" class="auth-form__switch" @click="emit('switch')">
      Pas de compte ? Créer un compte
    </button>
  </form>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.auth-form__field input {
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
}

.auth-form__field input[aria-invalid='true'] {
  border-color: #d33;
}

.auth-form__error {
  margin: 0;
  color: #d33;
  font-size: 0.85em;
}

.auth-form__error--general {
  padding: 0.5rem;
  border: 1px solid #d33;
  border-radius: 4px;
}

.auth-form__submit {
  padding: 0.6rem;
  border: none;
  border-radius: 4px;
  background: var(--accent);
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.auth-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-form__switch {
  background: none;
  border: none;
  color: var(--accent);
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
  padding: 0;
}
</style>
