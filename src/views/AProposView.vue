<script setup lang="ts">
import { useScrollReveal } from '../composables/useScrollReveal'
import Hero from '../components/layout/Hero.vue'
import Button from '../components/ui/Button.vue'
import { SOCIALS } from '../lib/socials'
import diceChrome from '../assets/scenes/chrome/dice.png'
import starChrome from '../assets/scenes/chrome/star.png'
import flowerSummer from '../assets/scenes/summer/flower.png'
import shellSummer from '../assets/scenes/summer/shell.png'
import stars2000 from '../assets/scenes/2000/stars.png'
import pa2000 from '../assets/scenes/2000/pa.png'
import kittySoft from '../assets/scenes/soft/hellokitty.png'
import cherriesSoft from '../assets/scenes/soft/cherries.png'

// Apparition au défilement (voir composables/useScrollReveal.ts), sur les blocs de la page.
useScrollReveal(
  '.a-propos__intro, .a-propos__section, .a-propos__valeur, .a-propos__scenes-intro, .a-propos__scene, .a-propos__conclusion'
)
</script>

<template>
  <main class="a-propos">
    <Hero />

    <div class="a-propos__content">
      <header class="a-propos__intro">
        <h1>À propos</h1>
        <p class="a-propos__chapeau">
          Un espace pour sortir, profiter et se sentir en sécurité.
        </p>
      </header>

      <section class="a-propos__section" aria-labelledby="asso-titre">
        <h2 id="asso-titre">L'association La Bringue</h2>
        <p>
          La Bringue est une association qui offre aux femmes un espace pour sortir, profiter et se
          sentir en sécurité. Trop souvent, la fête et l'espace public ne sont pas pensés pour elles :
          nous voulons changer cela en créant des moments où elles peuvent se retrouver, se divertir
          et être elles-mêmes, sans appréhension.
        </p>
        <p>
          Notre action repose sur la bienveillance, l'entraide et la convivialité. Nous croyons que
          faire la fête et défendre des valeurs féministes vont de pair.
        </p>
      </section>

      <section class="a-propos__section" aria-labelledby="valeurs-titre">
        <h2 id="valeurs-titre">Nos valeurs</h2>
        <ul class="a-propos__valeurs">
          <li class="a-propos__valeur">
            <h3>Bienveillant et safe</h3>
            <p>
              Chacune doit pouvoir sortir, danser et profiter sans craindre pour sa sécurité. Ici, le
              respect des autres et de leurs limites est la règle de base.
            </p>
          </li>
          <li class="a-propos__valeur">
            <h3>Féministe et inclusif</h3>
            <p>
              Nous créons un espace où les femmes sont au centre, où chaque parcours a sa place et où
              la parole circule librement. « No men, no problem. »
            </p>
          </li>
          <li class="a-propos__valeur">
            <h3>Écologique</h3>
            <p>
              Un festival en plein air se doit de respecter le lieu qui l'accueille : nous pensons
              l'événement pour limiter son impact sur l'environnement.
            </p>
          </li>
          <li class="a-propos__valeur">
            <h3>Friendly pour tous les régimes</h3>
            <p>
              Végétarienne, végétalienne, sans gluten ou simplement gourmande : la restauration est
              pensée pour que chacune puisse bien manger.
            </p>
          </li>
        </ul>
      </section>

      <section class="a-propos__section" aria-labelledby="festival-titre">
        <h2 id="festival-titre">Le festival</h2>
        <p>
          Le festival La Bringue est le prolongement de la mission de l'association à l'échelle d'un
          événement en plein air, sur plusieurs jours. Il a été organisé pour trois raisons :
        </p>
        <ul class="a-propos__raisons">
          <li>Rassembler des femmes venues de villes différentes</li>
          <li>Élargir les styles musicaux représentés</li>
          <li>Profiter de l'été pour se retrouver dehors</li>
        </ul>
      </section>
    </div>

    <section class="a-propos__scenes-bande" aria-labelledby="scenes-titre">
      <div class="a-propos__scenes-intro">
        <h2 id="scenes-titre">Quatre scènes, quatre ambiances</h2>
      </div>
        <ul class="a-propos__scenes" aria-label="Les scènes du festival">
          <li class="a-propos__scene a-propos__scene--chrome">
            <div class="a-propos__scene-texte">
              <img :src="diceChrome" alt="" aria-hidden="true" class="a-propos__sticker a-propos__sticker--haut" />
              <h3>
                <RouterLink :to="{ name: 'programmation', query: { scene: 'chrome' } }" class="a-propos__scene-lien">Chrome</RouterLink>
              </h3>
              <img :src="starChrome" alt="" aria-hidden="true" class="a-propos__sticker a-propos__sticker--bas" />
            </div>
          </li>
          <li class="a-propos__scene a-propos__scene--summer">
            <img :src="flowerSummer" alt="" aria-hidden="true" class="a-propos__sticker a-propos__sticker--haut" />
            <div class="a-propos__scene-texte">
              <h3>
                <RouterLink :to="{ name: 'programmation', query: { scene: 'summer' } }" class="a-propos__scene-lien">Summer</RouterLink>
              </h3>
            </div>
            <img :src="shellSummer" alt="" aria-hidden="true" class="a-propos__sticker a-propos__sticker--bas" />
          </li>
          <li class="a-propos__scene a-propos__scene--2000">
            <img :src="stars2000" alt="" aria-hidden="true" class="a-propos__sticker a-propos__sticker--haut" />
            <div class="a-propos__scene-texte">
              <h3>
                <RouterLink :to="{ name: 'programmation', query: { scene: '2000' } }" class="a-propos__scene-lien">2000's</RouterLink>
              </h3>
            </div>
            <img :src="pa2000" alt="" aria-hidden="true" class="a-propos__sticker a-propos__sticker--bas" />
          </li>
          <li class="a-propos__scene a-propos__scene--soft">
            <img :src="kittySoft" alt="" aria-hidden="true" class="a-propos__sticker a-propos__sticker--haut" />
            <div class="a-propos__scene-texte">
              <h3>
                <RouterLink :to="{ name: 'programmation', query: { scene: 'soft' } }" class="a-propos__scene-lien">Soft Y2K</RouterLink>
              </h3>
            </div>
            <img :src="cherriesSoft" alt="" aria-hidden="true" class="a-propos__sticker a-propos__sticker--bas" />
          </li>
        </ul>
    </section>

    <div class="a-propos__content a-propos__content--suite">
      <section class="a-propos__section" aria-labelledby="stands-titre">
        <h2 id="stands-titre">Et entre deux concerts</h2>
        <p>
          Des stands (tatouage, photobooth, marché d'artistes indépendants, restauration) et un
          espace conférences, où des invitées échangent autour de discussions féministes.
        </p>
      </section>

      <section class="a-propos__section" aria-labelledby="reseaux-titre">
        <h2 id="reseaux-titre">Retrouvez-nous</h2>
        <p>Suivez La Bringue pour ne rien rater des annonces, des coulisses et des surprises.</p>
        <ul class="a-propos__reseaux">
          <li v-for="social in SOCIALS" :key="social.icon">
            <Button
              color="primary"
              variant="outlined"
              :icon-left="social.icon"
              :href="social.url"
            >
              {{ social.label }}
            </Button>
          </li>
        </ul>
      </section>

    </div>
  </main>
</template>

<style scoped>
.a-propos {
  /* clip (et non hidden) : coupe ce qui déborde sans créer de zone de défilement. */
  overflow-x: clip;
}

.a-propos__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-12, var(--space-8));
  width: 100%;
  max-width: 48rem;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4) var(--space-20);
  box-sizing: border-box;
}

