<script setup lang="ts">
import { reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuth } from '../composables/useAuth'
import { useAuthModal } from '../composables/useAuthModal'
import { useTheme } from '../composables/useTheme'
import type { ThemePreference } from '../composables/useTheme'
import { validateProfileFields, type FieldErrors } from '../lib/auth-validation'
import { mapAuthError } from '../lib/auth-errors'
import { withTimeout } from '../lib/with-timeout'
import { supabase } from '../supabase.js'
import Button from '../components/ui/Button.vue'
import Select from '../components/ui/Select.vue'
import Icon from '../components/ui/Icon.vue'

const router = useRouter()
const { user, isLoggedIn, signOut } = useAuth()
const { open } = useAuthModal()
const { preference, setPreference } = useTheme()

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Par défaut' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
]

function onThemeChange(value: string) {
  setPreference(value as ThemePreference)
}

const firstName = ref('')
const lastName = ref('')
const username = ref('')
const errors = reactive<FieldErrors>({})
const isSaving = ref(false)

// Keeps the form in sync with the account's current metadata — including
// right after a successful save, since updateUser() below feeds back into
// this same `user` (useAuth listens for Supabase's own auth events).
watchEffect(() => {
  firstName.value = user.value?.user_metadata?.first_name ?? ''
  lastName.value = user.value?.user_metadata?.last_name ?? ''
  username.value = user.value?.user_metadata?.username ?? ''
})

async function handleSave() {
  if (isSaving.value) return

  errors.firstName = undefined
  errors.lastName = undefined
  errors.username = undefined

  const fieldErrors = validateProfileFields({
    firstName: firstName.value,
    lastName: lastName.value,
    username: username.value,
  })
  if (Object.keys(fieldErrors).length > 0) {
    Object.assign(errors, fieldErrors)
    return
  }

  isSaving.value = true
  try {
    const { error } = await withTimeout(
      supabase.auth.updateUser({
        data: {
          first_name: firstName.value,
          last_name: lastName.value,
          username: username.value,
        },
      })
    )

    if (error) {
      toast.error(mapAuthError(error))
      return
    }

    toast.success('Profil mis à jour.')
  } catch (thrown) {
    toast.error(mapAuthError(thrown))
  } finally {
    isSaving.value = false
  }
}

async function handleSignOut() {
  await signOut()
  router.push('/')
}
</script>

<template>
  <main class="profile">
    <div class="profile__header">
      <Icon name="user" size="large" />
      <h1>Mon profil</h1>
    </div>

    <div v-if="!isLoggedIn" class="profile__guest">
      <p>Connecte-toi ou crée un compte pour accéder à ton profil.</p>
      <div class="profile__guest-actions">
        <Button color="primary" variant="outlined" @click="open('login')">Se connecter</Button>
        <Button color="primary" variant="full" @click="open('signup')">Créer un compte</Button>
      </div>
    </div>

    <form v-else class="profile__form" novalidate @submit.prevent="handleSave">
      <div class="profile__field">
        <label for="profile-first-name">Prénom <span class="profile__required" aria-hidden="true">*</span></label>
        <input
          id="profile-first-name"
          v-model="firstName"
          type="text"
          autocomplete="given-name"
          required
          :aria-invalid="Boolean(errors.firstName)"
          :aria-describedby="errors.firstName ? 'profile-first-name-error' : undefined"
        />
        <p v-if="errors.firstName" id="profile-first-name-error" class="profile__error" role="alert">
          {{ errors.firstName }}
        </p>
      </div>

      <div class="profile__field">
        <label for="profile-last-name">Nom <span class="profile__required" aria-hidden="true">*</span></label>
        <input
          id="profile-last-name"
          v-model="lastName"
          type="text"
          autocomplete="family-name"
          required
          :aria-invalid="Boolean(errors.lastName)"
          :aria-describedby="errors.lastName ? 'profile-last-name-error' : undefined"
        />
        <p v-if="errors.lastName" id="profile-last-name-error" class="profile__error" role="alert">
          {{ errors.lastName }}
        </p>
      </div>

      <div class="profile__field">
        <label for="profile-username">Nom d'utilisateur <span class="profile__required" aria-hidden="true">*</span></label>
        <input
          id="profile-username"
          v-model="username"
          type="text"
          autocomplete="username"
          required
          :aria-invalid="Boolean(errors.username)"
          :aria-describedby="errors.username ? 'profile-username-error' : undefined"
        />
        <p v-if="errors.username" id="profile-username-error" class="profile__error" role="alert">
          {{ errors.username }}
        </p>
      </div>

      <Button type="submit" color="primary" variant="full" class="profile__save" :disabled="isSaving">
        {{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}
      </Button>
    </form>

    <div class="profile__field">
      <span class="profile__field-label">Thème</span>
      <Select
        aria-label="Thème"
        size="medium"
        :model-value="preference"
        :options="THEME_OPTIONS"
        @update:model-value="onThemeChange"
      />
    </div>

    <Button
      v-if="isLoggedIn"
      color="danger"
      variant="outlined"
      class="profile__sign-out"
      @click="handleSignOut"
    >
      Se déconnecter
    </Button>
  </main>
</template>

<style scoped>
.profile {
  max-width: 24rem;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-6);
}

.profile__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.profile__header h1 {
  margin: 0;
}

.profile__guest {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.profile__guest-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.profile__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 24rem;
}

.profile__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
}

.profile__field label,
.profile__field-label {
  font-weight: var(--font-weight-medium);
  color: var(--text-h);
}

.profile__required {
  color: var(--alert-danger-text);
}

.profile__field input {
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
}

.profile__field input[aria-invalid='true'] {
  border-color: var(--alert-danger-border);
}

.profile__error {
  margin: 0;
  color: var(--alert-danger-text);
  font-size: 0.85em;
}
</style>
