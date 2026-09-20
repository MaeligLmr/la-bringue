<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from '../ui/Button.vue'
import heroBg from '../../assets/hero/hero-bg.png'
import starIcon from '../../assets/hero/étoile top.svg'

withDefaults(defineProps<{ homePage?: boolean }>(), { homePage: false })

const router = useRouter()

function goToAbout() {
  router.push('/a-propos')
}

// Le motif (voir src/assets/hero/hero-bg.png) est en cover (pas en repeat,
// contrairement au footer — c'est une texture pleine, pas un carreau) et
// teinté par --main-image-mask à ~40% d'opacité, même technique que le
// footer (dégradé plat superposé à l'image). L'URL doit rester un style
// inline (:style), pas v-bind() dans <style scoped> : ça compile en
// url(var(--x)), invalide pour le minifieur CSS de prod (lightningcss).
const heroBackgroundStyle = {
  backgroundImage: `linear-gradient(color-mix(in srgb, var(--main-image-mask) 60%, transparent), color-mix(in srgb, var(--main-image-mask) 60%, transparent)), url(${heroBg})`,
}
</script>

<template>
  <section class="hero" :class="{ 'hero--home': homePage }" :style="heroBackgroundStyle">
    <!-- Étoiles en position: absolute (voir <style>) : purement
         décoratives, retirées du flux, elles ne participent plus à la
         largeur de .hero__title — le titre reste centré sur lui-même quel
         que soit leur nombre (1 en générique, 2 sur home). -->
    <div class="hero__title">
      <img class="hero__star hero__star--left" :src="starIcon" alt="" aria-hidden="true" />

      <h1>LA BRINGUE</h1>

      <img v-if="homePage" class="hero__star hero__star--right" :src="starIcon" alt="" aria-hidden="true" />

      <!-- En absolute par rapport à .hero__title (voir <style>) : le texte
           et le bouton se placent sous "LA BRINGUE" sans influer sur son
           propre centrage dans la section. -->
      <div class="hero__below">
        <h3 class="hero__dates">LE FESTIVAL<br />du 28 au 30 août</h3>

        <Button v-if="homePage" color="secondary" variant="full" size="large" @click="goToAbout">En savoir plus</Button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  /* Flex + align/justify: center centre .hero__title (seul enfant en flux
     normal) au milieu de la section, sans calcul manuel de position — voir
     .hero__title. */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* padding-top inclut la hauteur de la navbar (fixed, donc flottant
     par-dessus le Hero — voir Navbar.vue) : le FOND du Hero s'étend bien
     jusqu'en haut, derrière elle, mais son CONTENU (texte/étoiles) doit
     rester dégagé pour ne pas passer dessous. */
  padding: calc(var(--navbar-height) + var(--space-8)) 5% var(--hero-section-padding-bottom);
  /* .hero__below (texte + bouton) est en position: absolute par rapport à
     .hero__title et ne contribue donc plus à la hauteur par le flux normal
     — il faut une hauteur minimale explicite pour la variante générique
     (la home a déjà min-height: 100vh via .hero--home) pour ne pas le
     laisser déborder sous la section. */
  min-height: 20rem;
  text-align: center;
  background-color: var(--main-image-mask);
  background-size: cover;
  background-position: center;
  box-sizing: border-box;
  /* Les étoiles débordent volontairement de .hero__title (voir
     .hero__star) ; on les clippe au bord de la section pour ne jamais
     provoquer de scroll horizontal ni déborder sur les sections voisines. */
  overflow: hidden;
}

.hero--home {
  /* Plein viewport : la navbar flotte par-dessus (fixed) au lieu de
     réserver sa propre place, donc pas de calc(100vh - hauteur nav) ici. */
  min-height: 100vh;
  padding-top: calc(var(--navbar-height) + var(--space-10));
  padding-bottom: calc(var(--hero-section-padding-bottom) + var(--space-4));
}

.hero__title {
  /* Contexte de positionnement pour les étoiles et .hero__below (voir plus
     bas), qui ne doivent pas influer sur le centrage de "LA BRINGUE" —
     géré par .hero (flex + align/justify: center) plutôt que par un calcul
     manuel de position ici. */
  position: relative;
  display: inline-block;
}

.hero__below {
  /* Sous "LA BRINGUE", ancré à .hero__title (et non à .hero) pour rester
     collé au titre quelle que soit sa hauteur (fluide, voir h1 plus bas). */
  position: absolute;
  top: 90%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--hero-section-gap);
  white-space: nowrap;
}
.hero--home .hero__below {
  top: 110%;
  margin-top: clamp(var(--space-8), 1rem + 4vw, var(--space-20));
}

.hero h1 {
  position: relative;
  /* Au-dessus des étoiles (voir .hero__star) : sans ça, l'étoile ajoutée
     après le h1 dans le DOM (hero__star--right) passerait devant lui. */
  z-index: 1;
  margin: 0;
  font-family: var(--hero-font);
  color: var(--hero-section-h1);
  /* Taille proportionnelle au viewport (fluide) plutôt que deux valeurs
     figées par breakpoint : interpolation linéaire entre 5.25rem/375px de
     large (plancher, borné pour rester lisible et tenir sur une seule
     ligne dès les petits téléphones) et 9.375rem/1025px (--font-size-hero,
     plafond desktop). */
  font-size: clamp(5.25rem, 2.87rem + 10.15vw, var(--font-size-hero));
  line-height: 1.1;
}

.hero__star {
  position: absolute;
  top: 50%;
  /* height: auto (et non une hauteur figée) pour respecter le ratio naturel
     du fichier source (348x250) : une hauteur fixe différente de ce ratio
     écrasait visuellement l'étoile. */
  /* Même logique fluide que le h1 : 8rem/375px -> 12rem/1025px. */
  width: clamp(8rem, 5.69rem + 9.85vw, 12rem);
  height: auto;
}

.hero__star--left {
  left: 0;
  transform: translate(-35%, -85%) rotate(-10deg) ;
}

.hero__star--right {
  right: 0;
  transform: translate(30%, -17%) rotate(180deg);
}

/* Sur la home, le Hero occupe tout le viewport (100vh) : les étoiles y
   gagnent en présence, contrairement à la variante générique plus compacte.
   Même logique fluide : 13rem/375px -> 26rem/1025px. */
.hero--home .hero__star {
  width: clamp(13rem, 5.5rem + 32vw, 26rem);
}

.hero__dates {
  position: relative;
  margin: 0;
  color: var(--hero-section-text);
  /* --font-size-hero-dates n'existe dans aucun fichier de tokens (référence
     morte) : ça retombait sur --font-size-heading-3 (1.5rem) hérité du
     h3 global, bien trop petit à côté du h1. Taille fixe (pas de clamp
     fluide ici, contrairement au h1) : elle ne doit pas varier avec le
     viewport. */
  font-size: 1.5em;
  line-height: 1.3;
}

@media (min-width: 1025px) {
  .hero__star--left {
  transform: translate(-45%, -75%) ;
}

.hero__star--right {
  transform: translate(55%, -40%) rotate(170deg);
}
}
</style>
