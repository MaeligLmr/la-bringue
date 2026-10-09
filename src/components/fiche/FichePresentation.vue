<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from '../ui/Button.vue'
import Like from '../ui/Like.vue'
import Tag from '../ui/Tag.vue'
import { labelOf } from '../../lib/cards'
import { photoUrl } from '../../lib/photo'
import { SCENES } from '../../types/ui/programmation'
import type { Fiche } from '../../types/ui/fiche'
import placeholderSvg from '../../assets/card/placeholder.svg?raw'
import stars2000 from '../../assets/scenes/2000/stars.png'
import pa2000 from '../../assets/scenes/2000/pa.png'
import diceChrome from '../../assets/scenes/chrome/dice.png'
import starChrome from '../../assets/scenes/chrome/star.png'
import kittySoft from '../../assets/scenes/soft/hellokitty.png'
import cherriesSoft from '../../assets/scenes/soft/cherries.png'
import flowerSummer from '../../assets/scenes/summer/flower.png'
import shellSummer from '../../assets/scenes/summer/shell.png'

// Bloc commun aux fiches artiste, conférence et exposant : même structure et
// même style pour les trois, seuls les champs absents de `fiche` sont masqués.
const props = defineProps<{ fiche: Fiche }>()

const router = useRouter()

// Stickers aux coins haut-gauche / bas-droite de la photo, selon la scène
// (variante « Aucune » : pas de sticker).
const STICKERS: Record<string, [string, string]> = {
  '2000': [stars2000, pa2000],
  chrome: [diceChrome, starChrome],
  soft: [kittySoft, cherriesSoft],
  summer: [flowerSummer, shellSummer],
}

const stickers = computed(() => (props.fiche.scene ? STICKERS[props.fiche.scene] : undefined))

// "2026-08-28" → "28 août 2026" (en majuscules via CSS). Lu en UTC pour ne
// pas glisser d'un jour selon le fuseau du navigateur.
const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const date = computed(() => (props.fiche.jour ? DATE_FORMAT.format(new Date(`${props.fiche.jour}T00:00:00Z`)) : ''))

const sceneHeure = computed(() =>
  [props.fiche.scene && labelOf(SCENES, props.fiche.scene), props.fiche.heure].filter(Boolean).join(' • ')
)

const photoFailed = ref(false)
watch(() => props.fiche.photo, () => (photoFailed.value = false))
const photoSrc = computed(() => (!props.fiche.photo || photoFailed.value ? null : photoUrl(props.fiche.photo)))

const tags = computed(() => [...(props.fiche.categorie ? [props.fiche.categorie] : []), ...props.fiche.tags])

const isLiked = ref(false)
</script>

<template>
  <section class="fiche-presentation">
    <div class="fiche-presentation__header">
      <div class="fiche-presentation__informations">
        <h1 class="fiche-presentation__nom">{{ fiche.nom }}</h1>

        <div v-if="date || sceneHeure" class="fiche-presentation__quand">
          <p v-if="date" class="fiche-presentation__date">{{ date }}</p>
          <p v-if="sceneHeure" class="fiche-presentation__scene-heure">{{ sceneHeure }}</p>
        </div>

        <ul v-if="tags.length" class="fiche-presentation__tags">
          <li v-for="(tag, index) in tags" :key="tag.label">
            <RouterLink v-if="tag.to" :to="tag.to" class="fiche-presentation__tag-link">
              <Tag :label="tag.label" :variant="index === 0 && fiche.categorie ? 'pink-bright' : 'violet'" />
            </RouterLink>
            <Tag v-else :label="tag.label" :variant="index === 0 && fiche.categorie ? 'pink-bright' : 'violet'" />
          </li>
        </ul>

        <div class="fiche-presentation__actions">
          <Button icon-right="ticket" @click="router.push({ name: 'billetterie' })">Acheter ma place</Button>
          <Like
            v-if="fiche.likeTarget"
            v-model="isLiked"
            :label="`Ajouter ${fiche.nom} à Mon programme`"
            :target="fiche.likeTarget"
          />
        </div>
      </div>

      <div class="fiche-presentation__visuel">
        <div
          v-if="!photoSrc"
          class="fiche-presentation__photo fiche-presentation__placeholder"
          aria-hidden="true"
          v-html="placeholderSvg"
        />
        <img v-else :src="photoSrc" alt="" class="fiche-presentation__photo" @error="photoFailed = true" />
        <template v-if="stickers">
          <img :src="stickers[0]" alt="" aria-hidden="true" class="fiche-presentation__sticker fiche-presentation__sticker--haut" />
          <img :src="stickers[1]" alt="" aria-hidden="true" class="fiche-presentation__sticker fiche-presentation__sticker--bas" />
        </template>
      </div>
    </div>

    <p v-if="fiche.description" class="fiche-presentation__bio">{{ fiche.description }}</p>
  </section>
</template>

<style scoped>
.fiche-presentation {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  color: var(--text-h);
}

.fiche-presentation__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}

.fiche-presentation__informations {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-5);
  min-width: 0;
}

.fiche-presentation__nom {
  margin: 0;
  font-family: var(--heading);
  font-size: var(--font-size-heading-2);
  line-height: var(--line-height-heading-2);
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.fiche-presentation__quand {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.fiche-presentation__quand p {
  margin: 0;
  font-family: var(--heading);
}

.fiche-presentation__date {
  font-size: var(--font-size-heading-3);
  line-height: var(--line-height-heading-3);
  text-transform: uppercase;
}

.fiche-presentation__scene-heure {
  font-size: var(--font-size-medium);
}

.fiche-presentation__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.fiche-presentation__tag-link {
  display: inline-flex;
  border-radius: var(--tag-radius);
  text-decoration: none;
}

.fiche-presentation__tag-link:hover .tag {
  text-decoration: underline;
}

.fiche-presentation__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Marge pour les stickers qui débordent des coins de la photo. */
.fiche-presentation__visuel {
  position: relative;
  align-self: center;
  width: calc(100% - var(--space-10));
  max-width: 24rem;
}

.fiche-presentation__photo {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
}

.fiche-presentation__placeholder {
  overflow: hidden;
  background: linear-gradient(135deg, var(--tag-pink-bright-background), var(--tag-violet-background));
  color: var(--tag-pink-bright-text);
}

/* SVG injecté via v-html : hors du scope, d'où :deep(). */
.fiche-presentation__placeholder :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.fiche-presentation__sticker {
  position: absolute;
  width: 3.5rem;
  height: auto;
  pointer-events: none;
}

.fiche-presentation__sticker--haut {
  top: 0;
  left: 0;
  transform: translate(-40%, -40%);
}

.fiche-presentation__sticker--bas {
  right: 0;
  bottom: 0;
  transform: translate(40%, 40%);
}

.fiche-presentation__bio {
  margin: 0;
  max-width: 60rem;
  white-space: pre-line;
}

@media (min-width: 1025px) {
  .fiche-presentation__header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .fiche-presentation__nom {
    font-size: var(--font-size-heading-1);
    line-height: var(--line-height-heading-1);
  }

  .fiche-presentation__visuel {
    flex: 0 0 40%;
    align-self: auto;
  }

  .fiche-presentation__sticker {
    width: 4.5rem;
  }
}
</style>