.a-propos__intro h1,
.a-propos__section h2,
.a-propos__section h3,
.a-propos__valeur h3 {
  margin: 0;
}

.a-propos__chapeau {
  margin: var(--space-2) 0 0;
  font-size: 1.25rem;
  color: var(--text-h);
}

.a-propos__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border);
}

.a-propos__section p {
  margin: 0;
}

.a-propos__section h3 {
  margin-top: var(--space-3);
}

/* Valeurs : cartes en grille. */
.a-propos__valeurs {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  margin: var(--space-2) 0 0;
  padding: 0;
  list-style: none;
}

.a-propos__valeur {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-medium);
  box-shadow: 0 0.25rem 1rem var(--card-shadow-color);
}

.a-propos__valeur h3 {
  color: var(--tag-pink-text);
}

/* Raisons du festival : liste à puces rose. */
.a-propos__raisons {
  margin: 0;
  padding-left: var(--space-5, 1.25rem);
}

.a-propos__raisons li::marker {
  color: var(--tag-pink-text);
}

.a-propos__content--suite {
  padding-top: 0;
}

/* Bande pleine largeur, hors de la colonne centrale. */
.a-propos__scenes-bande {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
  padding: var(--space-8) var(--space-8) var(--space-12, var(--space-8));
  box-sizing: border-box;
}

