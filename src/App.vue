<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { sections } from '@/data/content'

const route = useRoute()
const menuOpen = ref(false)
watch(() => route.path, () => { menuOpen.value = false })
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to field guide</a>
  <header class="site-header">
    <RouterLink class="site-header__brand" to="/overview" aria-label="Power Stone 2 field guide home">
      <span class="site-header__gem" aria-hidden="true">◆</span>
      <span>PS2 <b>Field Guide</b></span>
    </RouterLink>
    <button class="site-header__toggle" type="button" :aria-expanded="menuOpen" aria-controls="primary-navigation" @click="menuOpen = !menuOpen">
      <span aria-hidden="true">{{ menuOpen ? '×' : '☰' }}</span><span class="sr-only">Toggle navigation</span>
    </button>
    <nav id="primary-navigation" class="site-header__nav" :class="{ 'site-header__nav--open': menuOpen }" aria-label="Primary navigation">
      <RouterLink v-for="section in sections" :key="section.id" class="site-header__link" :to="`/${section.id}`" :aria-current="route.meta.section === section.id ? 'page' : undefined">{{ section.label }}</RouterLink>
    </nav>
  </header>
  <main id="main-content"><RouterView /></main>
  <footer class="site-footer">
    <nav class="site-footer__nav" aria-label="Footer navigation">
      <RouterLink v-for="section in sections" :key="section.id" :to="`/${section.id}`">{{ section.label }}</RouterLink>
    </nav>
    <p>Independent, non-commercial fan guide. Game names, characters, artwork, and all related rights remain with their respective rights holders.</p>
  </footer>
</template>
