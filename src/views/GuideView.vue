<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import SectionHeading from '@/components/SectionHeading.vue'
import HorizontalNav from '@/components/HorizontalNav.vue'
import Lightbox from '@/components/Lightbox.vue'
import MediaGalleryDialog from '@/components/MediaGalleryDialog.vue'
import type { GalleryItem } from '@/components/MediaGalleryDialog.vue'
import RecipeLookup from '@/components/RecipeLookup.vue'
import { bosses, characters, items, levels } from '@/data/content'
import { useGuideStore } from '@/stores/guide'
import type { CatalogEntity, CatalogKind } from '@/stores/guide'

const store = useGuideStore()
const { selectedCharacter, selectedEntity, filteredEntities, catalogKind, itemCategory, itemQuery, selectedLevel, selectedMove, selectedSpecial, selectedMoveIndex, selectedSpecialIndex, selectedBoss } = storeToRefs(store)
const characteristicLabels = [
  ['strength', 'Strength'],
  ['throwDistance', 'Throw Distance'],
  ['damage', 'Damage'],
  ['toughness', 'Toughness'],
  ['speed', 'Speed'],
] as const
const categories = computed(() => ['All', ...new Set(items.map(item => item.category ?? 'Uncategorized'))])
const catalogTabs = [
  { kind: 'all', label: 'All' },
  { kind: 'item', label: 'Items' },
  { kind: 'material', label: 'Materials' },
  { kind: 'essence', label: 'Essences' },
] as const
const tabElements = ref<HTMLButtonElement[]>([])
type AboutSection = 'resources' | 'other' | 'contact'
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

const quickFacts = [
  ['4-player arenas', 'Up to four fighters share one freely explorable 3D stage instead of a locked-off fighting-game plane.'],
  ['Power Stone transformations', 'Collecting three stones grants a temporary, stronger form built around each character’s powered-up moves.'],
  ['Living stages', 'Arenas shift, travel, and introduce hazards mid-match, turning positioning into its own skill.'],
  ['A wide roster', 'Fourteen characters on arcade and Dreamcast, plus two additional PSP-exclusive fighters in the Collection release.'],
]

const platforms = [
  {
    id: 'dreamcast', label: 'Dreamcast', image: '/media/consoles/dc-console-small-withshadow-compressed.png',
    summary: 'The 2000–2001 home console release most guides — including this one — treat as the baseline for controls and progression.',
    notes: [
      'Supports up to four players locally using the Dreamcast’s four native controller ports.',
      'A VMU is required to save progress, and it can show mini-game content on its small screen.',
      'Regional releases vary in launch date and minor content; confirm your specific disc/region before relying on version-specific notes.',
    ],
  },
  {
    id: 'arcade', label: 'Arcade (NAOMI)', image: '/media/consoles/arcade-cabinet-small-withshadow-compressed.png',
    summary: 'The original release ran in arcades on Sega’s NAOMI hardware, typically in multi-panel cabinets built for simultaneous local play.',
    notes: [
      'Cabinet configuration, coin/credit systems, and regional board variants are historical context here, not a home setup guide.',
      'This guide does not apply Dreamcast save-based instructions to arcade operation.',
    ],
  },
  {
    id: 'psp', label: 'PSP · Power Stone Collection', image: '/media/consoles/psp-console-small-withshadow-compressed.png',
    summary: 'A 2006 compilation that adapts both Power Stone games for handheld play.',
    notes: [
      'Four-player arena action is remapped onto the PSP’s single analog nub and shoulder buttons.',
      'Ad-hoc wireless play stands in for the console versions’ local multiplayer.',
      'Treat Dreamcast control and unlock instructions as a starting point only — confirm collection-specific details separately.',
    ],
  },
  {
    id: 'pc', label: 'PC', image: '/media/consoles/pc-small-withshadow-compressed.png',
    summary: 'No official PC release of Power Stone 2 is confirmed; PC players currently reach the game through emulation rather than a native port.',
    notes: [
      'Flycast (or another actively maintained Dreamcast emulator) is the primary path — see Play Online below for setup and Dojo networking notes.',
      'Performance and control mapping vary by emulator build and input hardware; a wired controller is recommended for four-player local play.',
      'Treat any storefront listing claiming a native PC release skeptically until verified.',
    ],
  },
] as const

