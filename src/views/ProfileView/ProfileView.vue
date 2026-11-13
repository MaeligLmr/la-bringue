<script setup lang="ts">
import { reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuth } from '../../composables/useAuth/useAuth'
import { useAuthModal } from '../../composables/useAuthModal/useAuthModal'
import { clearErrors, validateProfileFields, type FieldErrors } from '../../lib/auth-validation/auth-validation'
import { mapAuthError } from '../../lib/auth-errors/auth-errors'
import { withTimeout } from '../../lib/with-timeout/with-timeout'
import { supabase } from '../../supabase.js'
import Button from '../../components/ui/Button/Button.vue'

const router = useRouter()
const { user, isLoggedIn, isAdmin, signOut } = useAuth()
const { open } = useAuthModal()

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

  clearErrors(errors)

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
    

    <div v-if="!isLoggedIn" class="profile__guest">
      <p>Connecte-toi ou crée un compte pour accéder à ton profil.</p>
      <div class="profile__guest-actions">
        <Button color="primary" variant="outlined" @click="open('login')">Se connecter</Button>
        <Button color="primary" variant="full" @click="open('signup')">Créer un compte</Button>
      </div>
    </div>

    <form v-else class="profile__form" novalidate @submit.prevent="handleSave">
      <div class="form-field">
        <label for="profile-first-name">Prénom <span class="form-field__required" aria-hidden="true">*</span></label>
        <input
          id="profile-first-name"
          v-model="firstName"
          type="text"
          autocomplete="given-name"
          required
          :aria-invalid="Boolean(errors.firstName)"
          :aria-describedby="errors.firstName ? 'profile-first-name-error' : undefined"
        />
        <p v-if="errors.firstName" id="profile-first-name-error" class="form-field__error" role="alert">
          {{ errors.firstName }}
        </p>
      </div>

      <div class="form-field">
        <label for="profile-last-name">Nom <span class="form-field__required" aria-hidden="true">*</span></label>
        <input
          id="profile-last-name"
          v-model="lastName"
          type="text"
          autocomplete="family-name"
          required
          :aria-invalid="Boolean(errors.lastName)"
          :aria-describedby="errors.lastName ? 'profile-last-name-error' : undefined"
        />
        <p v-if="errors.lastName" id="profile-last-name-error" class="form-field__error" role="alert">
          {{ errors.lastName }}
        </p>
      </div>

      <div class="form-field">
        <label for="profile-username">Nom d'utilisateur <span class="form-field__required" aria-hidden="true">*</span></label>
        <input
          id="profile-username"
          v-model="username"
          type="text"
          autocomplete="username"
          required
          :aria-invalid="Boolean(errors.username)"
          :aria-describedby="errors.username ? 'profile-username-error' : undefined"
        />
        <p v-if="errors.username" id="profile-username-error" class="form-field__error" role="alert">
          {{ errors.username }}
        </p>
      </div>

      <Button type="submit" color="primary" variant="full" class="profile__save" :disabled="isSaving">
        {{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}
      </Button>
    </form>

    <Button
      v-if="isAdmin"
      color="primary"
      variant="outlined"
      icon-left="settings"
      @click="router.push('/admin')"
    >
      Back office
    </Button>

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
  /* Seule page sans Hero : la navbar est en position: absolute (flotte
     par-dessus la première section de chaque page, voir Navbar.vue) et
     ne réserve donc plus sa place — il faut compenser ici explicitement. */
  padding: calc(var(--navbar-height) + var(--space-8)) var(--space-4) var(--space-8);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-6);
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
</style>
