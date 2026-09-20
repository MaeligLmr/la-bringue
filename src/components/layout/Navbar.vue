<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthModal } from '../../composables/useAuthModal'
import { useAuth } from '../../composables/useAuth'
import { useTheme } from '../../composables/useTheme'
import Button from '../ui/Button.vue'
import Modal from './Modal.vue'
import type { IconName } from '../../types/icon'
import logoLight from '../../assets/logo/Mode=Light.png'
import logoDark from '../../assets/logo/Mode=Dark.png'

const router = useRouter()
const { open } = useAuthModal()
const { user, isLoggedIn } = useAuth()
const { resolvedTheme } = useTheme()

// Falls back to the email for accounts created before the username field
// existed, or if it's ever missing for any other reason.
const displayName = computed(() => user.value?.user_metadata?.username ?? user.value?.email ?? '')

// The Figma export ships one logo lockup per theme ("Mode") rather than a
// single asset recolored in CSS.
const logoSrc = computed(() => (resolvedTheme.value === 'dark' ? logoDark : logoLight))

const SOCIALS: { icon: IconName; label: string }[] = [
  { icon: 'instagram', label: 'Instagram' },
  { icon: 'tiktok', label: 'TikTok' },
  { icon: 'whatsapp', label: 'WhatsApp' },
  { icon: 'facebook', label: 'Facebook' },
]

const isMenuOpen = ref(false)

function goTo(path: string) {
  router.push(path)
}

function goToAndCloseMenu(path: string) {
  isMenuOpen.value = false
  router.push(path)
}
</script>

<template>
  <header class="navbar">
    <div class="navbar__start">
      <Button color="primary" variant="outlined" class="navbar__newsletter">Newsletter</Button>
      <div class="navbar__socials">
        <Button
          v-for="social in SOCIALS"
          :key="social.icon"
          color="primary"
          variant="ghost"
          :icon-only="social.icon"
          :label="social.label"
        />
      </div>
    </div>

    <RouterLink to="/" class="navbar__logo" aria-label="Aller à l'accueil">
      <img :src="logoSrc" alt="La Bringue" />
    </RouterLink>

    <div class="navbar__end">
      <Button color="primary" variant="full" class="navbar__nav-link" @click="goTo('/billetterie')">
        Billetterie
      </Button>
      <Button color="primary" variant="outlined" class="navbar__nav-link" @click="goTo('/programmation')">
        Programmation
      </Button>

      <Button color="primary" variant="ghost" icon-only="heart" label="Mon programme" @click="goTo('/mon-programme')" />

      <template v-if="!isLoggedIn">
        <div class="navbar__auth-buttons">
          <Button color="primary" size="large" variant="outlined" @click="open('login')">Se connecter</Button>
          <Button color="primary" size="large" variant="full" @click="open('signup')">Créer un compte</Button>
        </div>
        <Button
          color="primary"
          variant="ghost"
          icon-only="user"
          label="Se connecter"
          class="navbar__auth-compact"
          @click="open('login')"
        />
      </template>
      <Button
        v-else
        color="primary"
        size="large"
        variant="ghost"
        icon-right="user"
        class="navbar__badge"
        @click="goTo('/profil')"
      >
        {{ displayName }}
      </Button>

      <Button
        color="primary"
        variant="ghost"
        icon-only="menu"
        label="Ouvrir le menu"
        @click="isMenuOpen = true"
      />
    </div>

    <Modal :open="isMenuOpen" title="Menu" @close="isMenuOpen = false">
      <nav class="navbar__menu">
        <Button color="primary" variant="outlined" @click="goToAndCloseMenu('/programmation')">
          Programmation
        </Button>
        <Button color="primary" variant="full" @click="goToAndCloseMenu('/billetterie')">
          Billetterie
        </Button>
        <Button color="primary" variant="outlined" class="navbar__newsletter">Newsletter</Button>
        <div class="navbar__socials">
          <Button
            v-for="social in SOCIALS"
            :key="social.icon"
            color="primary"
            variant="ghost"
            :icon-only="social.icon"
            :label="social.label"
          />
        </div>
      </nav>
    </Modal>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.navbar__start,
.navbar__end {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.navbar__socials {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.navbar__logo img {
  display: block;
  height: 1.75rem;
  width: auto;
}

.navbar__badge {
  max-width: 12rem;
}

.navbar__auth-buttons {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.navbar__auth-compact {
  display: none;
}

.navbar__badge :deep(.button__label) {
  overflow: hidden;
  text-overflow: ellipsis;
}

.navbar__menu {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3);
}

.navbar__menu .navbar__socials {
  justify-content: center;
}

/* En dessous de ce seuil (cf. src/style.css), Newsletter/réseaux sociaux et
   les liens Programmation/Billetterie ne sont plus affichés directement —
   ils restent accessibles depuis le menu burger. */
@media (max-width: 1024px) {
  .navbar__start,
  .navbar__nav-link,
  .navbar__auth-buttons {
    display: none;
  }

  .navbar__auth-compact {
    display: inline-flex;
  }

  .navbar__badge {
    max-width: 8rem;
  }
}
</style>