const modes = [
  {
    id: 'adventure', label: 'Adventure Mode',
    summary: 'A story path through a series of stages and boss encounters, framed as each character’s personal quest for the Atlamillia.',
    notes: ['Some releases allow a second player to join in on parts of the adventure.', 'Exact stage counts, branching, and unlock triggers vary by release and remain queued for verification.'],
  },
  {
    id: 'vs-battle', label: 'VS Battle',
    summary: 'The core multiplayer format: up to four fighters share a single transforming arena, racing to combine Power Stones for a temporary transformation.',
    notes: ['This is the mode most guides and tournaments reference when discussing matchups.', 'Item spawns, hazards, and stage transitions can reshape a fight at any moment.'],
  },
  {
    id: 'survival', label: 'Survival / Trial',
    summary: 'Solo-focused challenge modes that test endurance or a specific skill outside the main story and versus formats.',
    notes: ['Naming, structure, and availability differ across the arcade, Dreamcast, and PSP Collection releases.', 'Confirm against your specific version before relying on this guide.'],
  },
] as const

const onlineOptions = [
  {
    id: 'flycast-dojo', label: 'Flycast Dojo',
    intro: 'A version-agnostic Flycast Dojo readiness path focused on matching setups and diagnosing issues—without promising a permanent link or frozen interface.',
    steps: [
      ['Prepare your game', 'Use your own legally obtained game files and confirm they launch locally before networking.'],
      ['Get Flycast Dojo', 'Use the project’s current official documentation and release channel; avoid archived third-party bundles.'],
      ['Match settings', 'Agree on platform/game revision, region, emulator settings, and controller mapping with every player.'],
      ['Run a local check', 'Play offline first to catch controller, audio, performance, or file-integrity issues.'],
      ['Configure networking', 'Follow current Dojo guidance for hosting or joining; networking requirements can change.'],
      ['Start a test session', 'Begin with a short match and use a wired connection where practical.'],
      ['Troubleshoot together', 'If sync fails, recheck matching files/settings, close overlays, and compare logs before retrying.'],
    ],
  },
  {
    id: 'steam', label: 'Steam',
    intro: 'No official Steam release of Power Stone 2 is currently confirmed; treat any storefront listing skeptically until verified. PC players typically reach the game through emulation.',
    steps: [
      ['Check for an official listing', 'Search Steam yourself before assuming availability, and prioritize the publisher’s current storefront over unofficial claims.'],
      ['Use verified emulation on PC', 'Absent an official release, run Flycast (or another actively maintained Dreamcast emulator) and add it to Steam as a non-Steam game for a unified library entry.'],
      ['Match Dojo settings', 'If playing online, follow the same Flycast Dojo setup used on any other PC install; Steam is a launcher, not a networking layer.'],
      ['Watch the Steam Overlay', 'Overlay input capture can interfere with emulator hotkeys — disable it per-game if you run into issues.'],
    ],
  },
  {
    id: 'other', label: 'Other',
    intro: 'A general fallback for platforms and frontends not covered above. Treat Flycast Dojo as the reference path and compare any alternative against it.',
    steps: [
      ['Confirm the source', 'Prioritize official documentation and reputable communities over unlisted third-party bundles or streams claiming to host multiplayer for this title.'],
      ['Check platform-specific bridges', 'Some handheld or frontend builds (for example, RetroArch’s Flycast core) can reach Dojo-compatible sessions — verify netplay parity before relying on it.'],
      ['Compare settings first', 'Only use an alternative path once you’ve confirmed it supports the same matching and networking requirements as Flycast Dojo.'],
      ['Report inconsistencies', 'Note any divergent settings or requirements you discover instead of assuming they’re universal.'],
    ],
  },
] as const

const unlockPlatforms = [
  {
    id: 'dreamcast', label: 'Dreamcast', image: '/media/consoles/dc-console-small-withshadow-compressed.png', platformLabel: 'Home console',
    summary: 'Adventure play and the in-game item economy underpin the home progression loop. Character and item requirements can vary by release or source.',
    status: 'Exact conditions to verify',
    note: 'Before investing time, confirm your region and save context against a verified manual or gameplay record.',
  },
  {
    id: 'psp', label: 'PSP · Power Stone Collection', image: '/media/consoles/psp-console-small-withshadow-compressed.png', platformLabel: 'Portable compilation',
    summary: 'The compilation combines both games and includes its own portable-era presentation and progression context.',
    status: 'Collection-specific details to verify',
    note: 'Do not assume every Dreamcast instruction maps one-to-one to this release.',
  },
  {
    id: 'arcade', label: 'Arcade (NAOMI)', image: '/media/consoles/arcade-cabinet-small-withshadow-compressed.png', platformLabel: 'Hardware context',
    summary: 'The arcade release is historical and hardware context here—not a home unlock path. This guide does not apply Dreamcast save-based instructions to arcade operation.',
    status: 'Not a home unlock path',
    note: 'Full unlock checklists for this platform are queued for a future update.',
  },
] as const

