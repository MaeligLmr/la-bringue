<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useTheme } from '../../composables/useTheme'
import Button from '../ui/Button.vue'
import Drawer from './Drawer.vue'
import type { IconName } from '../../types/icon'
import logoLight from '../../assets/logo/Logo-Light.svg'
import logoDark from '../../assets/logo/Logo-Dark.svg'

const router = useRouter()
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

const MENU_LINKS: { path: string; label: string }[] = [
  { path: '/exposants', label: 'Exposants' },
  { path: '/conferences', label: 'Conférences' },
  { path: '/a-propos', label: 'À propos' },
  { path: '/infos-pratiques', label: 'Infos pratiques' },
]

const isMenuOpen = ref(false)

// Mesuré au lieu de figé en dur (la navbar est en position fixed, donc hors
// du flux : le drawer doit démarrer pile en dessous, et le contenu de page
// a besoin d'un padding-top équivalent — voir --navbar-height, posée sur
// :root pour être lisible en dehors du scope de ce composant).
const navbarEl = ref<HTMLElement | null>(null)
const navbarHeight = ref(0)
let navbarResizeObserver: ResizeObserver | null = null

function updateNavbarHeight() {
  navbarHeight.value = navbarEl.value?.offsetHeight ?? 0
  document.documentElement.style.setProperty('--navbar-height', `${navbarHeight.value}px`)
}

onMounted(() => {
  if (!navbarEl.value) return
  updateNavbarHeight()
  if (typeof ResizeObserver === 'undefined') return
  navbarResizeObserver = new ResizeObserver(updateNavbarHeight)
  navbarResizeObserver.observe(navbarEl.value)
})

onUnmounted(() => {
  navbarResizeObserver?.disconnect()
})

function goTo(path: string) {
  router.push(path)
}

function goToAndCloseMenu(path: string) {
  isMenuOpen.value = false
  router.push(path)
}
</script>

<template>
  <header ref="navbarEl" class="navbar">
    <div class="navbar__inner w-full flex items-center">
      <div class="navbar__start flex items-center justify-start">
        <Button color="secondary" variant="outlined" class="navbar__newsletter">Newsletter</Button>
        <div class="navbar__socials">
          <Button
            v-for="social in SOCIALS"
            :key="social.icon"
            color="secondary"
            variant="ghost"
            :icon-only="social.icon"
            :label="social.label"
          />
        </div>
      </div>

      <RouterLink to="/" class="navbar__logo" aria-label="Aller à l'accueil">
        <img :src="logoSrc" alt="La Bringue" />
      </RouterLink>

      <div class="navbar__end flex items-center justify-end">
        <Button color="primary" variant="full" class="navbar__nav-link" @click="goTo('/billetterie')">
          Billetterie
        </Button>
        <Button color="primary" variant="outlined" class="navbar__nav-link" @click="goTo('/programmation')">
          Programmation
        </Button>

        <Button color="primary" variant="ghost" icon-only="heart" label="Mon programme" @click="goTo('/mon-programme')" />

        <Button
          v-if="isLoggedIn"
          color="primary"
          size="medium"
          variant="ghost"
          icon-right="user"
          class="navbar__badge"
          @click="goTo('/profil')"
        >
          {{ displayName }}
        </Button>
        <Button
          v-else
          color="primary"
          variant="ghost"
          icon-only="user"
          label="Profil"
          @click="goTo('/profil')"
        />

        <Button
          color="primary"
          variant="ghost"
          icon-only="menu"
          label="Ouvrir le menu"
          @click="isMenuOpen = true"
        />
      </div>
    </div>

    <Drawer :open="isMenuOpen" :top="`${navbarHeight}px`" @close="isMenuOpen = false">
      <nav class="navbar__menu">
        <Button
          v-for="link in MENU_LINKS"
          :key="link.path"
          color="primary"
          variant="ghost"
          @click="goToAndCloseMenu(link.path)"
        >
          {{ link.label }}
        </Button>

        <!-- Uniquement en dessous de 1024px : sur desktop, ces liens sont
             déjà visibles directement dans la barre, pas besoin de les
             dupliquer ici. -->
        <div class="navbar__menu-mobile-only">
          <Button color="primary" variant="outlined" @click="goToAndCloseMenu('/programmation')">
            Programmation
          </Button>
          <Button color="primary" variant="full" @click="goToAndCloseMenu('/billetterie')">
            Billetterie
          </Button>
          <Button color="secondary" variant="outlined" class="navbar__newsletter">Newsletter</Button>
          <div class="navbar__socials">
            <Button
              v-for="social in SOCIALS"
              :key="social.icon"
              color="secondary"
              variant="ghost"
              :icon-only="social.icon"
              :label="social.label"
            />
          </div>
        </div>
      </nav>
    </Drawer>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: var(--space-4);
  background: color-mix(in srgb, var(--bg) 55%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.navbar__inner {
  /* Contexte de positionnement pour le logo, centré en absolute ci-dessous
     — sa position ne dépend alors plus de la largeur (différente) du
     contenu de chaque côté, contrairement à un partage flex-grow égal qui
     ne centre vraiment que si les deux côtés font la même largeur. */
  position: relative;
  gap: var(--space-4);
}

.navbar__start,
.navbar__end {
  gap: var(--space-2);
}

.navbar__start {
  display: none;
}

.navbar__end {
  /* Toujours collé à droite, que navbar__start soit affiché ou non. */
  margin-left: auto;
}

.navbar__nav-link {
  display: none;
}

.navbar__socials {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.navbar__logo {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.navbar__logo img {
  display: block;
  height: 1.75rem;
  width: auto;
}

.navbar__badge {
  max-width: 8rem;
}

.navbar__badge :deep(.button__label) {
  overflow: hidden;
  text-overflow: ellipsis;
}

.navbar__menu,
.navbar__menu-mobile-only {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3);
}

.navbar__menu .navbar__socials {
  justify-content: center;
}

@media (min-width: 1025px) {
  /* Newsletter/réseaux sociaux et les liens Programmation/Billetterie
     redeviennent visibles directement dans la barre... */
  .navbar__start {
    display: flex;
  }

  .navbar__nav-link {
    display: inline-flex;
  }

  .navbar__badge {
    max-width: 12rem;
  }

  /* ...donc plus besoin de les dupliquer dans le menu burger. */
  .navbar__menu-mobile-only {
    display: none;
  }
}
</style>
