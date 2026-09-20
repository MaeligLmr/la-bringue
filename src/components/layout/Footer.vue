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
    <h2 class="footer__newsletter-heading">La newsletter de LA BRINGUE</h2>

    <Button color="secondary" variant="full" class="footer__newsletter-button">
      S'inscrire à la newsletter
    </Button>

    <div class="footer__address-block">
      <h2>Accéder au festival</h2>
      <address class="footer__address">
        <Icon name="map" size="small" />
        <span>Adresse du festival à venir.</span>
      </address>
    </div>

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
  </footer>
</template>

<style scoped>
/* Mobile first : tout est empilé dans l'ordre du DOM (titre newsletter,
   bouton, bloc adresse, liens, réseaux sociaux) ; le bloc @media plus bas
   recompose en deux colonnes pour desktop via grid-template-areas, sans
   changer l'ordre du DOM. */
.footer {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8) 5%;
  color: var(--text);
  text-align: center;
  background-color: var(--footer-image-mask);
  background-repeat: repeat;
}

.footer h2 {
  margin: 0 0 var(--space-2);
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
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: var(--space-4) var(--space-8);
    text-align: left;
  }

  .footer__newsletter-heading {
    grid-column: 1;
    grid-row: 1;
  }

  .footer__newsletter-button {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }

  .footer__address-block {
    grid-column: 1;
    grid-row: 2;
    align-items: flex-start;
  }

  .footer__address {
    justify-content: flex-start;
  }

  .footer__links {
    grid-column: 2;
    grid-row: 2;
    align-items: flex-end;
    align-self: start;
  }

  .footer__socials {
    grid-column: 2;
    grid-row: 3;
    justify-self: end;
    align-self: end;
  }
}
</style>
