<script setup lang="ts">
import Button from '../ui/Button.vue'
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
</script>

<template>
  <footer class="footer" :style="footerBackgroundStyle">
    <div class="footer__newsletter">
      <h2>Newsletter de La Bringue</h2>
      <p>Reste informé·e des annonces, de la programmation et de l'ouverture de la billetterie.</p>
      <Button color="primary" variant="full">S'inscrire</Button>
    </div>

    <div class="footer__address">
      <h2>Accéder au festival</h2>
      <address>Adresse du festival à venir.</address>
    </div>

    <nav class="footer__links" aria-label="Liens de bas de page">
      <RouterLink to="/a-propos" class="footer__link">À propos</RouterLink>
      <RouterLink to="/infos-pratiques" class="footer__link">Contact</RouterLink>
      <span class="footer__link footer__link--inert">Mentions légales</span>
    </nav>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  padding: var(--space-8) 5%;
  color: var(--text);
  background-color: var(--footer-image-mask);
  background-repeat: repeat;
}

.footer h2 {
  margin: 0 0 var(--space-2);
}

.footer__newsletter,
.footer__address {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  max-width: 24rem;
}

.footer address {
  font-style: normal;
}

.footer__links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  margin-left: auto;
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
</style>
