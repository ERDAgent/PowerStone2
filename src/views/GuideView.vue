<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import SectionHeading from '@/components/SectionHeading.vue'
import HorizontalNav from '@/components/HorizontalNav.vue'
import Lightbox from '@/components/Lightbox.vue'
import MediaGalleryDialog from '@/components/MediaGalleryDialog.vue'
import type { GalleryItem } from '@/components/MediaGalleryDialog.vue'
import RecipeLookup from '@/components/RecipeLookup.vue'
import { bosses, characters, items, levels } from '@/data/content'
import { materials } from '@/data'
import { useGuideStore } from '@/stores/guide'
import type { CatalogEntity, CatalogKind } from '@/stores/guide'
import type { ItemRecord } from '@/data/types'
import type { LevelStageCount, LevelMode } from '@/data/world'
import { withSoftHyphens } from '@/utils/text'
import { itemTileId } from '@/utils/dom'

const store = useGuideStore()
const router = useRouter()
const recipeLookup = ref<InstanceType<typeof RecipeLookup> | null>(null)
function goToItemRecipe(id: ItemRecord['id']) {
  router.push('/recipes#recipe-lookup')
  recipeLookup.value?.selectItem(id)
}
const { selectedCharacter, selectedEntity, filteredEntities, catalogKind, itemCategory, itemLevel, materialRarity, itemQuery, selectedLevel, selectedMove, selectedSpecial, selectedMoveIndex, selectedSpecialIndex, selectedBoss } = storeToRefs(store)
const characteristicLabels = [
  ['strength', 'Strength'],
  ['throwDistance', 'Throw Distance'],
  ['damage', 'Damage'],
  ['toughness', 'Toughness'],
  ['speed', 'Speed'],
] as const
const categories = computed(() => ['All Functions', ...new Set(items.map(item => item.category ?? 'Uncategorized'))])
const itemLevels = computed(() => ['All Levels' as const, ...[...new Set(items.map(item => item.level))].sort((a, b) => a - b)])
const materialRarities = computed(() => ['All Rarities' as const, ...new Set(materials.map(m => m.rarity).filter((r): r is string => r !== null))])
const catalogTabs = [
  { kind: 'all', label: 'All' },
  { kind: 'item', label: 'Items' },
  { kind: 'material', label: 'Materials' },
  { kind: 'essence', label: 'Essences' },
] as const
const tabElements = ref<HTMLButtonElement[]>([])
const itemSearchInput = ref<HTMLInputElement | null>(null)
function clearItemQuery() {
  store.setItemQuery('')
  nextTick(() => itemSearchInput.value?.focus())
}
type AboutSection = 'resources' | 'links' | 'contact'
const openAboutSection = ref<AboutSection | null>('resources')
function toggleAboutSection(section: AboutSection) {
  openAboutSection.value = openAboutSection.value === section ? null : section
}

function isPspExclusive(character: { availability: readonly string[] }) {
  return !character.availability.includes('dreamcast') && !character.availability.includes('Arcade')
}
function entityKindLabel(entity: CatalogEntity) { return entity.kind[0].toUpperCase() + entity.kind.slice(1) }
function entityNumberLabel(entity: CatalogEntity) { return `${entityKindLabel(entity)} ${Number(entity.record.number)}` }
function entityContext(entity: CatalogEntity) {
  if (entity.kind === 'item') return entity.record.category ?? 'Uncategorized'
  if (entity.kind === 'material') return entity.record.type
  return 'Card essence'
}
function entityNotes(entity: CatalogEntity) {
  return entity.kind === 'item' ? entity.record.provenance.itemNotes : entity.record.provenance.notes
}
function activateCatalogTab(kind: CatalogKind, index: number) {
  store.setCatalogKind(kind)
  nextTick(() => tabElements.value[index]?.focus())
}
function onTabKeydown(event: KeyboardEvent, index: number) {
  let next = index
  if (event.key === 'ArrowRight') next = (index + 1) % catalogTabs.length
  else if (event.key === 'ArrowLeft') next = (index - 1 + catalogTabs.length) % catalogTabs.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = catalogTabs.length - 1
  else return
  event.preventDefault()
  activateCatalogTab(catalogTabs[next].kind, next)
}

const highlights = [
  ['The Sleeper Hit: Retro 3D Fighter', 'The perfect mix of depth and simplicity from a bygone era.', '/media/materials/01-flame-element.png'],
  ['Deep Replayability', 'Amazing combat, easy to learn/hard to master, crafting and gambling, ahead of its time.', '/media/materials/02-ice-element.png'],
  ['Competitive Spirit', 'This game is meant to be played against someone else for hours on end. It’s competitive multiplayer is its shining achievement.', '/media/materials/03-thunder-element.png'],
  ['A World Full of Weapons', 'Every arena is stuffed with pipes, furniture, and junk waiting to be picked up and swung.', '/media/materials/04-light-element.png'],
]

const highlightsSection = ref<HTMLElement | null>(null)
const highlightsInView = ref(false)
let highlightsObserver: IntersectionObserver | null = null
onMounted(() => {
  if (!highlightsSection.value) return
  highlightsObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    highlightsInView.value = true
    highlightsObserver?.disconnect()
  }, { threshold: 0.3 })
  highlightsObserver.observe(highlightsSection.value)
})
onBeforeUnmount(() => highlightsObserver?.disconnect())

const quickFacts = [
  ['4-player arenas', 'Up to four fighters share one freely explorable 3D stage instead of a locked-off fighting-game plane.'],
  ['Power Stone transformations', 'Collecting three stones grants a temporary, stronger form built around each character’s powered-up moves.'],
  ['Living stages', 'Arenas shift, travel, and introduce hazards mid-match, turning positioning into its own skill.'],
  ['A wide roster', 'Fourteen characters on arcade and Dreamcast, plus two additional PSP-exclusive fighters in the Collection release.'],
]

const platforms = [
  { id: 'dreamcast', label: 'Dreamcast', image: '/media/consoles/dc-console-small-withshadow-compressed.png' },
  { id: 'arcade', label: 'Arcade', image: '/media/consoles/arcade-cabinet-small-withshadow-compressed.png' },
  { id: 'psp', label: 'PSP', image: '/media/consoles/psp-console-small-withshadow-compressed.png' },
  { id: 'pc', label: 'PC', image: '/media/consoles/pc-small-withshadow-compressed.png' },
] as const

const modes = [
  { id: 'dreamcast-mode-1', label: 'Original', image: '/media/menus/dc/dc-menu-original-compressed.png', availability: ['dreamcast'] },
  { id: 'dreamcast-mode-2', label: '1-on-1', image: '/media/menus/dc/dc-menu-1on1-compressed.png', availability: ['dreamcast'] },
  { id: 'dreamcast-mode-3', label: 'ArcadeMode', image: '/media/menus/dc/dc-menu-arcade-compressed.png', availability: ['dreamcast'] },
  { id: 'dreamcast-mode-4', label: 'Adventure', image: '/media/menus/dc/dc-menu-adventure-compressed.png', availability: ['dreamcast'] },
  { id: 'team-battle', label: 'Team Battle', image: '/media/menus/mode-teambattle-compressed.png', availability: ['arcade'] },
  { id: '3team-battle', label: '3 Team Battle', image: '/media/menus/mode-3teambattle-compressed.png', availability: ['arcade'] },
  { id: 'battle-royal', label: 'Battle Royal', image: '/media/menus/mode-battleroyal-compressed.png', availability: ['arcade'] },
  { id: 'psp-mode-1', label: 'Mode 1', availability: ['psp'] },
  { id: 'psp-mode-2', label: 'Mode 2', availability: ['psp'] },
  { id: 'pc-mode-1', label: 'Mode 1', availability: ['pc'] },
  { id: 'pc-mode-2', label: 'Mode 2', availability: ['pc'] },
] as const

