<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthModal } from '../../composables/useAuthModal'
import { useAuth } from '../../composables/useAuth'
import Button from '../ui/Button.vue'

const router = useRouter()
const { open } = useAuthModal()
const { user, isLoggedIn } = useAuth()

// Falls back to the email for accounts created before the username field
// existed, or if it's ever missing for any other reason.
const displayName = computed(() => user.value?.user_metadata?.username ?? user.value?.email ?? '')

function goToProfile() {
  router.push('/profil')
}
</script>

<template>
  <header class="navbar">
    <span class="navbar__brand">La Bringue</span>
    <nav class="navbar__actions">
      <template v-if="!isLoggedIn">
        <Button color="primary" size="large" variant="outlined" @click="open('login')">Se connecter</Button>
        <Button color="primary" size="large" variant="full" @click="open('signup')">Créer un compte</Button>
      </template>
      <Button
        v-else
        color="primary"
        size="large"
        variant="ghost"
        icon-right="user"
        class="navbar__badge"
        @click="goToProfile"
      >
        {{ displayName }}
      </Button>
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.navbar__brand {
  font-weight: 600;
  color: var(--text-h);
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.navbar__badge {
  max-width: 12rem;
}

.navbar__badge :deep(.button__label) {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