.a-propos__scenes-intro {
  max-width: 48rem;
  margin: 0 auto;
  text-align: center;
}

.a-propos__scenes-intro h2,
.a-propos__scenes-intro p {
  margin: 0;
}

.a-propos__scenes-intro p {
  margin-top: var(--space-2);
}

/* Scènes : juste le nom en gros, dans le style de chaque scène, avec ses deux
   stickers « avant » (haut-gauche) et « après » (bas-droite). Les quatre
   tiennent sur un écran, inclinés comme posés en vrac. La police de chaque
   scène (token du design) passe en premier ; à défaut, une police Google
   Fonts de la même ambiance (voir index.html). */
.a-propos__scenes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-6) var(--space-8);
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--space-10, 2.5rem) var(--space-6);
  box-sizing: border-box;
  list-style: none;
}

.a-propos__scene {
  position: relative;
  padding: var(--space-3) var(--space-5);
  transform: translateY(var(--scene-dy, 0)) rotate(var(--scene-angle, 0deg));
  transition: transform 0.25s ease;
}

.a-propos__scene:hover {
  transform: translateY(var(--scene-dy, 0)) rotate(0deg) scale(1.1);
  z-index: 10;
}

.a-propos__scene h3 {
  margin: 0;
  font-family: var(--scene-police), var(--heading);
  font-size: clamp(2rem, 8vw, 5.5rem);
  line-height: 1;
  text-align: center;
  white-space: nowrap;
}

/* Lien étiré sur toute la zone : cliquable vers la programmation filtrée. */
.a-propos__scene-lien {
  color: inherit;
  text-decoration: none;
}

.a-propos__scene-lien::after {
  content: '';
  position: absolute;
  inset: 0;
}

.a-propos__scene-lien:focus-visible {
  outline: none;
}

.a-propos__scene-lien:focus-visible::after {
  outline: 3px solid var(--text-h);
  outline-offset: 0.25rem;
}

/* Chrome : mot large et penché, chrome « ligne d'horizon » avec éclats. Deux
   variantes de contraste : thème clair (par défaut, chrome plus profond) et
   thème sombre (chrome lumineux, halo blanc). Aucun contour. */
