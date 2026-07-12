<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { sections } from '@/data/content'

const route = useRoute()
const menuOpen = ref(false)
const activeSection = ref<string>(sections[0].id)
let scrollFrame: number | null = null
let routeHold: { id: string, initialSide: number | null } | null = null
let routeHoldTimeout: ReturnType<typeof setTimeout> | null = null

function clearRouteHold() {
  routeHold = null
  if (routeHoldTimeout !== null) clearTimeout(routeHoldTimeout)
  routeHoldTimeout = null
}

function holdRouteSection(id: string) {
  clearRouteHold()
  routeHold = { id, initialSide: null }
  routeHoldTimeout = setTimeout(clearRouteHold, 2000)
}

function sectionFromRoute() {
  const routeSection = route.meta.section
  return sections.some(section => section.id === routeSection) ? routeSection as string : sections[0].id
}

function updateActiveSection() {
  scrollFrame = null
  const elements = sections
    .map(section => document.getElementById(section.id))
    .filter((section): section is HTMLElement => section !== null)
  if (!elements.length) return

  const positions = elements.map(section => section.getBoundingClientRect())
  if (positions.every(position => position.top === 0 && position.bottom === 0)) return

  const headerBottom = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().bottom ?? 0
  if (routeHold !== null) {
    const targetIndex = elements.findIndex(section => section.id === routeHold?.id)
    if (targetIndex !== -1) {
      const delta = positions[targetIndex].top - headerBottom
      const side = Math.sign(delta)
      if (Math.abs(delta) <= 1 || (routeHold.initialSide !== null && side !== routeHold.initialSide)) {
        clearRouteHold()
      } else {
        routeHold.initialSide ??= side
        return
      }
    } else {
      clearRouteHold()
    }
  }

  const atDocumentEnd = document.documentElement.scrollHeight > window.innerHeight
    && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1
  if (atDocumentEnd) {
    activeSection.value = elements[elements.length - 1].id
    return
  }

  activeSection.value = elements.reduce((active, section, index) =>
    positions[index].top <= headerBottom + 1 ? section : active, elements[0]).id
}

function scheduleActiveSectionUpdate() {
  if (scrollFrame !== null) return
  scrollFrame = -1
  const frame = window.requestAnimationFrame(updateActiveSection)
  if (scrollFrame === -1) scrollFrame = frame
}

watch(() => route.path, async () => {
  menuOpen.value = false
  const routeSection = sectionFromRoute()
  activeSection.value = routeSection
  holdRouteSection(routeSection)
  await nextTick()
  scheduleActiveSectionUpdate()
}, { immediate: true })

onMounted(() => {
  window.addEventListener('scroll', scheduleActiveSectionUpdate, { passive: true })
  window.addEventListener('resize', scheduleActiveSectionUpdate, { passive: true })
  scheduleActiveSectionUpdate()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleActiveSectionUpdate)
  window.removeEventListener('resize', scheduleActiveSectionUpdate)
  if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame)
  clearRouteHold()
})
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to field guide</a>
  <header class="site-header">
    <RouterLink class="site-header__brand" to="/home" aria-label="Power Stone 2 field guide home">
      <img class="site-header__logo" src="/media/logos/power-stone-2-logo.png" alt="" />
    </RouterLink>
    <button class="site-header__toggle" type="button" :aria-expanded="menuOpen" aria-controls="primary-navigation" @click="menuOpen = !menuOpen">
      <span aria-hidden="true">{{ menuOpen ? '×' : '☰' }}</span><span class="sr-only">Toggle navigation</span>
    </button>
    <nav id="primary-navigation" class="site-header__nav" :class="{ 'site-header__nav--open': menuOpen }" aria-label="Primary navigation">
      <RouterLink v-for="section in sections" :key="section.id" class="site-header__link" :to="`/${section.id}`" :aria-current="activeSection === section.id ? 'page' : undefined">{{ section.label }}</RouterLink>
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