const characterSlides = [
  '/media/placeholders/character-slideshow-slide-1-placeholder.svg',
  '/media/placeholders/character-slideshow-slide-2-placeholder.svg',
  '/media/placeholders/character-slideshow-slide-3-placeholder.svg',
]

const selectedPlatform = ref<typeof platforms[number]['id']>(platforms[0].id)
const selectedMode = ref<typeof modes[number]['id']>(modes[0].id)
const selectedOnline = ref<typeof onlineOptions[number]['id']>(onlineOptions[0].id)
const selectedUnlockPlatform = ref<typeof unlockPlatforms[number]['id']>(unlockPlatforms[0].id)
const activePlatform = computed(() => platforms.find(platform => platform.id === selectedPlatform.value) ?? platforms[0])
const activeMode = computed(() => modes.find(mode => mode.id === selectedMode.value) ?? modes[0])
const activeOnline = computed(() => onlineOptions.find(option => option.id === selectedOnline.value) ?? onlineOptions[0])
const activeUnlockPlatform = computed(() => unlockPlatforms.find(platform => platform.id === selectedUnlockPlatform.value) ?? unlockPlatforms[0])

const characterSlideIndex = ref(0)
watch(selectedCharacter, () => { characterSlideIndex.value = 0 })
function nextCharacterSlide() { characterSlideIndex.value = (characterSlideIndex.value + 1) % characterSlides.length }
function previousCharacterSlide() { characterSlideIndex.value = (characterSlideIndex.value - 1 + characterSlides.length) % characterSlides.length }

const levelVideos = [
  { video: '/media/videos/gameplay-loop.mp4', poster: '/media/placeholders/level-video-poster-1-placeholder.svg', label: 'Placeholder clip 1' },
  { video: '/media/videos/gameplay-loop.mp4', poster: '/media/placeholders/level-video-poster-2-placeholder.svg', label: 'Placeholder clip 2' },
  { video: '/media/videos/gameplay-loop.mp4', poster: '/media/placeholders/level-video-poster-3-placeholder.svg', label: 'Placeholder clip 3' },
]
const levelPictureItems = computed<GalleryItem[]>(() => selectedLevel.value.slides.map((src, index) => ({ kind: 'image', src, label: `${selectedLevel.value.name} — image ${index + 1}` })))
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

