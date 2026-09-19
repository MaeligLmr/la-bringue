<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'
import { supabase } from '../../supabase.js'
import { validateSignupFields, type FieldErrors } from '../../lib/auth-validation'
import { mapAuthError, isObfuscatedDuplicateSignup, EMAIL_ALREADY_USED_MESSAGE } from '../../lib/auth-errors'
import { withTimeout } from '../../lib/with-timeout'
import Button from '../ui/Button.vue'

const emit = defineEmits<{ switch: []; success: [] }>()

const email = ref('')
const password = ref('')
const errors = reactive<FieldErrors>({})
const formError = ref('')
const isSubmitting = ref(false)
const confirmationSent = ref(false)

const emailInputEl = ref<HTMLInputElement | null>(null)
const passwordInputEl = ref<HTMLInputElement | null>(null)
const confirmationSwitchEl = ref<{ focus: () => void } | null>(null)

function focusFirstField() {
  if (confirmationSent.value) confirmationSwitchEl.value?.focus()
  else emailInputEl.value?.focus()
}

defineExpose({ focusFirstField })

async function handleSubmit() {
  if (isSubmitting.value) return

  errors.email = undefined
  errors.password = undefined
  formError.value = ''

  const fieldErrors = validateSignupFields(email.value, password.value)
  if (fieldErrors.email || fieldErrors.password) {
    Object.assign(errors, fieldErrors)
    if (fieldErrors.email) emailInputEl.value?.focus()
    else passwordInputEl.value?.focus()
    return
  }

  isSubmitting.value = true
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({ email: email.value, password: password.value })
    )

    if (error) {
      formError.value = mapAuthError(error)
      emailInputEl.value?.focus()
      return
    }

    // Quand la confirmation email est activée sur le projet Supabase,
    // signUp() sur un email déjà enregistré répond sans erreur (voir
    // isObfuscatedDuplicateSignup) — il faut donc vérifier ce cas même
    // après un appel "réussi".
    if (isObfuscatedDuplicateSignup(data.user)) {
      formError.value = EMAIL_ALREADY_USED_MESSAGE
      emailInputEl.value?.focus()
      return
    }

    // Si la confirmation email est activée, Supabase renvoie un utilisateur
    // sans session : le compte existe mais n'est pas encore actif tant que
    // l'utilisateur n'a pas cliqué sur le lien reçu par email.
    if (!data.session) {
      confirmationSent.value = true
      await nextTick()
      confirmationSwitchEl.value?.focus()
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
  <div v-if="confirmationSent" class="auth-form__confirmation" role="status">
    <p>
      Compte créé ! Vérifie ta boîte mail (<strong>{{ email }}</strong>) et clique sur le lien de
      confirmation avant de te connecter.
    </p>
    <Button
      ref="confirmationSwitchEl"
      type="button"
      color="primary"
      variant="ghost"
      class="auth-form__switch"
      @click="emit('switch')"
    >
      Aller à la connexion
    </Button>
  </div>

  <form v-else class="auth-form" novalidate @submit.prevent="handleSubmit">
    <p v-if="formError" class="auth-form__error auth-form__error--general" role="alert">
      {{ formError }}
    </p>

    <div class="auth-form__field">
      <label for="signup-email">Email</label>
      <input
        id="signup-email"
        ref="emailInputEl"
        v-model="email"
        type="email"
        autocomplete="email"
        :aria-invalid="Boolean(errors.email)"
        :aria-describedby="errors.email ? 'signup-email-error' : undefined"
      />
      <p v-if="errors.email" id="signup-email-error" class="auth-form__error" role="alert">
        {{ errors.email }}
      </p>
    </div>

    <div class="auth-form__field">
      <label for="signup-password">Mot de passe</label>
      <input
        id="signup-password"
        ref="passwordInputEl"
        v-model="password"
        type="password"
        autocomplete="new-password"
        :aria-invalid="Boolean(errors.password)"
        :aria-describedby="errors.password ? 'signup-password-error' : undefined"
      />
      <p v-if="errors.password" id="signup-password-error" class="auth-form__error" role="alert">
        {{ errors.password }}
      </p>
    </div>

    <Button
      type="submit"
      color="primary"
      variant="full"
      class="auth-form__submit"
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? 'Création en cours…' : 'Créer un compte' }}
    </Button>

    <Button
      type="button"
      color="primary"
      variant="ghost"
      class="auth-form__switch"
      @click="emit('switch')"
    >
      Déjà un compte ? Se connecter
    </Button>
  </form>
</template>

<style scoped>
.auth-form,
.auth-form__confirmation {
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
  border-color: var(--alert-danger-border);
}

.auth-form__error {
  margin: 0;
  color: var(--alert-danger-text);
  font-size: 0.85em;
}

.auth-form__error--general {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--alert-danger-border);
  border-radius: var(--radius-medium);
  background: var(--alert-danger-background);
}
</style>