const onlineOptions = [
  { id: 'local-play', label: 'Local Play', image: '/media/consoles/couch-small-compressed.png' },
  { id: 'capcom-fighting-collection-2', label: 'Capcom Fighting Collection 2', image: '/media/logos/fighting-collection-2-small-compressed.png' },
  { id: 'flycast-dojo', label: 'Emulation', image: '/media/consoles/pc-small-withshadow-compressed.png' },
] as const

const unlockPlatforms = [
  { id: 'dreamcast', label: 'Dreamcast', image: '/media/consoles/dc-console-small-withshadow-compressed.png' },
  { id: 'arcade', label: 'Arcade', image: '/media/consoles/arcade-cabinet-small-withshadow-compressed.png' },
  { id: 'psp', label: 'PSP', image: '/media/consoles/psp-console-small-withshadow-compressed.png' },
  { id: 'pc', label: 'PC', image: '/media/consoles/pc-small-withshadow-compressed.png' },
] as const

const characterSlides: GalleryItem[] = [
  { kind: 'image', src: '/media/placeholders/character-slideshow-slide-1-placeholder.svg', label: 'Placeholder slide 1' },
  { kind: 'image', src: '/media/placeholders/character-slideshow-slide-2-placeholder.svg', label: 'Placeholder slide 2' },
  { kind: 'video', src: '/media/videos/gameplay-loop.mp4', poster: '/media/placeholders/entity-clip-poster-placeholder.svg', label: 'Placeholder clip' },
]

const selectedPlatform = ref<typeof platforms[number]['id']>(platforms[0].id)
const selectedMode = ref<typeof modes[number]['id']>(modes.find(mode => (mode.availability as readonly string[]).includes(platforms[0].id))?.id ?? modes[0].id)
const selectedOnline = ref<typeof onlineOptions[number]['id']>(onlineOptions[0].id)
const selectedUnlockPlatform = ref<typeof unlockPlatforms[number]['id']>(unlockPlatforms[0].id)
const availableModes = computed(() => modes.filter(mode => (mode.availability as readonly string[]).includes(selectedPlatform.value)))

watch(availableModes, modes => {
  if (!modes.some(mode => mode.id === selectedMode.value)) selectedMode.value = modes[0]?.id ?? selectedMode.value
})

const characterSlideIndex = ref(0)
watch(selectedCharacter, () => { characterSlideIndex.value = 0 })
function nextCharacterSlide() { characterSlideIndex.value = (characterSlideIndex.value + 1) % characterSlides.length }
function previousCharacterSlide() { characterSlideIndex.value = (characterSlideIndex.value - 1 + characterSlides.length) % characterSlides.length }

const levelVideos = [
  { video: '/media/videos/gameplay-loop.mp4', poster: '/media/placeholders/level-video-poster-1-placeholder.svg', label: 'Placeholder clip 1' },
  { video: '/media/videos/gameplay-loop.mp4', poster: '/media/placeholders/level-video-poster-2-placeholder.svg', label: 'Placeholder clip 2' },
  { video: '/media/videos/gameplay-loop.mp4', poster: '/media/placeholders/level-video-poster-3-placeholder.svg', label: 'Placeholder clip 3' },
]
function stageFromPath(path: string): number | undefined {
  const match = path.match(/stage(\d+)-\d+/i)
  return match ? Number(match[1]) : undefined
}
const levelPictureItems = computed<GalleryItem[]>(() => selectedLevel.value.slides.map((src, index) => ({ kind: 'image', src, label: `${selectedLevel.value.name} — image ${index + 1}`, stage: stageFromPath(src) })))
const levelVideoItems = computed<GalleryItem[]>(() => levelVideos.map(clip => ({ kind: 'video', src: clip.video, poster: clip.poster, label: clip.label })))
type GalleryKind = 'pictures' | 'video'
const openGallery = ref<{ kind: GalleryKind; index: number } | null>(null)
const galleryItems = computed(() => {
  if (!openGallery.value) return []
  return openGallery.value.kind === 'pictures' ? levelPictureItems.value : levelVideoItems.value
})
watch(selectedLevel, () => { openGallery.value = null })
function openLevelGallery(kind: GalleryKind, index: number) { openGallery.value = { kind, index } }
function closeLevelGallery() { openGallery.value = null }
function nextGalleryItem() { if (openGallery.value) openGallery.value = { ...openGallery.value, index: (openGallery.value.index + 1) % galleryItems.value.length } }
function previousGalleryItem() { if (openGallery.value) openGallery.value = { ...openGallery.value, index: (openGallery.value.index - 1 + galleryItems.value.length) % galleryItems.value.length } }

const levelStageOptions: LevelStageCount[] = [1, 3, 4]
const activeLevelStages = ref<Set<LevelStageCount>>(new Set())
function toggleLevelStageFilter(stage: LevelStageCount) {
  const next = new Set(activeLevelStages.value)
  if (next.has(stage)) next.delete(stage)
  else next.add(stage)
  activeLevelStages.value = next
}
const levelModeOptions: LevelMode[] = ['PVP', 'PVE']
const activeLevelModes = ref<Set<LevelMode>>(new Set())
function toggleLevelModeFilter(mode: LevelMode) {
  const next = new Set(activeLevelModes.value)
  if (next.has(mode)) next.delete(mode)
  else next.add(mode)
  activeLevelModes.value = next
}
const filteredLevels = computed(() => levels
  .filter(level => activeLevelStages.value.size === 0 || activeLevelStages.value.has(level.stageCount))
  .filter(level => activeLevelModes.value.size === 0 || level.modes.some(mode => activeLevelModes.value.has(mode))))

