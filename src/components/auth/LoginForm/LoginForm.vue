<script setup lang="ts">
import { reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { supabase } from '../../../supabase.js'
import { clearErrors, validateLoginFields, type FieldErrors } from '../../../lib/auth-validation/auth-validation'
import { mapAuthError } from '../../../lib/auth-errors/auth-errors'
import { withTimeout } from '../../../lib/with-timeout/with-timeout'
import Button from '../../ui/Button/Button.vue'
import PasswordInput from '../../ui/PasswordInput/PasswordInput.vue'

const emit = defineEmits<{ switch: []; success: [] }>()

const email = ref('')
const password = ref('')
const errors = reactive<FieldErrors>({})
const isSubmitting = ref(false)

const emailInputEl = ref<HTMLInputElement | null>(null)
const passwordInputEl = ref<{ focus: () => void } | null>(null)

function focusFirstField() {
  emailInputEl.value?.focus()
}

defineExpose({ focusFirstField })

async function handleSubmit() {
  if (isSubmitting.value) return

  clearErrors(errors)

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
      toast.error(mapAuthError(error))
      emailInputEl.value?.focus()
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
  <form class="auth-form" novalidate @submit.prevent="handleSubmit">
    <div class="form-field">
      <label for="login-email">Email <span class="form-field__required" aria-hidden="true">*</span></label>
      <input
        id="login-email"
        ref="emailInputEl"
        v-model="email"
        type="email"
        autocomplete="email"
        required
        :aria-invalid="Boolean(errors.email)"
        :aria-describedby="errors.email ? 'login-email-error' : undefined"
      />
      <p v-if="errors.email" id="login-email-error" class="form-field__error" role="alert">
        {{ errors.email }}
      </p>
    </div>

    <div class="form-field">
      <label for="login-password">Mot de passe <span class="form-field__required" aria-hidden="true">*</span></label>
      <PasswordInput
        id="login-password"
        ref="passwordInputEl"
        v-model="password"
        autocomplete="current-password"
        required
        :aria-invalid="Boolean(errors.password)"
        :aria-describedby="errors.password ? 'login-password-error' : undefined"
      />
      <p v-if="errors.password" id="login-password-error" class="form-field__error" role="alert">
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
      {{ isSubmitting ? 'Connexion en cours…' : 'Se connecter' }}
    </Button>

    <Button
      type="button"
      color="primary"
      variant="ghost"
      class="auth-form__switch"
      @click="emit('switch')"
    >
      Pas de compte ? Créer un compte
    </Button>
  </form>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
