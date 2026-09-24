<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import type { IconName, IconSize } from '../../types/icon'

const props = withDefaults(defineProps<{ name: IconName; size?: IconSize }>(), {
  size: 'medium',
})

// Lazy: each SVG becomes its own chunk, fetched only the first time that
// icon is actually rendered, instead of bundling all of them into every
// page that uses <Icon> for even one icon. (Figma exports live in
// src/assets/icons/ — files under public/ can't be imported as modules,
// and inlining raw markup is what lets fill="currentColor" pick up the
// surrounding text color.)
const iconModules = import.meta.glob('../../assets/icons/*.svg', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

const loaderByFilename: Record<string, () => Promise<string>> = {}
for (const [filePath, loader] of Object.entries(iconModules)) {
  loaderByFilename[filePath.split('/').pop()!] = loader
}

// Two filenames keep source typos (arrow-rigth, prohibided) — this map is
// the only place that needs to know about them.
const FILENAME_BY_ICON: Record<IconName, string> = {
  user: 'user.svg',
  heart: 'heart-empty.svg',
  'heart-filled': 'heart-filled.svg',
  share: 'share.svg',
  menu: 'burger.svg',
  check: 'check.svg',
  ticket: 'ticket.svg',
  instagram: 'insta.svg',
  facebook: 'facebook.svg',
  whatsapp: 'whatsapp.svg',
  tiktok: 'tiktok.svg',
  'arrow-right': 'arrow-rigth.svg',
  'arrow-left': 'arrow-left.svg',
  eye: 'eye-open.svg',
  'eye-off': 'eye-closed.svg',
  settings: 'cog.svg',
  map: 'map.svg',
  edit: 'pen.svg',
  ban: 'prohibided.svg',
  cart: 'cart.svg',
  plus: 'plus.svg',
  minus: 'minus.svg',
  search: 'search.svg',
  filter: 'filter-empty.svg',
  'filter-filled': 'filter-filled.svg',
  'chevron-down': 'chevron-down.svg',
  // Reuses "plus" rotated 45° below — plus.svg is a symmetric cross, so
  // the rotation produces a perfect X with no separate SVG needed.
  close: 'plus.svg',
  'star-separation': 'star-separation.svg',
}

const ROTATE_45: ReadonlySet<IconName> = new Set(['close'])

// Loaded icons stay cached (module-level, shared by every <Icon>
// instance) so switching back to a previously-shown icon, or mounting a
// second instance of the same one, doesn't re-fetch its chunk.
const cache = new Map<string, string>()

// Rendered via v-html in the template — safe here since this is static,
// build-time SVG content, never user input.
const markup = ref('')

watchEffect(() => {
  const filename = FILENAME_BY_ICON[props.name]
  const cached = cache.get(filename)
  if (cached !== undefined) {
    markup.value = cached
    return
  }

  const loader = loaderByFilename[filename]
  if (!loader) {
    markup.value = ''
    return
  }

  const requestedFilename = filename
  loader().then((content) => {
    cache.set(requestedFilename, content)
    // Guard against a fast prop change resolving out of order: only
    // apply this result if it's still the icon actually requested.
    if (FILENAME_BY_ICON[props.name] === requestedFilename) markup.value = content
  })
})
</script>

<template>
  <span
    class="icon"
    :class="[`icon--${size}`, { 'icon--rotate-45': ROTATE_45.has(name) }]"
    aria-hidden="true"
    v-html="markup"
  />
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

.icon--rotate-45 {
  transform: rotate(45deg);
}
</style>