const desertArea = levels.find(level => level.name === 'Desert Area')!
const levelFile = ref<HTMLElement | null>(null)
const levelStageFilter = ref<HTMLElement | null>(null)
function selectLevelAndScroll(id: (typeof levels)[number]['id']) {
  store.selectLevel(id)
  nextTick(() => levelFile.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
function scrollToLevelSelect() {
  levelStageFilter.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function previousLevel() {
  const index = levels.findIndex(level => level.id === selectedLevel.value.id)
  store.selectLevel(levels[(index - 1 + levels.length) % levels.length].id)
}
function nextLevel() {
  const index = levels.findIndex(level => level.id === selectedLevel.value.id)
  store.selectLevel(levels[(index + 1) % levels.length].id)
}

function previousEntity() {
  const list = filteredEntities.value
  if (!list.length) return
  const index = list.findIndex(entity => entity.record.id === selectedEntity.value?.record.id)
  store.selectEntity(list[(index - 1 + list.length) % list.length].record.id)
}
function nextEntity() {
  const list = filteredEntities.value
  if (!list.length) return
  const index = list.findIndex(entity => entity.record.id === selectedEntity.value?.record.id)
  store.selectEntity(list[(index + 1) % list.length].record.id)
}

const fighterFile = ref<HTMLElement | null>(null)
const characterSelect = ref<HTMLElement | null>(null)
function selectCharacterAndScroll(id: (typeof characters)[number]['id']) {
  store.selectCharacter(id)
  nextTick(() => fighterFile.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
function scrollToCharacterSelect() {
  characterSelect.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function previousCharacter() {
  const index = characters.findIndex(character => character.id === selectedCharacter.value.id)
  store.selectCharacter(characters[(index - 1 + characters.length) % characters.length].id)
}
function nextCharacter() {
  const index = characters.findIndex(character => character.id === selectedCharacter.value.id)
  store.selectCharacter(characters[(index + 1) % characters.length].id)
}

const bossFile = ref<HTMLElement | null>(null)
function selectBossAndScroll(id: (typeof bosses)[number]['id']) {
  store.selectBoss(id)
  nextTick(() => bossFile.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
function previousBoss() {
  const index = bosses.findIndex(boss => boss.id === selectedBoss.value.id)
  store.selectBoss(bosses[(index - 1 + bosses.length) % bosses.length].id)
}
function nextBoss() {
  const index = bosses.findIndex(boss => boss.id === selectedBoss.value.id)
  store.selectBoss(bosses[(index + 1) % bosses.length].id)
}

const placeholderEnemies = [
  { id: 'enemy-small-wooden-soldier', name: 'Small Wooden Soldier', media: '/media/enemies/small-wooden-soldier-compressed.png' },
  { id: 'enemy-large-wooden-soldier', name: 'Large Wooden Soldier', media: '/media/enemies/large-wooden-soldier-compressed.png' },
  { id: 'enemy-pharaoh-rider', name: 'Pharaoh Rider', media: '/media/enemies/pharaoh-rider-compressed.png' },
] as const
const selectedEnemyId = ref<typeof placeholderEnemies[number]['id']>(placeholderEnemies[0].id)
const selectedEnemy = computed(() => placeholderEnemies.find(enemy => enemy.id === selectedEnemyId.value) ?? placeholderEnemies[0])
const enemyFile = ref<HTMLElement | null>(null)
function selectEnemyAndScroll(id: (typeof placeholderEnemies)[number]['id']) {
  selectedEnemyId.value = id
  nextTick(() => enemyFile.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
function previousEnemy() {
  const index = placeholderEnemies.findIndex(enemy => enemy.id === selectedEnemy.value.id)
  selectedEnemyId.value = placeholderEnemies[(index - 1 + placeholderEnemies.length) % placeholderEnemies.length].id
}
function nextEnemy() {
  const index = placeholderEnemies.findIndex(enemy => enemy.id === selectedEnemy.value.id)
  selectedEnemyId.value = placeholderEnemies[(index + 1) % placeholderEnemies.length].id
}

const milestones = [
  ['1999', 'Power Stone arrives in arcades and on Dreamcast, establishing the transforming 3D arena formula.'],
  ['Early 2000', 'Power Stone 2 reaches Japanese arcades on Sega NAOMI hardware.'],
  ['2000', 'The Dreamcast edition brings four-player arena action to the home console era.'],
  ['2000–2001', 'Regional Dreamcast releases introduce the sequel to players beyond Japan.'],
  ['2006', 'Power Stone Collection gathers both games for PSP and adapts the experience for portable play.'],
  ['2010s', 'Players sustain the series through local gatherings, guides, preservation, and competitive discovery.'],
  ['Today', 'Its transforming arenas and item-driven chaos remain a distinct reference point for multiplayer action games.'],
]
const timelineImage = '/media/placeholders/timeline-milestone-placeholder.svg'

const stoneColors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'yellow']
const dividerStone = `/media/menus/stone-${stoneColors[Math.floor(Math.random() * stoneColors.length)]}.png`
</script>

<template>
  <div class="guide">
    <section id="home" class="hero routed-section" aria-labelledby="home-title">
      <div class="hero__orbits" aria-hidden="true"><i /><i /><i /></div>
      <div class="hero__content">
        <p class="hero__kicker">Unofficial Field Guide For The Game</p>
        <img class="hero__logo" src="/media/logos/power-stone-2-logo.png" alt="Power Stone 2" />
        <h1 id="home-title" class="sr-only">Power Stone 2 Field Guide</h1>
        <p class="hero__lede">A multiplayer fighting game developed and published by <a href="https://www.capcom.com/" target="_blank">Capcom</a>, and one of the greatest fighting games ever made.</p>
        <p class="hero__availability">Available on</p>
        <dl class="hero__meta">
          <div><dt>Arcade</dt><dd>August, 2000</dd></div>
          <div><dt>Dreamcast</dt><dd>August 23rd, 2000</dd></div>
          <div><dt>PSP</dt><dd>October 31st, 2006</dd></div>
          <div><dt>PC</dt><dd>May 16th, 2025</dd></div>
        </dl>
        <div class="hero__actions">
            <RouterLink class="button button--primary" to="/how-to-play">Play Online</RouterLink>
            <RouterLink class="button button--ghost" to="/characters">Meet the Characters</RouterLink>
            <RouterLink class="button button--ghost" to="/items">Explore Items</RouterLink>
        </div>
      </div>
      <div class="hero__media">
        <video class="hero__video" autoplay muted loop playsinline poster="/media/videos/gameplay-loop-poster.jpg" aria-hidden="true">
          <source src="/media/videos/gameplay-loop.mp4" type="video/mp4" />
        </video>
        <span class="hero__media-label">Power Stone 2 in motion</span>
      </div>
      <a class="hero__scroll" href="#game-overview">How to play <span aria-hidden="true">↓</span></a>
    </section>

    <section id="game-overview" class="content-section routed-section content-section--game-overview" aria-labelledby="game-overview-title">
      <SectionHeading title-id="game-overview-title" kicker="01 / About the game" title="The Sleeper Hit You Probably Missed" intro="Power Stone 2 hit arcades and consoles in 2000, the PSP in 2006, and PC in 2025." style="margin-bottom: 2rem"/>
      <div class="game-overview">
        <div ref="highlightsSection" class="game-overview__highlights">
          <article
            v-for="(highlight, index) in highlights"
            :key="highlight[0]"
            :class="['game-overview__highlight', { 'game-overview__highlight--flipped': highlightsInView }]"
          >
            <div class="game-overview__highlight-inner" :style="{ transitionDelay: `${index * 200}ms` }">
              <div class="game-overview__highlight-face game-overview__highlight-face--front">
                <img :src="highlight[2]" :alt="highlight[0]" />
              </div>
              <div class="game-overview__highlight-face game-overview__highlight-face--back">
                <h3>{{ highlight[0] }}</h3>
                <p>{{ highlight[1] }}</p>
              </div>
            </div>
          </article>
        </div>
        <p class="game-overview__lede">Capcom’s 2000 sequel expands the original Power Stone into full four-player chaos: any object in reach can become a weapon, any stage can shift or crumble mid-fight, and a well-timed transformation can flip a losing match in seconds. The sections below walk through how to play, on which platform, and how to get a match running with friends.</p>
        <dl class="game-overview__facts">
          <div v-for="fact in quickFacts" :key="fact[0]"><dt>{{ fact[0] }}</dt><dd>{{ fact[1] }}</dd></div>
        </dl>
      </div>
    </section>

    <div class="section-divider" aria-hidden="true"><img class="section-divider__mark" :src="dividerStone" alt="" /></div>

    <section id="how-to-play" class="content-section routed-section content-section--how-to-play" aria-labelledby="how-to-play-title">
        <SectionHeading title-id="how-to-play-title" style="margin-bottom: 2rem;" kicker="02 / How To Play" title="Getting Started" intro="We'll walk you through everything you'll need to get started. Select a platform, find the mode that's right for you, and play either couch co-op with friends or online over the internet." />

      <div class="subsection" style="margin-top: 0;">
        <h3 class="subsection__title">1) Select a Platform</h3>
        <HorizontalNav :items="platforms" v-model="selectedPlatform" nav-label="Select a platform" style="position: relative; z-index: 2;"/>
        <article class="unlock-detail subsection__panel gradient-border" aria-live="polite" style="position: relative; z-index: 1; border: none; background: linear-gradient(180deg, rgb(249, 216, 119) 0%, rgb(255, 242, 202) 100%); border-radius: 0.5rem; border-top-left-radius: 0;">
          <div v-if="selectedPlatform === 'dreamcast'" class="panel-content panel-content--dreamcast">
            <p class="platform-label">Home console</p>
            <h3>Dreamcast</h3>
            <p>Adventure play and the in-game item economy underpin the home progression loop. Character and item requirements can vary by release or source.</p>
            <span class="status-tag">Exact conditions to verify</span>
            <p class="unlock-detail__pending">Before investing time, confirm your region and save context against a verified manual or gameplay record.</p>
          </div>
          <div v-else-if="selectedPlatform === 'arcade'" class="panel-content panel-content--arcade">
            <p class="platform-label">Hardware context</p>
            <h3>Arcade</h3>
            <p>The arcade release is historical and hardware context here—not a home unlock path. This guide does not apply Dreamcast save-based instructions to arcade operation.</p>
            <span class="status-tag">Not a home unlock path</span>
            <p class="unlock-detail__pending">Full unlock checklists for this platform are queued for a future update.</p>
          </div>
          <div v-else-if="selectedPlatform === 'psp'" class="panel-content panel-content--psp">
            <p class="platform-label">Portable compilation</p>
            <h3>PSP</h3>
            <p>The compilation combines both games and includes its own portable-era presentation and progression context.</p>
            <span class="status-tag">Collection-specific details to verify</span>
            <p class="unlock-detail__pending">Do not assume every Dreamcast instruction maps one-to-one to this release.</p>
          </div>
          <div v-else-if="selectedPlatform === 'pc'" class="panel-content panel-content--pc">
            <p class="platform-label">Home computer</p>
            <h3>PC</h3>
            <p>Home computer summary</p>
            <span class="status-tag">Home computer status</span>
            <p class="unlock-detail__pending">Home computer note</p>
          </div>
        </article>
      </div>

      <div class="subsection">
        <h3 class="subsection__title">2) Select a Mode</h3>
        <HorizontalNav :items="availableModes" v-model="selectedMode" nav-label="Select a mode" hide-labels style="position: relative; z-index: 2;"/>
        <article class="unlock-detail subsection__panel gradient-border" aria-live="polite" style="position: relative; z-index: 1; border: none; background: linear-gradient(180deg, rgb(249, 216, 119) 0%, rgb(255, 242, 202) 100%); border-radius: 0.5rem; border-top-left-radius: 0;">
          <div v-if="selectedMode === 'dreamcast-mode-1'" class="panel-content panel-content--dreamcast-mode-1">
            <p class="platform-label">Dreamcast mode</p>
            <h3>Original</h3>
            <p>The default single-cart mode for the Dreamcast release, covering the core arcade-style match flow.</p>
            <span class="status-tag">Exact rules to verify</span>
            <p class="unlock-detail__pending">Match structure and options menu details are queued for a future update.</p>
          </div>
          <div v-else-if="selectedMode === 'dreamcast-mode-2'" class="panel-content panel-content--dreamcast-mode-2">
            <p class="platform-label">Dreamcast mode</p>
            <h3>1-on-1</h3>
            <p>A head-to-head mode focused on a direct matchup between two fighters.</p>
            <span class="status-tag">Exact rules to verify</span>
            <p class="unlock-detail__pending">Match structure and options menu details are queued for a future update.</p>
          </div>
          <div v-else-if="selectedMode === 'dreamcast-mode-3'" class="panel-content panel-content--dreamcast-mode-3">
            <p class="platform-label">Dreamcast mode</p>
            <h3>Arcade Mode</h3>
            <p>A ladder-style run through a sequence of opponents, mirroring the original arcade experience.</p>
            <span class="status-tag">Exact rules to verify</span>
            <p class="unlock-detail__pending">Match structure and options menu details are queued for a future update.</p>
          </div>
          <div v-else-if="selectedMode === 'dreamcast-mode-4'" class="panel-content panel-content--dreamcast-mode-4">
            <p class="platform-label">Dreamcast mode</p>
            <h3>Adventure</h3>
            <p>A story-driven single-player mode that also feeds into the game's item and unlock economy.</p>
            <span class="status-tag">Exact rules to verify</span>
            <p class="unlock-detail__pending">Match structure and options menu details are queued for a future update.</p>
          </div>
          <div v-else-if="selectedMode === 'team-battle'" class="panel-content panel-content--team-battle">
            <p class="platform-label">Arcade mode</p>
            <h3>Team Battle</h3>
            <p>A two-on-two format that pairs fighters together against another team.</p>
            <span class="status-tag">Exact rules to verify</span>
            <p class="unlock-detail__pending">Match structure and options menu details are queued for a future update.</p>
          </div>
          <div v-else-if="selectedMode === '3team-battle'" class="panel-content panel-content--3team-battle">
            <p class="platform-label">Arcade mode</p>
            <h3>3 Team Battle</h3>
            <p>An expanded team format that scales the Team Battle setup up to three teams.</p>
            <span class="status-tag">Exact rules to verify</span>
            <p class="unlock-detail__pending">Match structure and options menu details are queued for a future update.</p>
          </div>
          <div v-else-if="selectedMode === 'battle-royal'" class="panel-content panel-content--battle-royal">
            <p class="platform-label">Arcade mode</p>
            <h3>Battle Royal</h3>
            <p>A free-for-all format with every fighter on the arena at once, matching the game's core four-player identity.</p>
            <span class="status-tag">Exact rules to verify</span>
            <p class="unlock-detail__pending">Match structure and options menu details are queued for a future update.</p>
          </div>
          <div v-else-if="selectedMode === 'psp-mode-1'" class="panel-content panel-content--psp-mode-1">
            <p class="platform-label">PSP mode</p>
            <h3>Mode 1</h3>
            <p>A portable-compilation mode carried over from the Dreamcast and arcade releases.</p>
            <span class="status-tag">Collection-specific details to verify</span>
            <p class="unlock-detail__pending">Do not assume every Dreamcast instruction maps one-to-one to this release.</p>
          </div>
          <div v-else-if="selectedMode === 'psp-mode-2'" class="panel-content panel-content--psp-mode-2">
            <p class="platform-label">PSP mode</p>
            <h3>Mode 2</h3>
            <p>A second portable-compilation mode carried over from the Dreamcast and arcade releases.</p>
            <span class="status-tag">Collection-specific details to verify</span>
            <p class="unlock-detail__pending">Do not assume every Dreamcast instruction maps one-to-one to this release.</p>
          </div>
          <div v-else-if="selectedMode === 'pc-mode-1'" class="panel-content panel-content--pc-mode-1">
            <p class="platform-label">PC mode</p>
            <h3>Mode 1</h3>
            <p>Home computer summary</p>
            <span class="status-tag">Home computer status</span>
            <p class="unlock-detail__pending">Home computer note</p>
          </div>
          <div v-else-if="selectedMode === 'pc-mode-2'" class="panel-content panel-content--pc-mode-2">
            <p class="platform-label">PC mode</p>
            <h3>Mode 2</h3>
            <p>Home computer summary</p>
            <span class="status-tag">Home computer status</span>
            <p class="unlock-detail__pending">Home computer note</p>
          </div>
        </article>
      </div>

      <div class="subsection">
        <h3 class="subsection__title">3) Play Locally or Online</h3>
        <HorizontalNav :items="onlineOptions" v-model="selectedOnline" nav-label="Play online" style="position: relative; z-index: 2;"/>
        <article class="unlock-detail subsection__panel gradient-border" aria-live="polite" style="position: relative; z-index: 1; border: none; background: linear-gradient(180deg, rgb(249, 216, 119) 0%, rgb(255, 242, 202) 100%); border-radius: 0.5rem; border-top-left-radius: 0;">
          <div v-if="selectedOnline === 'local-play'" class="panel-content panel-content--local-play">
            <p class="platform-label">Couch multiplayer</p>
            <h3>Local Play</h3>
            <p>Up to four fighters share one controller-connected setup, matching the game's original couch co-op design.</p>
            <span class="status-tag">Setup steps to verify</span>
            <p class="unlock-detail__pending">Controller and multitap requirements per platform are queued for a future update.</p>
          </div>
          <div v-else-if="selectedOnline === 'capcom-fighting-collection-2'" class="panel-content panel-content--capcom-fighting-collection-2">
            <p class="platform-label">Modern re-release</p>
            <h3>Capcom Fighting Collection 2</h3>
            <p>A current, officially supported way to play Power Stone 2 with online play built in.</p>
            <span class="status-tag">Online options to verify</span>
            <p class="unlock-detail__pending">Rollback netcode and lobby details are queued for a future update.</p>
          </div>
          <div v-else-if="selectedOnline === 'flycast-dojo'" class="panel-content panel-content--flycast-dojo">
            <p class="platform-label">Community emulation</p>
            <h3>Emulation</h3>
            <p>A community-maintained path to online play for the original release, outside of official support.</p>
            <span class="status-tag">Setup steps to verify</span>
            <p class="unlock-detail__pending">Client and matchmaking specifics are queued for a future update.</p>
          </div>
        </article>
        <aside v-if="selectedOnline === 'flycast-dojo'" class="callout gradient-border"><b>Keep it legitimate and current.</b> Supply your own game files, consult each project’s current official documentation, and expect networking screens or requirements to evolve.</aside>
      </div>
    </section>

    <section id="items" class="content-section routed-section content-section--items" aria-labelledby="items-title">
      <SectionHeading title-id="items-title" kicker="03 / Items" title="Browse Items" intro="Browse all items, material cards, and essences cards in one place." style="margin-bottom: 1rem;"/>
      <div id="catalog-tabs" class="catalog-tabs" role="tablist" aria-label="Catalog entity kind">
        <button v-for="(tab, index) in catalogTabs" :key="tab.kind" :ref="element => { if (element) tabElements[index] = element as HTMLButtonElement }" type="button" role="tab" :aria-selected="catalogKind === tab.kind" :tabindex="catalogKind === tab.kind ? 0 : -1" @click="activateCatalogTab(tab.kind, index)" @keydown="onTabKeydown($event, index)">{{ tab.label }}</button>
      </div>
      <div class="catalog-panel">
        <label class="item-search" for="item-search">Search {{ catalogTabs.find(tab => tab.kind === catalogKind)?.label.toLowerCase() }}
          <div class="search-field">
            <input id="item-search" ref="itemSearchInput" :value="itemQuery" type="search" placeholder="Search 152 Items" @input="store.setItemQuery(($event.target as HTMLInputElement).value)" />
            <button v-if="itemQuery" type="button" class="search-field__clear" aria-label="Clear search" @click="clearItemQuery">×</button>
          </div>
        </label>
        <div v-if="catalogKind === 'item'" class="filter-bar" aria-label="Filter items by category">
          <button v-for="category in categories" :key="category" type="button" :class="['chip', { 'chip--active': itemCategory === category }]" @click="store.setCategory(category)">{{ category }}</button>
        </div>
        <div v-if="catalogKind === 'item'" class="filter-bar" aria-label="Filter items by level">
          <button v-for="level in itemLevels" :key="level" type="button" :class="['chip', { 'chip--active': itemLevel === level }]" @click="store.setItemLevel(level)">{{ level === 'All Levels' ? 'All Levels' : `Level ${level}` }}</button>
        </div>
        <div v-if="catalogKind === 'material'" class="filter-bar" aria-label="Filter materials by rarity">
          <button v-for="rarity in materialRarities" :key="rarity" type="button" :class="['chip', { 'chip--active': materialRarity === rarity }]" @click="store.setMaterialRarity(rarity)">{{ rarity }}</button>
        </div>
        <div class="item-browser">
          <div class="item-browser__list" role="list" :aria-label="`${catalogTabs.find(tab => tab.kind === catalogKind)?.label} catalog`">
            <div v-for="entity in filteredEntities" :id="itemTileId(entity.record.id)" :key="entity.record.id" :class="['item-tile', { 'item-tile--active': selectedEntity?.record.id === entity.record.id }]">
              <button type="button" class="item-tile__select" @click="store.selectEntity(entity.record.id)">
                <img v-if="entity.record.media" :src="entity.record.media" alt="" />
                <span v-else class="entity-fallback" aria-hidden="true">{{ entity.record.name.slice(0, 2) }}</span>
                <span>
                    <small>{{ entityNumberLabel(entity) }} · {{ entityContext(entity) }}</small>
                    {{ entity.record.name }}
                </span>
              </button>
            </div>
            <p v-if="!filteredEntities.length" class="recipe-empty" role="status">No Items Found</p>
          </div>
          <article v-if="selectedEntity" class="item-detail" aria-live="polite">
            <div class="detail-nav">
              <button type="button" class="detail-nav__arrow" aria-label="Previous catalog entity" @click="previousEntity">←</button>
              <div style="display: flex; gap: 1rem;">
                <button v-if="selectedEntity.kind === 'item'" type="button" class="detail-nav__arrow item-detail__recipe-link" :aria-label="`View ${selectedEntity.record.name} in the recipe cookbook`" @click="goToItemRecipe(selectedEntity.record.id)">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                </button>
                <button type="button" class="detail-nav__arrow" aria-label="Next catalog entity" @click="nextEntity">→</button>
              </div>
            </div>
            <div class="item-detail__visual"><img v-if="selectedEntity.record.media" :src="selectedEntity.record.media" :alt="`${selectedEntity.record.name} ${selectedEntity.kind} artwork`" /><span v-else class="entity-fallback" aria-hidden="true">{{ selectedEntity.record.name.slice(0, 2) }}</span></div>
            <div class="item-detail__copy"><p class="eyebrow">{{ entityNumberLabel(selectedEntity) }} · {{ entityContext(selectedEntity) }}</p><h3>{{ withSoftHyphens(selectedEntity.record.name) }}</h3><dl v-if="selectedEntity.kind === 'item'"><div><dt>Function</dt><dd>{{ selectedEntity.record.function }}</dd></div><div><dt>Item level</dt><dd>{{ selectedEntity.record.level }}</dd></div></dl><dl v-else-if="selectedEntity.kind === 'material'"><div><dt>Material type</dt><dd>{{ selectedEntity.record.type }}</dd></div><div><dt>Rarity</dt><dd>{{ selectedEntity.record.rarity ?? 'Unknown' }}</dd></div><div><dt>Worth</dt><dd>{{ selectedEntity.record.worth ?? 'Unknown' }}</dd></div></dl><dl v-else><div><dt>Entity kind</dt><dd>Essence card</dd></div></dl><p v-if="entityNotes(selectedEntity).length" class="data-note">{{ entityNotes(selectedEntity).join(' ') }}</p></div>
          </article>
          <div v-else class="item-detail recipe-empty recipe-empty--detail" role="status"><div><h3>No Item Selected</h3><p>Try another name or number</p></div></div>
        </div>
      </div>
    </section>

    <section id="recipes" class="content-section routed-section" aria-labelledby="recipes-title">
      <SectionHeading title-id="recipes-title" kicker="04 / Recipies" title="Items Cookbook" intro="Look up every combination to make any item. Some items cannot be made. See essence cards for ways to modify combinations." style="margin-bottom: 2rem"/>
      <RecipeLookup ref="recipeLookup" />
    </section>

    <section id="characters" class="content-section routed-section content-section--characters" aria-labelledby="characters-title">
      <SectionHeading title-id="characters-title" kicker="05 / Characters" title="Choose Your Adventurer" intro="The Arcade and Dreamcast versions have 14 characters, Kraken and General Valgas are PSP exclusives. Some characters must be unlocked." style="margin-bottom: 2rem;"/>
      <div ref="characterSelect" class="character-select" role="list" aria-label="Playable characters">
        <button v-for="character in characters" :key="character.id" type="button" :aria-pressed="selectedCharacter.id === character.id" :class="['portrait', { 'portrait--active': selectedCharacter.id === character.id }]" :style="{ '--character-color': character.color }" @click="selectCharacterAndScroll(character.id)">
          <img v-if="character.media" class="portrait__avatar" :src="character.media" :alt="`${character.name} chip art`" />
          <span v-else class="portrait__avatar" aria-hidden="true">{{ character.name.slice(0, 2).toUpperCase() }}</span>
          <span v-if="isPspExclusive(character)" class="status-tag status-tag--psp">PSP exclusive</span>
          <span class="sr-only">{{ character.name }}</span>
          <span class="portrait__details-bar">{{ character.name }}</span>
        </button>
      </div>
      <article ref="fighterFile" class="fighter-file" aria-live="polite">
        <div class="detail-nav">
          <button type="button" class="detail-nav__arrow" aria-label="Previous character" @click="previousCharacter">←</button>
          <div style="display: flex; gap: 1rem;">
            <button type="button" class="detail-nav__arrow" aria-label="Back to character select" @click="scrollToCharacterSelect">↑</button>
            <button type="button" class="detail-nav__arrow" aria-label="Next character" @click="nextCharacter">→</button>
          </div>
        </div>
        <div class="fighter-file__hero" :style="{ '--character-color': selectedCharacter.color }">
          <img v-if="selectedCharacter.portrait" class="fighter-file__portrait" :src="selectedCharacter.portrait" :alt="`${selectedCharacter.name} full character art`" />
          <span v-else class="fighter-file__initials" aria-hidden="true">{{ selectedCharacter.name.slice(0, 2).toUpperCase() }}</span>
          <span v-if="isPspExclusive(selectedCharacter)" class="status-tag status-tag--psp">PSP exclusive</span>
          <small v-if="!selectedCharacter.portrait">Replaceable character art</small>
        </div>
        <div class="fighter-file__copy">
            <p class="eyebrow">Character</p>
            <h3>{{ selectedCharacter.name }}</h3>
            <p class="fighter-file__tagline">{{ selectedCharacter.tagline }}</p>
            <h4>Playstyle</h4>
            <p>{{ selectedCharacter.playstyle }}</p>
            <h4>Keywords</h4>
            <ul class="attribute-list">
                <li v-for="keyword in selectedCharacter.keywords" :key="keyword">{{ keyword }}</li>
            </ul>
        </div>
        <div class="fighter-file__details">
          <section class="detail-panel detail-panel--characteristics" aria-labelledby="detail-characteristics-title">
            <!-- <p class="eyebrow">Overview</p> -->
            <h4 id="detail-characteristics-title">Characteristics</h4>
            <dl class="characteristics-list">
              <div v-for="[key, label] in characteristicLabels" :key="key">
                <dt>{{ label }}</dt>
                <dd><span :class="['badge', `badge--${selectedCharacter.characteristics[key]}`]">{{ selectedCharacter.characteristics[key] }}</span></dd>
              </div>
            </dl>
            <div class="character-slideshow">
              <div class="character-slideshow__stage">
                <template v-for="(slide, index) in characterSlides" :key="slide.src + index">
                  <img
                    v-if="slide.kind === 'image'"
                    :src="slide.src"
                    :class="['character-slideshow__image', { active: index === characterSlideIndex }]"
                    :alt="`${selectedCharacter.name} placeholder slideshow image ${index + 1}`"
                  />
                  <video
                    v-else
                    :class="['character-slideshow__image', { active: index === characterSlideIndex }]"
                    autoplay
                    muted
                    loop
                    playsinline
                    :poster="slide.poster"
                  >
                    <source :src="slide.src" type="video/mp4" />
                  </video>
                </template>
                <button class="character-slideshow__arrow character-slideshow__arrow--previous" type="button" aria-label="Previous slideshow image" @click="previousCharacterSlide">←</button>
                <button class="character-slideshow__arrow character-slideshow__arrow--next" type="button" aria-label="Next slideshow image" @click="nextCharacterSlide">→</button>
              </div>
              <p class="character-slideshow__caption" aria-live="polite">Slide {{ characterSlideIndex + 1 }} of {{ characterSlides.length }} · replaceable character slideshow</p>
              <p class="character-slideshow__caption character-slideshow__caption--tablet" aria-live="polite">All {{ characterSlides.length }} character slideshow slides · replaceable</p>
            </div>
          </section>

          <section class="detail-panel detail-panel--moves" aria-labelledby="detail-moves-title">
            <!-- <p class="eyebrow">Eyebrow</p> -->
            <h4 id="detail-moves-title">Moves</h4>
            <div class="move-nav" role="list" aria-label="Moves">
              <button v-for="(move, index) in selectedCharacter.moveList" :key="move.name" type="button" role="listitem" :class="['move-nav__item', `move-nav__item--${move.type}`, { 'move-nav__item--active': selectedMoveIndex === index }]" :aria-pressed="selectedMoveIndex === index" @click="store.selectMove(index)">
                <span class="move-nav__type">{{ move.type }}</span><span class="move-nav__name">{{ move.name }}</span>
              </button>
            </div>
            <div v-if="selectedMove" class="move-video">
              <video :key="selectedMove.name" class="move-video__player" autoplay muted loop playsinline :poster="selectedMove.poster">
                <source :src="selectedMove.video" type="video/mp4" />
              </video>
              <span class="move-video__label">{{ selectedMove.name }}</span>
            </div>
          </section>

          <section class="detail-panel detail-panel--specials" aria-labelledby="detail-specials-title">
            <!-- <p class="eyebrow">Eyebrow</p> -->
            <h4 id="detail-specials-title">Specials</h4>
            <div class="move-nav move-nav--specials" role="list" aria-label="Special moves">
              <button v-for="(special, index) in selectedCharacter.specials" :key="special.name" type="button" role="listitem" :class="['move-nav__item', 'move-nav__item--special', { 'move-nav__item--active': selectedSpecialIndex === index }]" :aria-pressed="selectedSpecialIndex === index" @click="store.selectSpecial(index)">
                <span class="move-nav__name">{{ special.name }}</span>
              </button>
            </div>
            <div v-if="selectedSpecial" class="move-video">
              <video :key="selectedSpecial.name" class="move-video__player" autoplay muted loop playsinline :poster="selectedSpecial.poster">
                <source :src="selectedSpecial.video" type="video/mp4" />
              </video>
              <span class="move-video__label">{{ selectedSpecial.name }}</span>
            </div>
          </section>
        </div>
      </article>
    </section>

    <section id="levels" class="content-section routed-section content-section--levels" aria-labelledby="levels-title">
      <SectionHeading title-id="levels-title" kicker="06 / Levels" title="Levels & Stages" intro="Levels have one, three, of four stages. Select a level to learn more about it. All maps support up to 4 players. Desert Area is the standard competetive map." style="margin-bottom: 1.25rem">
        <template #intro>Levels have one, three, of four stages. Select a level to learn more about it. All maps support up to 4 players. <button type="button" class="text-link" @click="selectLevelAndScroll(desertArea.id)">Desert Area</button> is the standard competetive map.</template>
      </SectionHeading>
      <div ref="levelStageFilter" class="level-filters">
        <div class="level-filter-group" role="group" aria-label="Filter levels by stage count">
          <button v-for="stage in levelStageOptions" :key="stage" type="button" :aria-pressed="activeLevelStages.has(stage)" :class="['chip', { 'chip--active': activeLevelStages.has(stage) }]" @click="toggleLevelStageFilter(stage)">{{ stage }} Stage</button>
        </div>
        <div class="level-filter-group" role="group" aria-label="Filter levels by mode">
          <button v-for="mode in levelModeOptions" :key="mode" type="button" :aria-pressed="activeLevelModes.has(mode)" :class="['chip', { 'chip--active': activeLevelModes.has(mode) }]" @click="toggleLevelModeFilter(mode)">{{ mode }}</button>
        </div>
      </div>
      <div class="level-select" role="list" aria-label="Playable arenas">
        <button v-for="(level, index) in filteredLevels" :key="level.id" type="button" :aria-pressed="selectedLevel.id === level.id" :class="['level-chip', { 'level-chip--active': selectedLevel.id === level.id }]" @click="selectLevelAndScroll(level.id)">
          <span :class="['status-tag', `status-tag--stages-${level.stageCount}`]">{{ level.stageCount }} Stage</span>
          <img class="level-chip__thumb" :src="level.media" :alt="`${level.name} replaceable level artwork`" />
          <span class="level-chip__number">0{{ index + 1 }}</span>
          <span>{{ level.name }}</span>
          <span class="level-chip__modes">
            <span v-for="mode in level.modes" :key="mode" class="level-chip__mode-badge">{{ mode }}</span>
          </span>
        </button>
        <div v-if="!filteredLevels.length" class="level-empty" role="status">
          <h3 class="level-empty__title">No Levels</h3>
          <p>No levels match this filter</p>
        </div>
      </div>
      <article ref="levelFile" class="level-file" aria-live="polite">
        <div class="detail-nav">
          <button type="button" class="detail-nav__arrow detail-nav__arrow--solid" aria-label="Previous arena" @click="previousLevel">←</button>
          <div style="display: flex; gap: 1rem;">
            <button type="button" class="detail-nav__arrow" aria-label="Back to level select" @click="scrollToLevelSelect">↑</button>
            <button type="button" class="detail-nav__arrow" aria-label="Next arena" @click="nextLevel">→</button>
          </div>
        </div>
        <div class="level-file__hero">
          <img :src="selectedLevel.slides[0]" :alt="`${selectedLevel.name} arena artwork`" />
        </div>
        <div class="level-file__copy">
          <div class="level-file__modes" aria-label="Supported modes">
              <!-- can also use this class .level-file__mode-badge -->
            <span class="eyebrow" style="margin-bottom: 0;">{{ selectedLevel.modes.join(', ') }}</span>
          </div>
          <h3>{{ selectedLevel.name }}</h3>
          <p>{{ selectedLevel.description }}</p>
        </div>
        <div class="level-file__details">
          <section class="detail-panel detail-panel--details" aria-labelledby="level-detail-details-title">
            <!-- <p class="eyebrow">Field notes</p> -->
            <h4 id="level-detail-details-title">Details</h4>
            <p>{{ selectedLevel.description }}</p>
            <p>Extended arena notes — environmental hazards, transformation triggers, and traversal tips — are queued for a future update.</p>
          </section>

          <section class="detail-panel detail-panel--pictures" aria-labelledby="level-detail-pictures-title">
            <!-- <p class="eyebrow">Visual study</p> -->
            <h4 id="level-detail-pictures-title">Pictures</h4>
            <div class="thumb-grid" role="list" aria-label="Arena pictures">
              <button v-for="(picture, index) in levelPictureItems" :key="picture.src" type="button" class="thumb-grid__item" role="listitem" @click="openLevelGallery('pictures', index)">
                <img :src="picture.src" :alt="picture.label" />
              </button>
            </div>
          </section>

          <section class="detail-panel detail-panel--video" aria-labelledby="level-detail-video-title">
            <!-- <p class="eyebrow">Motion study</p> -->
            <h4 id="level-detail-video-title">Video</h4>
            <div class="thumb-grid" role="list" aria-label="Arena video clips">
              <button v-for="(clip, index) in levelVideoItems" :key="clip.label" type="button" class="thumb-grid__item thumb-grid__item--video" role="listitem" @click="openLevelGallery('video', index)">
                <img :src="clip.poster" :alt="clip.label" />
                <span class="thumb-grid__play" aria-hidden="true">▶</span>
              </button>
            </div>
          </section>
        </div>
      </article>
    </section>

    <section id="enemies" class="content-section routed-section content-section--enemies" aria-labelledby="enemies-title">
      <SectionHeading title-id="enemies-title" kicker="07 / Enemies" title="Enemies & Bosses" intro="All versions have 3 enemy types and 2 boss types." style="margin-bottom: 2rem" />

      <div class="subsection">
        <h3 class="subsection__title">Enemies</h3>
        <div class="entity-select" role="list" aria-label="Enemy roster">
          <button v-for="enemy in placeholderEnemies" :key="enemy.id" type="button" :aria-pressed="selectedEnemy.id === enemy.id" :class="['entity-chip', { 'entity-chip--active': selectedEnemy.id === enemy.id }]" @click="selectEnemyAndScroll(enemy.id)">
            <img class="entity-chip__thumb" :src="enemy.media" :alt="`${enemy.name} chip art`" />
            <span>{{ enemy.name }}</span>
          </button>
        </div>
        <article ref="enemyFile" class="entity-file" aria-live="polite">
          <div class="detail-nav">
            <button type="button" class="detail-nav__arrow" aria-label="Previous enemy" @click="previousEnemy">←</button>
            <button type="button" class="detail-nav__arrow" aria-label="Next enemy" @click="nextEnemy">→</button>
          </div>
          <div class="entity-file__hero">
            <img class="entity-file__portrait" :src="selectedEnemy.media" :alt="`${selectedEnemy.name} artwork`" />
          </div>
          <div class="entity-file__copy">
            <p class="eyebrow">Encounter file</p>
            <h3>{{ selectedEnemy.name }}</h3>
            <span class="status-tag">Coming soon</span>
            <p>Regular enemy encounters are being catalogued and will appear here in a future update.</p>
          </div>
          <div class="entity-file__details">
            <section class="detail-panel detail-panel--clip" aria-labelledby="enemy-clip-title">
              <p class="eyebrow">Motion study</p><h4 id="enemy-clip-title">Clip</h4>
              <div class="move-video">
                <video class="move-video__player" autoplay muted loop playsinline poster="/media/placeholders/entity-clip-poster-placeholder.svg">
                  <source src="/media/videos/gameplay-loop.mp4" type="video/mp4" />
                </video>
                <span class="move-video__label">Placeholder clip</span>
              </div>
            </section>
            <section class="detail-panel detail-panel--characteristics" aria-labelledby="enemy-characteristics-title">
              <p class="eyebrow">Editorial notes</p><h4 id="enemy-characteristics-title">Characteristics</h4>
              <ul class="attribute-list">
                <li>Threat profile — to verify</li>
                <li>Preferred range — to verify</li>
                <li>Recommended approach — to verify</li>
              </ul>
            </section>
          </div>
        </article>
      </div>

      <div class="subsection">
        <h3 class="subsection__title">Bosses</h3>
        <div class="entity-select" role="list" aria-label="Boss encounters">
          <button v-for="boss in bosses" :key="boss.id" type="button" :aria-pressed="selectedBoss.id === boss.id" :class="['entity-chip', { 'entity-chip--active': selectedBoss.id === boss.id }]" @click="selectBossAndScroll(boss.id)">
            <img v-if="boss.media" class="entity-chip__thumb" :src="boss.media" :alt="`${boss.name} chip art`" />
            <span v-else class="entity-chip__thumb entity-chip__thumb--fallback" aria-hidden="true">{{ boss.name.slice(0, 2) }}</span>
            <span>{{ boss.name }}</span>
          </button>
        </div>
        <article ref="bossFile" class="entity-file" aria-live="polite">
          <div class="detail-nav">
            <button type="button" class="detail-nav__arrow" aria-label="Previous boss" @click="previousBoss">←</button>
            <button type="button" class="detail-nav__arrow" aria-label="Next boss" @click="nextBoss">→</button>
          </div>
          <div class="entity-file__hero" :class="{ 'entity-file__hero--arena': selectedBoss.arenaMedia }" :style="selectedBoss.arenaMedia ? { '--arena-media': `url(${selectedBoss.arenaMedia})` } : undefined">
            <img v-if="selectedBoss.media" class="entity-file__portrait" :src="selectedBoss.media" :alt="`${selectedBoss.name} artwork`" />
            <span v-else aria-hidden="true">{{ selectedBoss.name.slice(0, 2).toUpperCase() }}</span>
          </div>
          <div class="entity-file__copy">
            <p class="eyebrow">Encounter file</p>
            <h3>{{ selectedBoss.name }}</h3>
            <span class="status-tag">{{ selectedBoss.status }}</span>
            <p>{{ selectedBoss.description }}</p>
          </div>
          <div class="entity-file__details">
            <section class="detail-panel detail-panel--clip" aria-labelledby="boss-clip-title">
              <p class="eyebrow">Motion study</p><h4 id="boss-clip-title">Clip</h4>
              <div class="move-video">
                <video :key="selectedBoss.id" class="move-video__player" autoplay muted loop playsinline poster="/media/placeholders/entity-clip-poster-placeholder.svg">
                  <source src="/media/videos/gameplay-loop.mp4" type="video/mp4" />
                </video>
                <span class="move-video__label">{{ selectedBoss.name }} — placeholder clip</span>
              </div>
            </section>
            <section class="detail-panel detail-panel--characteristics" aria-labelledby="boss-characteristics-title">
              <p class="eyebrow">Editorial notes</p><h4 id="boss-characteristics-title">Characteristics</h4>
              <ul class="attribute-list">
                <li>Threat profile — to verify</li>
                <li>Preferred range — to verify</li>
                <li>Recommended approach — to verify</li>
              </ul>
            </section>
          </div>
        </article>
      </div>
    </section>

    <section id="unlocks" class="content-section routed-section content-section--unlocks" aria-labelledby="unlocks-title">
      <SectionHeading title-id="unlocks-title" kicker="08 / Unlocks" title="Unlock All Content" intro="Progress differs between versions. Select a platform to get a guide for that specific version." style="margin-bottom: 2rem" />
      <HorizontalNav :items="unlockPlatforms" v-model="selectedUnlockPlatform" nav-label="Select a platform for unlock notes" style="position: relative; z-index: 2;" />
      <article class="unlock-detail subsection__panel gradient-border" aria-live="polite" style="position: relative; z-index: 1; border: none; background: linear-gradient(180deg, rgb(249, 216, 119) 0%, rgb(255, 242, 202) 100%); border-radius: 0.5rem; border-top-left-radius: 0;">
        <div v-if="selectedUnlockPlatform === 'dreamcast'" class="panel-content panel-content--dreamcast">
          <p class="platform-label">Home console</p>
          <h3>Dreamcast</h3>
          <p>Adventure play and the in-game item economy underpin the home progression loop. Character and item requirements can vary by release or source.</p>
          <span class="status-tag">Exact conditions to verify</span>
          <p class="unlock-detail__pending">Before investing time, confirm your region and save context against a verified manual or gameplay record.</p>
        </div>
        <div v-else-if="selectedUnlockPlatform === 'arcade'" class="panel-content panel-content--arcade">
          <p class="platform-label">Hardware context</p>
          <h3>Arcade</h3>
          <p>The arcade release is historical and hardware context here—not a home unlock path. This guide does not apply Dreamcast save-based instructions to arcade operation.</p>
          <span class="status-tag">Not a home unlock path</span>
          <p class="unlock-detail__pending">Full unlock checklists for this platform are queued for a future update.</p>
        </div>
        <div v-else-if="selectedUnlockPlatform === 'psp'" class="panel-content panel-content--psp">
          <p class="platform-label">Portable compilation</p>
          <h3>PSP</h3>
          <p>The compilation combines both games and includes its own portable-era presentation and progression context.</p>
          <span class="status-tag">Collection-specific details to verify</span>
          <p class="unlock-detail__pending">Do not assume every Dreamcast instruction maps one-to-one to this release.</p>
        </div>
        <div v-else-if="selectedUnlockPlatform === 'pc'" class="panel-content panel-content--pc">
          <p class="platform-label">Home computer</p>
          <h3>PC</h3>
          <p>Home computer summary</p>
          <span class="status-tag">Home computer status</span>
          <p class="unlock-detail__pending">Home computer note</p>
        </div>
      </article>
    </section>

    <section id="history" class="content-section routed-section content-section--history" aria-labelledby="history-title">
      <SectionHeading title-id="history-title" kicker="09 / History" title="A bright streak through fighting history" intro="From Capcom’s first 3D arena experiment to a portable compilation and an enduring multiplayer legacy." />
      <ol class="timeline">
        <li v-for="(milestone, index) in milestones" :key="index">
          <time>{{ milestone[0] }}</time>
          <span aria-hidden="true" />
          <div class="timeline__content">
            <button type="button" class="timeline__thumb" @click="store.openLightbox({ src: timelineImage, alt: `${milestone[0]} milestone illustration` })">
              <img :src="timelineImage" width="110" height="75" alt="" />
            </button>
            <p>{{ milestone[1] }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section id="about" class="content-section routed-section about" aria-labelledby="about-title">
      <div class="about__mark" aria-hidden="true">PS<br />2</div>
      <div class="about__copy">
        <SectionHeading title-id="about-title" kicker="10 / About Us" title="This site is made by fans" intro="This independent, non-commercial, non-affiliated guide celebrates Power Stone 2 and gives players a clear, accessible place to learn. All game content, imagery, and related intellectual property are owned by Capcom Co., Ltd. and all rights remain with their respective rights holders." />
        <div class="accordion">
          <section class="accordion__item">
            <h3 class="accordion__heading">
              <button type="button" class="accordion__trigger" :aria-expanded="openAboutSection === 'resources'" aria-controls="about-resources-panel" @click="toggleAboutSection('resources')">Resources<span class="accordion__icon" aria-hidden="true">{{ openAboutSection === 'resources' ? '−' : '+' }}</span></button>
            </h3>
            <div v-show="openAboutSection === 'resources'" id="about-resources-panel" class="accordion__panel">
              <p>Here are some other resources you might find interesting.</p>
              <div class="about__reference">
                <figure><img src="/media/box-art/dreamcast-box-art.jpg" alt="Original Power Stone 2 Dreamcast box art, shown for reference only." /><figcaption>Dreamcast box art</figcaption></figure>
                <figure><img src="/media/fonts/font-sprite.png" alt="Bitmap font sprite sheet from the original game, shown for reference only." /><figcaption>Font sprite reference</figcaption></figure>
              </div>
              <p class="about__promise">You can copy this website on <a href="https://github.com/ERDAgent/PowerStone2" target="_blank">github</a>. It was made by <a href="https://github.com/ERDAgent" target="_blank">ERDAgent</a>, with help from <a href="https://github.com/EricRoseDev" target="_blank">EricRoseDev</a></p>
            </div>
          </section>
          <section class="accordion__item">
            <h3 class="accordion__heading">
              <button type="button" class="accordion__trigger" :aria-expanded="openAboutSection === 'links'" aria-controls="about-links-panel" @click="toggleAboutSection('links')">Links<span class="accordion__icon" aria-hidden="true">{{ openAboutSection === 'links' ? '−' : '+' }}</span></button>
            </h3>
            <div v-show="openAboutSection === 'links'" id="about-links-panel" class="accordion__panel">
                <a href="#">Links</a>
            </div>
          </section>
          <section class="accordion__item">
            <h3 class="accordion__heading">
              <button type="button" class="accordion__trigger" :aria-expanded="openAboutSection === 'contact'" aria-controls="about-contact-panel" @click="toggleAboutSection('contact')">Contact<span class="accordion__icon" aria-hidden="true">{{ openAboutSection === 'contact' ? '−' : '+' }}</span></button>
            </h3>
            <div v-show="openAboutSection === 'contact'" id="about-contact-panel" class="accordion__panel">
              <p>Contact info here</p>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
  <Lightbox />
  <MediaGalleryDialog :title="selectedLevel.name" :items="galleryItems" :active-index="openGallery?.index ?? null" @close="closeLevelGallery" @next="nextGalleryItem" @previous="previousGalleryItem" />
</template>
