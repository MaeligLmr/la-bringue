<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from '../ui/Button.vue'
import heroBg from '../../assets/hero/hero-bg.png'

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
    <div class="hero__title">
      <svg class="hero__star hero__star--left" viewBox="20 75 300 165" fill="none" aria-hidden="true">
        <path
          class="hero__star-shape"
          d="M70.705 101.361C71.7456 91.8866 83.1988 87.7181 90.0862 94.307L108.806 112.217C111.977 115.25 117.103 115.512 120.954 113.056C134.359 104.509 165.721 88.5772 216.6 85.668C254.754 83.4864 284.967 91.0117 306.032 99.3999C308.675 100.452 310.548 101.998 311.593 103.825C312.645 105.668 312.797 107.707 312.129 109.545C310.787 113.24 306.439 115.6 300.835 114.847C287.13 113.007 271.413 111.3 256.479 110.599C241.52 109.898 227.449 110.212 216.989 112.369C172.533 121.537 153.98 145.08 148.114 154.62C146.818 156.728 146.921 159.402 148.242 161.716L163.163 187.841C167.891 196.117 161.074 206.222 151.629 204.94L122.131 200.934C119.359 200.557 116.578 201.569 114.697 203.639L94.6734 225.67C88.2625 232.723 76.5468 229.364 74.8478 219.985L69.5411 190.691C69.0423 187.939 67.2213 185.607 64.671 184.458L37.5323 172.223C28.8429 168.305 28.4173 156.125 36.8122 151.611L63.0312 137.512C65.4951 136.187 67.1499 133.734 67.4554 130.953L70.705 101.361Z"
        />
        <path
          class="hero__star-shape hero__star-shape--inner"
          d="M73.6874 101.135C74.4566 94.1318 82.9225 91.0504 88.0132 95.9206L106.732 113.83C111.028 117.94 117.705 118.132 122.567 115.031C135.597 106.723 166.47 90.985 216.771 88.1089C254.429 85.9556 284.204 93.3843 304.921 101.634C307.093 102.499 308.356 103.655 308.987 104.759C309.61 105.848 309.672 106.97 309.31 107.966C308.592 109.942 305.902 111.947 301.234 111.32C287.481 109.474 271.672 107.755 256.62 107.049C241.594 106.344 227.22 106.641 216.383 108.876C170.978 118.239 151.777 142.379 145.559 152.495C143.592 155.693 143.869 159.554 145.637 162.649L160.558 188.774C164.052 194.892 159.015 202.36 152.034 201.413L122.534 197.407C118.783 196.898 115.022 198.267 112.476 201.068L92.4539 223.098C87.7154 228.311 79.0557 225.828 77.7999 218.896L72.4935 189.603C71.8188 185.879 69.3542 182.724 65.9037 181.169L38.7649 168.933C32.3424 166.038 32.0282 157.035 38.2332 153.698L64.4522 139.599C67.7858 137.807 70.0243 134.489 70.4375 130.726L73.6874 101.135Z"
        />
      </svg>

      <h1>LA BRINGUE</h1>

      <svg v-if="homePage" class="hero__star hero__star--right" viewBox="20 75 300 165" fill="none" aria-hidden="true">
        <path
          class="hero__star-shape"
          d="M70.705 101.361C71.7456 91.8866 83.1988 87.7181 90.0862 94.307L108.806 112.217C111.977 115.25 117.103 115.512 120.954 113.056C134.359 104.509 165.721 88.5772 216.6 85.668C254.754 83.4864 284.967 91.0117 306.032 99.3999C308.675 100.452 310.548 101.998 311.593 103.825C312.645 105.668 312.797 107.707 312.129 109.545C310.787 113.24 306.439 115.6 300.835 114.847C287.13 113.007 271.413 111.3 256.479 110.599C241.52 109.898 227.449 110.212 216.989 112.369C172.533 121.537 153.98 145.08 148.114 154.62C146.818 156.728 146.921 159.402 148.242 161.716L163.163 187.841C167.891 196.117 161.074 206.222 151.629 204.94L122.131 200.934C119.359 200.557 116.578 201.569 114.697 203.639L94.6734 225.67C88.2625 232.723 76.5468 229.364 74.8478 219.985L69.5411 190.691C69.0423 187.939 67.2213 185.607 64.671 184.458L37.5323 172.223C28.8429 168.305 28.4173 156.125 36.8122 151.611L63.0312 137.512C65.4951 136.187 67.1499 133.734 67.4554 130.953L70.705 101.361Z"
        />
        <path
          class="hero__star-shape hero__star-shape--inner"
          d="M73.6874 101.135C74.4566 94.1318 82.9225 91.0504 88.0132 95.9206L106.732 113.83C111.028 117.94 117.705 118.132 122.567 115.031C135.597 106.723 166.47 90.985 216.771 88.1089C254.429 85.9556 284.204 93.3843 304.921 101.634C307.093 102.499 308.356 103.655 308.987 104.759C309.61 105.848 309.672 106.97 309.31 107.966C308.592 109.942 305.902 111.947 301.234 111.32C287.481 109.474 271.672 107.755 256.62 107.049C241.594 106.344 227.22 106.641 216.383 108.876C170.978 118.239 151.777 142.379 145.559 152.495C143.592 155.693 143.869 159.554 145.637 162.649L160.558 188.774C164.052 194.892 159.015 202.36 152.034 201.413L122.534 197.407C118.783 196.898 115.022 198.267 112.476 201.068L92.4539 223.098C87.7154 228.311 79.0557 225.828 77.7999 218.896L72.4935 189.603C71.8188 185.879 69.3542 182.724 65.9037 181.169L38.7649 168.933C32.3424 166.038 32.0282 157.035 38.2332 153.698L64.4522 139.599C67.7858 137.807 70.0243 134.489 70.4375 130.726L73.6874 101.135Z"
        />
      </svg>
    </div>

    <p class="hero__dates"><strong>LE FESTIVAL</strong> du 28 au 30 août</p>

    <Button v-if="homePage" color="primary" variant="full" @click="goToAbout">En savoir plus</Button>
  </section>
</template>

<style scoped>
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--hero-section-gap);
  padding: var(--space-8) 5% var(--hero-section-padding-bottom);
  text-align: center;
  background-color: var(--main-image-mask);
  background-size: cover;
  background-position: center;
}

.hero--home {
  padding-top: var(--space-10);
  padding-bottom: calc(var(--hero-section-padding-bottom) + var(--space-4));
}

.hero__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.hero h1 {
  margin: 0;
  font-family: var(--hero-font);
  color: var(--hero-section-h1);
}

.hero__star {
  width: 3.5rem;
  height: 3.5rem;
  flex-shrink: 0;
}

.hero__star--right {
  transform: scaleX(-1);
}

.hero__star-shape {
  fill: var(--hero-section-star);
  stroke: var(--hero-section-star);
  stroke-width: 3;
}

.hero__star-shape--inner {
  stroke: var(--hero-section-star-stroke);
}

.hero__dates {
  margin: 0;
  color: var(--hero-section-text);
}
</style>
