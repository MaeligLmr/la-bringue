<script setup lang="ts">
import Button from '../ui/Button.vue'
import Icon from '../ui/Icon.vue'
import type { IconName } from '../../types/icon'
import footerBg from '../../assets/footer/footer-bg.png'

// Le motif est carrelé en repeat et teinté par --footer-image-mask à ~35%
// d'opacité — reproduit en CSS pur via un dégradé plat de cette même
// couleur superposé à l'image, plutôt qu'en pré-générant un PNG à 35%
// d'opacité. L'URL de l'image doit rester un style inline (et non
// v-bind() dans <style>, qui produit url(var(--x)) : lightningcss refuse
// ça à la minification en build de prod).
const footerBackgroundStyle = {
  backgroundImage: `linear-gradient(color-mix(in srgb, var(--footer-image-mask) 65%, transparent), color-mix(in srgb, var(--footer-image-mask) 65%, transparent)), url(${footerBg})`,
}

const SOCIALS: { icon: IconName; label: string }[] = [
  { icon: 'instagram', label: 'Instagram' },
  { icon: 'tiktok', label: 'TikTok' },
  { icon: 'whatsapp', label: 'WhatsApp' },
  { icon: 'facebook', label: 'Facebook' },
]
</script>

<template>
  <footer class="footer" :style="footerBackgroundStyle">
    <div class="footer__newsletter">
      <h3>La newsletter de LA BRINGUE</h3>
      <Button color="secondary" variant="full" size="large" class="footer__newsletter-button">
        S'inscrire à la newsletter
      </Button>
    </div>

    <div class="footer__main">
      <div class="footer__address-block">
        <h3>Accéder au festival</h3>
        <address class="footer__address">
          <Icon name="map" size="small" />
          <span>Adresse du festival à venir.</span>
        </address>
      </div>

      <div class="footer__secondary">
        <nav class="footer__links" aria-label="Liens de bas de page">
          <RouterLink to="/a-propos" class="footer__link">À propos</RouterLink>
          <RouterLink to="/infos-pratiques" class="footer__link">Infos pratiques</RouterLink>
          <RouterLink to="/infos-pratiques" class="footer__link">Contact</RouterLink>
          <span class="footer__link footer__link--inert">Mentions légales</span>
        </nav>

        <div class="footer__socials">
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
    </div>
  </footer>
</template>

<style scoped>
/* Mobile first : tout est empilé dans l'ordre du DOM ; le bloc @media plus
   bas passe la section newsletter et la section principale en rangées
   (titre/bouton d'un côté, adresse/liens/réseaux sociaux de l'autre) pour
   desktop. */
.footer {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-8) 5%;
  color: var(--text);
  text-align: center;
  background-color: var(--footer-image-mask);
  background-repeat: repeat;
}

.footer h3 {
  margin: 0 0 var(--space-2);
}

.footer__newsletter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding-bottom: var(--space-6);
  /* Dérivée du texte du footer plutôt que du token --border générique
     (pensé pour le fond de page, pas pour le fond distinct du footer) —
     garantit un contraste correct dans les deux thèmes. */
  border-bottom: 1px solid color-mix(in srgb, var(--text) 25%, transparent);
}

.footer__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
}

.footer__address-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer__address {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-style: normal;
  margin: 0;
}

.footer__secondary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.footer__links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.footer__link {
  color: var(--text-h);
  text-decoration: none;
}

.footer__link:hover {
  text-decoration: underline;
}

.footer__link--inert {
  cursor: default;
  opacity: 0.7;
}

.footer__link--inert:hover {
  text-decoration: none;
}

.footer__socials {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

@media (min-width: 1025px) {
  .footer {
    text-align: left;
  }

  .footer__newsletter {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .footer__newsletter h3 {
    margin: 0;
  }

  .footer__main {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }

  .footer__address-block,
  .footer__secondary {
    align-items: flex-start;
  }

  .footer__address {
    justify-content: flex-start;
  }
}
</style>
