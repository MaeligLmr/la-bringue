<script setup lang="ts">
import { computed } from 'vue'
import type { IconName, IconSize } from './icon-names'

// Raw SVG markup exported from Figma (src/assets/icons/ — originally
// dropped in public/assets/icons/, moved here so Vite can inline them:
// files under public/ can't be imported as modules, and inlining is what
// lets fill="currentColor" pick up the surrounding text color). Two
// filenames keep source typos (arrow-rigth, prohibided) — this map is the
// only place that needs to know about them.
import user from '../../assets/icons/user.svg?raw'
import heart from '../../assets/icons/heart-empty.svg?raw'
import heartFilled from '../../assets/icons/heart-filled.svg?raw'
import share from '../../assets/icons/share.svg?raw'
import menu from '../../assets/icons/burger.svg?raw'
import check from '../../assets/icons/check.svg?raw'
import ticket from '../../assets/icons/ticket.svg?raw'
import instagram from '../../assets/icons/insta.svg?raw'
import facebook from '../../assets/icons/facebook.svg?raw'
import whatsapp from '../../assets/icons/whatsapp.svg?raw'
import tiktok from '../../assets/icons/tiktok.svg?raw'
import arrowRight from '../../assets/icons/arrow-rigth.svg?raw'
import arrowLeft from '../../assets/icons/arrow-left.svg?raw'
import eye from '../../assets/icons/eye-open.svg?raw'
import eyeOff from '../../assets/icons/eye-closed.svg?raw'
import settings from '../../assets/icons/cog.svg?raw'
import map from '../../assets/icons/map.svg?raw'
import edit from '../../assets/icons/pen.svg?raw'
import ban from '../../assets/icons/prohibided.svg?raw'
import cart from '../../assets/icons/cart.svg?raw'
import plus from '../../assets/icons/plus.svg?raw'
import minus from '../../assets/icons/minus.svg?raw'
import search from '../../assets/icons/search.svg?raw'
import filter from '../../assets/icons/filter-empty.svg?raw'
import filterFilled from '../../assets/icons/filter-filled.svg?raw'

const props = withDefaults(defineProps<{ name: IconName; size?: IconSize }>(), {
  size: 'medium',
})

const REGISTRY: Record<IconName, string> = {
  user,
  heart,
  'heart-filled': heartFilled,
  share,
  menu,
  check,
  ticket,
  instagram,
  facebook,
  whatsapp,
  tiktok,
  'arrow-right': arrowRight,
  'arrow-left': arrowLeft,
  eye,
  'eye-off': eyeOff,
  settings,
  map,
  edit,
  ban,
  cart,
  plus,
  minus,
  search,
  filter,
  'filter-filled': filterFilled,
}

// Rendered via v-html in the template — safe here since this is static,
// build-time SVG content, never user input.
const markup = computed(() => REGISTRY[props.name])
</script>

<template>
  <span class="icon" :class="`icon--${size}`" aria-hidden="true" v-html="markup" />
</template>

<style scoped>
.icon {
  display: inline-flex;
  flex-shrink: 0;
  /* Icon paths use fill="currentColor", so they pick up whatever `color`
     applies here (e.g. a Button's current text color). */
  color: currentColor;
}

.icon :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.icon--small {
  width: var(--icon-small-width);
  height: var(--icon-small-height);
}

.icon--medium {
  width: var(--icon-medium-width);
  height: var(--icon-medium-height);
}

.icon--large {
  width: var(--icon-large-width);
  height: var(--icon-large-height);
}
</style>