.a-propos__scene--chrome {
  --scene-police: var(--font-family-headings-chrome), 'Anybody';
  --scene-angle: -6deg;
  --scene-dy: 0.5rem;
  /* Chrome occupe toute la première ligne : il est au-dessus des trois autres.
     Ses stickers sont placés par rapport au mot (.a-propos__scene-texte), pas à
     la ligne entière, pour rester collés aux lettres. */
  display: flex;
  justify-content: center;
  flex: 0 0 100%;
  --chrome-fond: linear-gradient(
    180deg,
    #1f4fb0 0%,
    #6f9ae8 11%,
    #f4f8ff 24%,
    #b8c7dc 40%,
    #6e7f99 47%,
    #2c3a52 50%,
    #8c9fba 54%,
    #dfe8f4 64%,
    #ffffff 76%,
    #9fb0c8 100%
  );
  /* Tranche sombre sous les lettres + ombre bleutée : détache le chrome du fond clair. */
  --chrome-filtre: drop-shadow(0 0.04em 0 #2c3a52) drop-shadow(0 0.1em 0.12em rgb(30 45 70 / 0.5));
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .a-propos__scene--chrome {
    --chrome-fond: linear-gradient(
      180deg,
      #2f62c8 0%,
      #9fc0f2 10%,
      #ffffff 24%,
      #d3dce8 40%,
      #8a9ab2 47%,
      #4a5a72 50%,
      #9aabc1 53%,
      #cdd8e6 60%,
      #e6edf6 72%,
      #ffffff 82%,
      #aab7c9 100%
    );
    --chrome-filtre: drop-shadow(0 0 0.15em rgb(255 255 255 / 0.45)) drop-shadow(0 0.06em 0.12em rgb(0 0 0 / 0.45));
  }
}

:root[data-theme='dark'] .a-propos__scene--chrome {
  --chrome-fond: linear-gradient(
    180deg,
    #2f62c8 0%,
    #9fc0f2 10%,
    #ffffff 24%,
    #d3dce8 40%,
    #8a9ab2 47%,
    #4a5a72 50%,
    #9aabc1 53%,
    #cdd8e6 60%,
    #e6edf6 72%,
    #ffffff 82%,
    #aab7c9 100%
  );
  --chrome-filtre: drop-shadow(0 0 0.15em rgb(255 255 255 / 0.45)) drop-shadow(0 0.06em 0.12em rgb(0 0 0 / 0.45));
}

.a-propos__scene--chrome .a-propos__scene-texte {
  position: relative;
}

.a-propos__scene--chrome h3 {
  position: relative;
  /* Anybody : police à largeur variable, ici en ultra-large, noire et italique. */
  font-style: italic;
  font-weight: 900;
  font-stretch: 150%;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}

.a-propos__scene--chrome .a-propos__scene-lien {
  display: inline-block;
  color: transparent;
  /* Contour transparent : épaissit encore les lettres, dégradé conservé. */
  -webkit-text-stroke: 0.04em transparent;
  /* Le filtre est sur le mot seul (pas sur les éclats, qui doivent rester blancs). */
  filter: var(--chrome-filtre);
  background:
    linear-gradient(105deg, transparent 42%, rgb(255 255 255 / 0.95) 50%, transparent 58%) 150% 0 / 250% 100% no-repeat,
    var(--chrome-fond);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Éclats : croix fine + halo, façon reflet de lumière sur le métal. */
.a-propos__scene--chrome h3::before,
.a-propos__scene--chrome h3::after {
  content: '';
  position: absolute;
  width: 1.1em;
  height: 1.1em;
  pointer-events: none;
  background:
    radial-gradient(circle, #ffffff 0 7%, rgb(255 255 255 / 0.55) 14%, transparent 45%),
    linear-gradient(90deg, transparent 0%, #ffffff 50%, transparent 100%) center / 100% 0.04em no-repeat,
    linear-gradient(0deg, transparent 0%, #ffffff 50%, transparent 100%) center / 0.04em 100% no-repeat;
}

.a-propos__scene--chrome h3::before {
  top: -0.35em;
  left: -0.25em;
}

.a-propos__scene--chrome h3::after {
  right: -0.3em;
  bottom: 0.1em;
  width: 0.8em;
  height: 0.8em;
}

/* 2000's : néon rose, penché comme un logo de l'époque. */
.a-propos__scene--2000 {
  --scene-police: var(--font-family-headings-2000), 'Audiowide';
  --scene-angle: 3deg;
  --scene-dy: -1rem;
}

.a-propos__scene--2000 h3 {
  color: #ffffff;
  text-transform: uppercase;
  font-style: italic;
  transform: skewX(-12deg);
  -webkit-text-stroke: 0.04em #ff3cb4;
  paint-order: stroke fill;
  text-shadow:
    0 0 0.15em #ff3cb4,
    0 0 0.4em #ff3cb4,
    0.06em 0.06em 0 #7a2bb8;
}

/* Barre néon qui clignote après le mot, comme un curseur de terminal. */
.a-propos__scene--2000 h3::after {
  content: '';
  display: inline-block;
  width: 0.55em;
  height: 0.12em;
  margin-left: 0.2em;
  border-radius: 0.06em;
  background: #ffffff;
  /* Mêmes effets que les lettres : contour rose, lueur, ombre violette décalée. */
  box-shadow:
    0 0 0 0.04em #ff3cb4,
    0 0 0.15em #ff3cb4,
    0 0 0.4em #ff3cb4,
    0.06em 0.06em 0 #7a2bb8;
}

/* Soft Y2K : lettres rondes et dodues, contour blanc perlé, lueur douce. */
.a-propos__scene--soft {
  --scene-police: var(--font-family-headings-soft), 'Bagel Fat One';
  --scene-angle: -4deg;
  --scene-dy: 0.75rem;
}

.a-propos__scene--soft h3 {
  color: #ff8cc6;
  -webkit-text-stroke: 0.12em #ffffff;
  paint-order: stroke fill;
  text-shadow:
    0.05em 0.07em 0 #cfe9fb,
    0 0 0.5em rgb(255 180 220 / 0.9);
}

/* Summer : écriture de plage, dégradé turquoise - bleu - rose, ombre dure. */
.a-propos__scene--summer {
  --scene-police: var(--font-family-headings-summer), 'Chango';
  --scene-angle: 6deg;
  --scene-dy: -0.5rem;
}

.a-propos__scene--summer h3 {
  color: transparent;
  background: linear-gradient(100deg, #19c3c9, #3b8fe0, #ff6fa5, #ffb347, #ff6fa5, #3b8fe0, #19c3c9) 0 0 / 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-stroke: 0.05em #ffffff;
  paint-order: stroke fill;
  filter: drop-shadow(0.06em 0.06em 0 #ff6fa5) drop-shadow(0.12em 0.12em 0 #ffb347);
}

.a-propos__sticker {
  position: absolute;
  z-index: 2;
  width: clamp(2rem, 7vw, 4.5rem);
  height: auto;
  pointer-events: none;
}

.a-propos__sticker--haut {
  top: 0;
  left: 0;
  transform: translate(-30%, -40%);
}

.a-propos__sticker--bas {
  right: 0;
  bottom: 0;
  transform: translate(30%, 40%);
}

.a-propos__reseaux {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}


@media (min-width: 36rem) {
  .a-propos__valeurs {
    grid-template-columns: 1fr 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .a-propos__scene {
    transition: none;
  }
}
/* ===== Animations en continu (désactivées si « réduire les animations ») ===== */
@media (prefers-reduced-motion: no-preference) {
  /* Stickers : léger balancement, décalé d'une scène à l'autre. */
  .a-propos__sticker {
    animation: sticker-balance 3.2s ease-in-out infinite alternate;
  }

  .a-propos__sticker--bas {
    animation-duration: 3.8s;
    animation-delay: -1.2s;
  }

  /* Chrome : une bande de lumière traverse le mot toutes les 3 s, et les deux
     éclats scintillent. */
  .a-propos__scene--chrome .a-propos__scene-lien {
    animation: chrome-lumiere 3s ease-in-out infinite;
  }

  .a-propos__scene--chrome h3::before {
    animation: eclat 3s ease-in-out infinite;
  }

  .a-propos__scene--chrome h3::after {
    animation: eclat 3s ease-in-out 1.5s infinite;
  }

  /* 2000's : la barre clignote (1 s allumée, 1 s éteinte). */
  .a-propos__scene--2000 h3::after {
    animation: clignote 1.1s steps(1, end) infinite;
  }

  /* Soft Y2K : le mot flotte doucement et sa lueur pulse. */
  .a-propos__scene--soft h3 {
    animation:
      flotte 3.4s ease-in-out infinite,
      lueur-douce 3.4s ease-in-out infinite;
  }

  /* Summer : les couleurs défilent comme une vague et le mot tangue. */
  .a-propos__scene--summer h3 {
    animation:
      tangue 4s ease-in-out infinite alternate,
      vague 6s linear infinite;
  }
}

@keyframes chrome-lumiere {
  0%,
  55% {
    background-position: 150% 0, 0 0;
  }
  100% {
    background-position: -50% 0, 0 0;
  }
}

@keyframes eclat {
  0%,
  55%,
  100% {
    opacity: 0.25;
    scale: 0.6;
  }
  75% {
    opacity: 1;
    scale: 1.2;
  }
}

@keyframes clignote {
  0%,
  55% {
    opacity: 1;
  }
  56%,
  100% {
    opacity: 0;
  }
}

@keyframes flotte {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -0.35rem;
  }
}

@keyframes lueur-douce {
  0%,
  100% {
    text-shadow:
      0.05em 0.07em 0 #cfe9fb,
      0 0 0.35em rgb(255 180 220 / 0.7);
  }
  50% {
    text-shadow:
      0.05em 0.07em 0 #cfe9fb,
      0 0 0.8em rgb(255 150 210 / 1);
  }
}

@keyframes tangue {
  from {
    rotate: -2deg;
  }
  to {
    rotate: 2deg;
  }
}

@keyframes vague {
  to {
    background-position: 300% 0;
  }
}

@keyframes sticker-balance {
  from {
    rotate: -10deg;
  }
  to {
    rotate: 10deg;
  }
}

/* Apparition au défilement : règles de base dans style.css ; ici, les scènes
   surgissent plus fort (propriétés individuelles pour ne pas écraser les
   « transform » d'inclinaison). */
/* Les scènes surgissent : elles arrivent en tournant et en grossissant. */
.a-propos__scene.reveal {
  scale: 0.6;
  rotate: -14deg;
  translate: 0 3rem;
  transition:
    transform 0.25s ease,
    opacity 0.5s ease var(--reveal-delay, 0s),
    translate 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) var(--reveal-delay, 0s),
    scale 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) var(--reveal-delay, 0s),
    rotate 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) var(--reveal-delay, 0s);
}

.a-propos__scene.reveal--visible {
  scale: 1;
  rotate: 0deg;
  translate: 0 0;
}

</style>