const levelFile = ref<HTMLElement | null>(null)
function selectLevelAndScroll(id: (typeof levels)[number]['id']) {
  store.selectLevel(id)
  nextTick(() => levelFile.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
function previousLevel() {
  const index = levels.findIndex(level => level.id === selectedLevel.value.id)
  store.selectLevel(levels[(index - 1 + levels.length) % levels.length].id)
}
function nextLevel() {
  const index = levels.findIndex(level => level.id === selectedLevel.value.id)
  store.selectLevel(levels[(index + 1) % levels.length].id)
}

const placeholderEnemies = [
  { id: 'enemy-placeholder-1', name: 'Enemy 01' },
  { id: 'enemy-placeholder-2', name: 'Enemy 02' },
  { id: 'enemy-placeholder-3', name: 'Enemy 03' },
] as const
const selectedEnemyId = ref<typeof placeholderEnemies[number]['id']>(placeholderEnemies[0].id)
const selectedEnemy = computed(() => placeholderEnemies.find(enemy => enemy.id === selectedEnemyId.value) ?? placeholderEnemies[0])

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
</script>

<template>
  <div class="guide">
    <section id="home" class="hero routed-section" aria-labelledby="home-title">
      <div class="hero__orbits" aria-hidden="true"><i /><i /><i /></div>
      <div class="hero__content">
        <p class="hero__kicker">The world’s yours for the taking</p>
        <img class="hero__logo" src="/media/logos/power-stone-2-logo.png" alt="Power Stone 2" />
        <h1 id="home-title" class="sr-only">Power Stone 2 Field Guide</h1>
        <p class="hero__lede">A fast, tactile field guide to Capcom’s shape-shifting four-player arena adventure.</p>
        <dl class="hero__meta">
          <div><dt>Release era</dt><dd>Arcade 2000 · Dreamcast 2000–2001</dd></div>
          <div><dt>Platforms</dt><dd>Arcade (NAOMI) · Dreamcast · later PSP collection</dd></div>
          <div><dt>Developer / publisher</dt><dd>Capcom</dd></div>
        </dl>
        <div class="hero__actions"><RouterLink class="button button--primary" to="/items">Explore items</RouterLink><RouterLink class="button button--ghost" to="/characters">Meet the roster</RouterLink></div>
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
      <SectionHeading title-id="game-overview-title" kicker="01 / About the game" title="A transforming arena brawler." intro="Power Stone 2 sends up to four fighters into a single free-roaming stage, racing to combine stones into a temporary transformation while the arena itself keeps changing shape underfoot." />
      <div class="game-overview">
        <p class="game-overview__lede">Capcom’s 2000 sequel expands the original Power Stone into full four-player chaos: any object in reach can become a weapon, any stage can shift or crumble mid-fight, and a well-timed transformation can flip a losing match in seconds. The sections below walk through how to play, on which platform, and how to get a match running with friends.</p>
        <dl class="game-overview__facts">
          <div v-for="fact in quickFacts" :key="fact[0]"><dt>{{ fact[0] }}</dt><dd>{{ fact[1] }}</dd></div>
        </dl>
      </div>
    </section>

    <div class="section-divider" aria-hidden="true"><span class="section-divider__mark">◆</span></div>

    <section id="how-to-play" class="content-section routed-section content-section--how-to-play" aria-labelledby="how-to-play-title">
      <SectionHeading title-id="how-to-play-title" kicker="02 / Field briefing" title="Learn the scramble." intro="Power Stone 2 is a free-moving arena fight: outlast the opposition while adapting to items, transformations, hazards, and stages that refuse to sit still." />
      <div class="play-guide">
        <img class="play-guide__controller" src="/media/hardware/dreamcast-controller.svg" alt="Dreamcast controller" />
        <div class="play-guide__cards">
          <article><span>01</span><h3>Move, fight, interact</h3><p>Run freely around the 3D space, jump between elevations, attack nearby rivals, and use the game’s context-sensitive action to pick up items or interact with arena features. Check your version’s control settings for the exact mapping.</p></article>
          <article><span>02</span><h3>Claim three Power Stones</h3><p>Collect three stones before your opponents to transform. The powered-up form is temporary, so use its stronger attacks decisively while watching for stones knocked loose in the fight.</p></article>
          <article><span>03</span><h3>Use what the arena gives you</h3><p>Grab weapons, ranged tools, defenses, and mobility items, then aim for open space before committing. Pickups can interrupt a plan just as easily as they can create one.</p></article>
          <article><span>04</span><h3>Watch the stage</h3><p>Arenas change, travel, and introduce hazards as a match unfolds. Follow the group’s movement, heed visual warnings, and treat a safe route or platform as part of your strategy.</p></article>
        </div>
      </div>
      <aside class="first-match"><p class="eyebrow">First-match plan</p><p>Keep moving, learn the arena before chasing every pickup, and secure loose Power Stones when the route is safe. Save an item for space-making, then pressure a transformed rival from a distance until their advantage fades.</p></aside>

      <div class="subsection">
        <h3 class="subsection__title">Select a platform</h3>
        <HorizontalNav :items="platforms" v-model="selectedPlatform" nav-label="Select a platform" />
        <article class="subsection__panel" aria-live="polite">
          <p>{{ activePlatform.summary }}</p>
          <ul><li v-for="note in activePlatform.notes" :key="note">{{ note }}</li></ul>
        </article>
      </div>

      <div class="subsection">
        <h3 class="subsection__title">Select a mode</h3>
        <HorizontalNav :items="modes" v-model="selectedMode" nav-label="Select a mode" />
        <article class="subsection__panel" aria-live="polite">
          <p>{{ activeMode.summary }}</p>
          <ul><li v-for="note in activeMode.notes" :key="note">{{ note }}</li></ul>
        </article>
      </div>

      <div class="subsection">
        <h3 class="subsection__title">Play online</h3>
        <HorizontalNav :items="onlineOptions" v-model="selectedOnline" nav-label="Play online" />
        <article class="subsection__panel" aria-live="polite">
          <p>{{ activeOnline.intro }}</p>
          <ol class="steps">
            <li v-for="(step, index) in activeOnline.steps" :key="step[0]"><span class="steps__number">{{ String(index + 1).padStart(2, '0') }}</span><div><h4>{{ step[0] }}</h4><p>{{ step[1] }}</p></div></li>
          </ol>
        </article>
        <aside class="callout"><b>Keep it legitimate and current.</b> Supply your own game files, consult each project’s current official documentation, and expect networking screens or requirements to evolve.</aside>
      </div>
    </section>

    <section id="items" class="content-section routed-section content-section--items" aria-labelledby="items-title">
      <SectionHeading title-id="items-title" kicker="03 / Arsenal" title="Pick it up. Change the match." intro="Browse items, crafting materials, and card essences in one canonical catalog." />
      <div class="catalog-tabs" role="tablist" aria-label="Catalog entity kind">
        <button v-for="(tab, index) in catalogTabs" :key="tab.kind" :ref="element => { if (element) tabElements[index] = element as HTMLButtonElement }" type="button" role="tab" :aria-selected="catalogKind === tab.kind" :tabindex="catalogKind === tab.kind ? 0 : -1" @click="activateCatalogTab(tab.kind, index)" @keydown="onTabKeydown($event, index)">{{ tab.label }}</button>
      </div>
      <label class="item-search" for="item-search">Search {{ catalogTabs.find(tab => tab.kind === catalogKind)?.label.toLowerCase() }} <input id="item-search" :value="itemQuery" type="search" placeholder="Name or catalog number" @input="store.setItemQuery(($event.target as HTMLInputElement).value)" /></label>
      <div v-if="catalogKind === 'item'" class="filter-bar" aria-label="Filter items by category">
        <button v-for="category in categories" :key="category" type="button" :class="['chip', { 'chip--active': itemCategory === category }]" @click="store.setCategory(category)">{{ category }}</button>
      </div>
      <div class="item-browser">
        <div class="item-browser__list" role="list" :aria-label="`${catalogTabs.find(tab => tab.kind === catalogKind)?.label} catalog`">
          <button v-for="entity in filteredEntities" :key="entity.record.id" type="button" :class="['item-tile', { 'item-tile--active': selectedEntity?.record.id === entity.record.id }]" @click="store.selectEntity(entity.record.id)">
            <img v-if="entity.record.media" :src="entity.record.media" alt="" /><span v-else class="entity-fallback" aria-hidden="true">{{ entity.record.name.slice(0, 2) }}</span><span><small>{{ entityNumberLabel(entity) }} · {{ entityContext(entity) }}</small>{{ entity.record.name }}</span><b aria-hidden="true">↗</b>
          </button>
          <p v-if="!filteredEntities.length" class="recipe-empty" role="status">No catalog entities match this search.</p>
        </div>
        <article v-if="selectedEntity" class="item-detail" aria-live="polite">
          <div class="item-detail__visual"><img v-if="selectedEntity.record.media" :src="selectedEntity.record.media" :alt="`${selectedEntity.record.name} ${selectedEntity.kind} artwork`" /><span v-else class="entity-fallback" aria-hidden="true">{{ selectedEntity.record.name.slice(0, 2) }}</span></div>
          <div class="item-detail__copy"><p class="eyebrow">{{ entityNumberLabel(selectedEntity) }} · {{ entityContext(selectedEntity) }}</p><h3>{{ selectedEntity.record.name }}</h3><dl v-if="selectedEntity.kind === 'item'"><div><dt>Function</dt><dd>{{ selectedEntity.record.function }}</dd></div><div><dt>Item level</dt><dd>{{ selectedEntity.record.level }}</dd></div></dl><dl v-else-if="selectedEntity.kind === 'material'"><div><dt>Material type</dt><dd>{{ selectedEntity.record.type }}</dd></div><div><dt>Rarity</dt><dd>{{ selectedEntity.record.rarity ?? 'Unknown' }}</dd></div><div><dt>Worth</dt><dd>{{ selectedEntity.record.worth ?? 'Unknown' }}</dd></div></dl><dl v-else><div><dt>Entity kind</dt><dd>Essence card</dd></div></dl><p v-if="entityNotes(selectedEntity).length" class="data-note">{{ entityNotes(selectedEntity).join(' ') }}</p></div>
        </article>
        <div v-else class="item-detail recipe-empty recipe-empty--detail" role="status"><div><h3>No catalog result selected</h3><p>Try another name or catalog number.</p></div></div>
      </div>
    </section>

    <section id="combinations" class="content-section routed-section" aria-labelledby="combinations-title">
      <SectionHeading title-id="combinations-title" kicker="04 / Workshop" title="Build beyond the pickup." intro="Look up every resolved alternative recorded in the recipe database. Ambiguous source formulas stay visibly quarantined." />
      <RecipeLookup />
    </section>

    <section id="characters" class="content-section routed-section content-section--characters" aria-labelledby="characters-title">
      <SectionHeading title-id="characters-title" kicker="05 / Select player" title="Fourteen ways into the fray, plus two PSP exclusives." intro="Choose a portrait to update the player file. The base Dreamcast and arcade roster numbers fourteen; Kraken and General Valgas are marked PSP exclusive, unlocked only in the Power Stone Collection release. Attributes are editorial impressions; move notation remains queued for gameplay verification." />
      <div class="character-select" role="list" aria-label="Playable characters">
        <button v-for="character in characters" :key="character.id" type="button" :aria-pressed="selectedCharacter.id === character.id" :class="['portrait', { 'portrait--active': selectedCharacter.id === character.id }]" :style="{ '--character-color': character.color }" @click="store.selectCharacter(character.id)">
          <img v-if="character.media" class="portrait__avatar" :src="character.media" :alt="`${character.name} chip art`" />
          <span v-else class="portrait__avatar" aria-hidden="true">{{ character.name.slice(0, 2).toUpperCase() }}</span>
          <span v-if="isPspExclusive(character)" class="status-tag">PSP exclusive</span>
          <span>{{ character.name }}</span>
        </button>
      </div>
      <article class="fighter-file" aria-live="polite">
        <div class="fighter-file__hero" :style="{ '--character-color': selectedCharacter.color }">
          <img v-if="selectedCharacter.portrait" class="fighter-file__portrait" :src="selectedCharacter.portrait" :alt="`${selectedCharacter.name} full character art`" />
          <span v-else class="fighter-file__initials" aria-hidden="true">{{ selectedCharacter.name.slice(0, 2).toUpperCase() }}</span>
          <span v-if="isPspExclusive(selectedCharacter)" class="status-tag">PSP exclusive</span>
          <small v-if="!selectedCharacter.portrait">Replaceable character art</small>
        </div>
        <div class="fighter-file__copy"><p class="eyebrow">Player file</p><h3>{{ selectedCharacter.name }}</h3><p class="fighter-file__tagline">{{ selectedCharacter.tagline }}</p><h4>Background / history</h4><p>{{ selectedCharacter.history }}</p><h4>Editorial attributes</h4><ul class="attribute-list"><li v-for="attribute in selectedCharacter.attributes" :key="attribute">{{ attribute }}</li></ul></div>
        <div class="fighter-file__details">
          <section class="detail-panel detail-panel--characteristics" aria-labelledby="detail-characteristics-title">
            <p class="eyebrow">Editorial ratings</p><h4 id="detail-characteristics-title">Characteristics</h4>
            <dl class="characteristics-list">
              <div v-for="[key, label] in characteristicLabels" :key="key">
                <dt>{{ label }}</dt>
                <dd><span :class="['badge', `badge--${selectedCharacter.characteristics[key]}`]">{{ selectedCharacter.characteristics[key] }}</span></dd>
              </div>
            </dl>
            <div class="character-slideshow">
              <div class="character-slideshow__stage">
                <img :src="characterSlides[characterSlideIndex]" :alt="`${selectedCharacter.name} placeholder slideshow image ${characterSlideIndex + 1}`" />
                <button class="character-slideshow__arrow character-slideshow__arrow--previous" type="button" aria-label="Previous slideshow image" @click="previousCharacterSlide">←</button>
                <button class="character-slideshow__arrow character-slideshow__arrow--next" type="button" aria-label="Next slideshow image" @click="nextCharacterSlide">→</button>
              </div>
              <p class="character-slideshow__caption" aria-live="polite">Image {{ characterSlideIndex + 1 }} of {{ characterSlides.length }} · replaceable character slideshow</p>
            </div>
          </section>

          <section class="detail-panel detail-panel--moves" aria-labelledby="detail-moves-title">
            <p class="eyebrow">Move set</p><h4 id="detail-moves-title">Moves</h4>
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
            <p class="eyebrow">Power Stone arsenal</p><h4 id="detail-specials-title">Specials</h4>
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
      <SectionHeading title-id="levels-title" kicker="06 / Arenas" title="Every stage is in motion." intro="Choose an arena file to inspect its replaceable visual study, browse its pictures, and preview a placeholder video pass." />
      <div class="level-select" role="list" aria-label="Playable arenas">
        <button v-for="(level, index) in levels" :key="level.id" type="button" :aria-pressed="selectedLevel.id === level.id" :class="['level-chip', { 'level-chip--active': selectedLevel.id === level.id }]" @click="selectLevelAndScroll(level.id)">
          <span class="status-tag">{{ level.stageCount }}-Stage</span>
          <img class="level-chip__thumb" :src="level.media" :alt="`${level.name} replaceable level artwork`" />
          <span class="level-chip__number">0{{ index + 1 }}</span>
          <span>{{ level.name }}</span>
          <span class="level-chip__modes">
            <span v-for="mode in level.modes" :key="mode" class="level-chip__mode-badge">{{ mode }}</span>
          </span>
        </button>
      </div>
      <article ref="levelFile" class="level-file" aria-live="polite">
        <div class="level-file__nav">
          <button type="button" class="level-file__nav-arrow" aria-label="Previous arena" @click="previousLevel">←</button>
          <button type="button" class="level-file__nav-arrow" aria-label="Next arena" @click="nextLevel">→</button>
        </div>
        <div class="level-file__hero">
          <img :src="selectedLevel.slides[0]" :alt="`${selectedLevel.name} arena artwork`" />
        </div>
        <div class="level-file__copy">
          <p class="eyebrow">Arena file</p>
          <h3>{{ selectedLevel.name }}</h3>
          <p>{{ selectedLevel.description }}</p>
        </div>
        <div class="level-file__details">
          <section class="detail-panel detail-panel--details" aria-labelledby="level-detail-details-title">
            <p class="eyebrow">Field notes</p><h4 id="level-detail-details-title">Details</h4>
            <p>{{ selectedLevel.description }}</p>
            <p>Extended arena notes — environmental hazards, transformation triggers, and traversal tips — are queued for a future update.</p>
          </section>

          <section class="detail-panel detail-panel--pictures" aria-labelledby="level-detail-pictures-title">
            <p class="eyebrow">Visual study</p><h4 id="level-detail-pictures-title">Pictures</h4>
            <div class="thumb-grid" role="list" aria-label="Arena pictures">
              <button v-for="(picture, index) in levelPictureItems" :key="picture.src" type="button" class="thumb-grid__item" role="listitem" @click="openLevelGallery('pictures', index)">
                <img :src="picture.src" :alt="picture.label" />
              </button>
            </div>
          </section>

          <section class="detail-panel detail-panel--video" aria-labelledby="level-detail-video-title">
            <p class="eyebrow">Motion study</p><h4 id="level-detail-video-title">Video</h4>
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
      <SectionHeading title-id="enemies-title" kicker="07 / Threats" title="Who's standing in your way." intro="Two encounter types make up the opposition: the wider cast of enemies met along the way, and the story bosses that anchor the fight. The enemy roster is queued for a future update." />

      <div class="subsection">
        <h3 class="subsection__title">Enemies</h3>
        <div class="entity-select" role="list" aria-label="Enemy roster">
          <button v-for="enemy in placeholderEnemies" :key="enemy.id" type="button" :aria-pressed="selectedEnemy.id === enemy.id" :class="['entity-chip', { 'entity-chip--active': selectedEnemy.id === enemy.id }]" @click="selectedEnemyId = enemy.id">
            <span class="entity-chip__thumb entity-chip__thumb--fallback" aria-hidden="true">{{ enemy.name.slice(0, 2) }}</span>
            <span>{{ enemy.name }}</span>
          </button>
        </div>
        <article class="entity-file" aria-live="polite">
          <div class="entity-file__hero"><span aria-hidden="true">?</span></div>
          <div class="entity-file__copy">
            <p class="eyebrow">Encounter file</p>
            <h3>{{ selectedEnemy.name }}</h3>
            <span class="status-tag">Coming soon</span>
            <p>Regular enemy encounters are being catalogued and will appear here in a future update.</p>
          </div>
        </article>
      </div>

      <div class="subsection">
        <h3 class="subsection__title">Bosses</h3>
        <div class="entity-select" role="list" aria-label="Boss encounters">
          <button v-for="boss in bosses" :key="boss.id" type="button" :aria-pressed="selectedBoss.id === boss.id" :class="['entity-chip', { 'entity-chip--active': selectedBoss.id === boss.id }]" @click="store.selectBoss(boss.id)">
            <img v-if="boss.media" class="entity-chip__thumb" :src="boss.media" :alt="`${boss.name} chip art`" />
            <span v-else class="entity-chip__thumb entity-chip__thumb--fallback" aria-hidden="true">{{ boss.name.slice(0, 2) }}</span>
            <span>{{ boss.name }}</span>
          </button>
        </div>
        <article class="entity-file" aria-live="polite">
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
        </article>
      </div>
    </section>

    <section id="unlocks" class="content-section routed-section content-section--unlocks" aria-labelledby="unlocks-title">
      <SectionHeading title-id="unlocks-title" kicker="08 / Progress" title="Know which version you’re playing." intro="Progress systems differ across releases. Treat the notes below as a safe orientation, not a substitute for a version-specific verified checklist." />
      <HorizontalNav :items="unlockPlatforms" v-model="selectedUnlockPlatform" nav-label="Select a platform for unlock notes" />
      <article class="unlock-detail">
        <p class="platform-label">{{ activeUnlockPlatform.platformLabel }}</p>
        <h3>{{ activeUnlockPlatform.label }}</h3>
        <p>{{ activeUnlockPlatform.summary }}</p>
        <span class="status-tag">{{ activeUnlockPlatform.status }}</span>
        <p class="unlock-detail__pending">{{ activeUnlockPlatform.note }}</p>
      </article>
    </section>

    <section id="history" class="content-section routed-section content-section--history" aria-labelledby="history-title">
      <SectionHeading title-id="history-title" kicker="09 / Archive" title="A bright streak through arcade history." intro="From Capcom’s first 3D arena experiment to a portable compilation and an enduring multiplayer legacy." />
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
        <SectionHeading title-id="about-title" kicker="10 / About Us" title="Made by fans, built to be corrected." intro="This independent, non-commercial field guide celebrates Power Stone 2 and gives players a clear, accessible place to learn. Provisional facts are visibly flagged for future verification." />
        <div class="accordion">
          <section class="accordion__item">
            <h3 class="accordion__heading">
              <button type="button" class="accordion__trigger" :aria-expanded="openAboutSection === 'resources'" aria-controls="about-resources-panel" @click="toggleAboutSection('resources')">Resources<span class="accordion__icon" aria-hidden="true">{{ openAboutSection === 'resources' ? '−' : '+' }}</span></button>
            </h3>
            <div v-show="openAboutSection === 'resources'" id="about-resources-panel" class="accordion__panel">
              <p>It is not affiliated with or endorsed by Capcom. Game names, characters, artwork, logos, music, footage, and all other related rights remain with their respective rights holders.</p>
              <div class="about__reference">
                <figure><img src="/media/box-art/dreamcast-box-art.jpg" alt="Original Power Stone 2 Dreamcast box art, shown for reference only." /><figcaption>Dreamcast box art</figcaption></figure>
                <figure><img src="/media/menus/menu-items.png" alt="Screenshot of the original game's in-game menu text, shown for reference only." /><figcaption>Menu text reference</figcaption></figure>
                <figure><img src="/media/fonts/font-sprite.png" alt="Bitmap font sprite sheet from the original game, shown for reference only." /><figcaption>Font sprite reference</figcaption></figure>
              </div>
              <p class="about__promise">No hotlinked media. No invented certainty. A structure ready for sourced updates.</p>
            </div>
          </section>
          <section class="accordion__item">
            <h3 class="accordion__heading">
              <button type="button" class="accordion__trigger" :aria-expanded="openAboutSection === 'other'" aria-controls="about-other-panel" @click="toggleAboutSection('other')">Other<span class="accordion__icon" aria-hidden="true">{{ openAboutSection === 'other' ? '−' : '+' }}</span></button>
            </h3>
            <div v-show="openAboutSection === 'other'" id="about-other-panel" class="accordion__panel">
              <p>More notes and disclosures are on the way.</p>
            </div>
          </section>
          <section class="accordion__item">
            <h3 class="accordion__heading">
              <button type="button" class="accordion__trigger" :aria-expanded="openAboutSection === 'contact'" aria-controls="about-contact-panel" @click="toggleAboutSection('contact')">Contact<span class="accordion__icon" aria-hidden="true">{{ openAboutSection === 'contact' ? '−' : '+' }}</span></button>
            </h3>
            <div v-show="openAboutSection === 'contact'" id="about-contact-panel" class="accordion__panel">
              <p>A contact channel for corrections and sourcing is coming soon.</p>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
  <Lightbox />
  <MediaGalleryDialog :title="selectedLevel.name" :items="galleryItems" :active-index="openGallery?.index ?? null" @close="closeLevelGallery" @next="nextGalleryItem" @previous="previousGalleryItem" />
</template>
