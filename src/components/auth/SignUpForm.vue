<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { supabase } from '../../supabase.js'
import { validateSignupFields, type FieldErrors } from '../../lib/auth-validation'
import { mapAuthError, isObfuscatedDuplicateSignup, EMAIL_ALREADY_USED_MESSAGE } from '../../lib/auth-errors'
import { withTimeout } from '../../lib/with-timeout'
import Button from '../ui/Button.vue'
import PasswordInput from '../ui/PasswordInput.vue'

const emit = defineEmits<{ switch: []; success: [] }>()

const firstName = ref('')
const lastName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errors = reactive<FieldErrors>({})
const isSubmitting = ref(false)
const confirmationSent = ref(false)

const firstNameInputEl = ref<HTMLInputElement | null>(null)
const lastNameInputEl = ref<HTMLInputElement | null>(null)
const usernameInputEl = ref<HTMLInputElement | null>(null)
const emailInputEl = ref<HTMLInputElement | null>(null)
const passwordInputEl = ref<{ focus: () => void } | null>(null)
const confirmPasswordInputEl = ref<{ focus: () => void } | null>(null)
const confirmationSwitchEl = ref<{ focus: () => void } | null>(null)

function focusFirstField() {
  if (confirmationSent.value) confirmationSwitchEl.value?.focus()
  else firstNameInputEl.value?.focus()
}

defineExpose({ focusFirstField })

// Un seul champ à la fois reçoit le focus après une erreur — dans cet
// ordre, qui correspond à l'ordre d'affichage des champs.
const FIELD_ORDER = ['firstName', 'lastName', 'username', 'email', 'password', 'confirmPassword'] as const
const FIELD_REFS = {
  firstName: firstNameInputEl,
  lastName: lastNameInputEl,
  username: usernameInputEl,
  email: emailInputEl,
  password: passwordInputEl,
  confirmPassword: confirmPasswordInputEl,
}

function focusFirstInvalidField(fieldErrors: FieldErrors) {
  const firstInvalid = FIELD_ORDER.find((field) => fieldErrors[field])
  if (firstInvalid) FIELD_REFS[firstInvalid].value?.focus()
}

async function handleSubmit() {
  if (isSubmitting.value) return

  errors.firstName = undefined
  errors.lastName = undefined
  errors.username = undefined
  errors.email = undefined
  errors.password = undefined
  errors.confirmPassword = undefined

  const fieldErrors = validateSignupFields({
    firstName: firstName.value,
    lastName: lastName.value,
    username: username.value,
    email: email.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
  })
  if (Object.keys(fieldErrors).length > 0) {
    Object.assign(errors, fieldErrors)
    focusFirstInvalidField(fieldErrors)
    return
  }

  isSubmitting.value = true
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            first_name: firstName.value,
            last_name: lastName.value,
            username: username.value,
          },
          // Sans ça, Supabase renvoie vers le "Site URL" configuré dans le
          // dashboard, qui ne connaît pas le sous-chemin /la-bringue/ (voir
          // `base` dans vite.config.ts) : le lien de confirmation atterrit
          // alors sur une 404 en prod.
          emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
        },
      })
    )

    if (error) {
      toast.error(mapAuthError(error))
      emailInputEl.value?.focus()
      return
    }

    // Quand la confirmation email est activée sur le projet Supabase,
    // signUp() sur un email déjà enregistré répond sans erreur (voir
    // isObfuscatedDuplicateSignup) — il faut donc vérifier ce cas même
    // après un appel "réussi".
    if (isObfuscatedDuplicateSignup(data.user)) {
      toast.error(EMAIL_ALREADY_USED_MESSAGE)
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
    toast.error(mapAuthError(thrown))
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
    <div class="auth-form__field">
      <label for="signup-first-name">Prénom <span class="auth-form__required" aria-hidden="true">*</span></label>
      <input
        id="signup-first-name"
        ref="firstNameInputEl"
        v-model="firstName"
        type="text"
        autocomplete="given-name"
        required
        :aria-invalid="Boolean(errors.firstName)"
        :aria-describedby="errors.firstName ? 'signup-first-name-error' : undefined"
      />
      <p v-if="errors.firstName" id="signup-first-name-error" class="auth-form__error" role="alert">
        {{ errors.firstName }}
      </p>
    </div>

    <div class="auth-form__field">
      <label for="signup-last-name">Nom <span class="auth-form__required" aria-hidden="true">*</span></label>
      <input
        id="signup-last-name"
        ref="lastNameInputEl"
        v-model="lastName"
        type="text"
        autocomplete="family-name"
        required
        :aria-invalid="Boolean(errors.lastName)"
        :aria-describedby="errors.lastName ? 'signup-last-name-error' : undefined"
      />
      <p v-if="errors.lastName" id="signup-last-name-error" class="auth-form__error" role="alert">
        {{ errors.lastName }}
      </p>
    </div>

    <div class="auth-form__field">
      <label for="signup-username">Nom d'utilisateur <span class="auth-form__required" aria-hidden="true">*</span></label>
      <input
        id="signup-username"
        ref="usernameInputEl"
        v-model="username"
        type="text"
        autocomplete="username"
        required
        :aria-invalid="Boolean(errors.username)"
        :aria-describedby="errors.username ? 'signup-username-error' : undefined"
      />
      <p v-if="errors.username" id="signup-username-error" class="auth-form__error" role="alert">
        {{ errors.username }}
      </p>
    </div>

    <div class="auth-form__field">
      <label for="signup-email">Email <span class="auth-form__required" aria-hidden="true">*</span></label>
      <input
        id="signup-email"
        ref="emailInputEl"
        v-model="email"
        type="email"
        autocomplete="email"
        required
        :aria-invalid="Boolean(errors.email)"
        :aria-describedby="errors.email ? 'signup-email-error' : undefined"
      />
      <p v-if="errors.email" id="signup-email-error" class="auth-form__error" role="alert">
        {{ errors.email }}
      </p>
    </div>

    <div class="auth-form__field">
      <label for="signup-password">Mot de passe <span class="auth-form__required" aria-hidden="true">*</span></label>
      <PasswordInput
        id="signup-password"
        ref="passwordInputEl"
        v-model="password"
        autocomplete="new-password"
        required
        :aria-invalid="Boolean(errors.password)"
        :aria-describedby="errors.password ? 'signup-password-error' : undefined"
      />
      <p v-if="errors.password" id="signup-password-error" class="auth-form__error" role="alert">
        {{ errors.password }}
      </p>
    </div>

    <div class="auth-form__field">
      <label for="signup-confirm-password">Confirmer le mot de passe <span class="auth-form__required" aria-hidden="true">*</span></label>
      <PasswordInput
        id="signup-confirm-password"
        ref="confirmPasswordInputEl"
        v-model="confirmPassword"
        autocomplete="new-password"
        required
        :aria-invalid="Boolean(errors.confirmPassword)"
        :aria-describedby="errors.confirmPassword ? 'signup-confirm-password-error' : undefined"
      />
      <p v-if="errors.confirmPassword" id="signup-confirm-password-error" class="auth-form__error" role="alert">
        {{ errors.confirmPassword }}
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
  gap: var(--space-4);
}

.auth-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.auth-form__field label {
  font-weight: var(--font-weight-medium);
  color: var(--text-h);
}

.auth-form__required {
  color: var(--alert-danger-text);
}

.auth-form__field input {
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
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
</style>
