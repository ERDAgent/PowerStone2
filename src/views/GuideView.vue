<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { storeToRefs } from 'pinia'
import SectionHeading from '@/components/SectionHeading.vue'
import LevelDialog from '@/components/LevelDialog.vue'
import RecipeLookup from '@/components/RecipeLookup.vue'
import { bosses, characters, items, levels } from '@/data/content'
import { useGuideStore } from '@/stores/guide'
import type { CatalogEntity, CatalogKind } from '@/stores/guide'

const store = useGuideStore()
const { selectedCharacter, selectedEntity, filteredEntities, catalogKind, itemCategory, itemQuery } = storeToRefs(store)
const categories = computed(() => ['All', ...new Set(items.map(item => item.category ?? 'Uncategorized'))])
const catalogTabs = [
  { kind: 'all', label: 'All' },
  { kind: 'item', label: 'Items' },
  { kind: 'material', label: 'Materials' },
  { kind: 'essence', label: 'Essences' },
] as const
const tabElements = ref<HTMLButtonElement[]>([])

function entityKindLabel(entity: CatalogEntity) { return entity.kind[0].toUpperCase() + entity.kind.slice(1) }
function entityNumberLabel(entity: CatalogEntity) { return `${entityKindLabel(entity)} ${Number(entity.record.number)}` }
function entityContext(entity: CatalogEntity) {
  if (entity.kind === 'item') return entity.record.category ?? 'Uncategorized'
  if (entity.kind === 'material') return entity.record.type
  return 'Card essence'
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

const multiplayerSteps = [
  ['Prepare your game', 'Use your own legally obtained game files and confirm they launch locally before networking.'],
  ['Get Flycast Dojo', 'Use the project’s current official documentation and release channel; avoid archived third-party bundles.'],
  ['Match settings', 'Agree on platform/game revision, region, emulator settings, and controller mapping with every player.'],
  ['Run a local check', 'Play offline first to catch controller, audio, performance, or file-integrity issues.'],
  ['Configure networking', 'Follow current Dojo guidance for hosting or joining; networking requirements can change.'],
  ['Start a test session', 'Begin with a short match and use a wired connection where practical.'],
  ['Troubleshoot together', 'If sync fails, recheck matching files/settings, close overlays, and compare logs before retrying.'],
]
const milestones = [
  ['1999', 'Power Stone arrives in arcades and on Dreamcast, establishing the transforming 3D arena formula.'],
  ['Early 2000', 'Power Stone 2 reaches Japanese arcades on Sega NAOMI hardware.'],
  ['2000', 'The Dreamcast edition brings four-player arena action to the home console era.'],
  ['2000–2001', 'Regional Dreamcast releases introduce the sequel to players beyond Japan.'],
  ['2006', 'Power Stone Collection gathers both games for PSP and adapts the experience for portable play.'],
  ['2010s', 'Players sustain the series through local gatherings, guides, preservation, and competitive discovery.'],
  ['Today', 'Its transforming arenas and item-driven chaos remain a distinct reference point for multiplayer action games.'],
]
</script>

<template>
  <div class="guide">
    <section id="overview" class="hero routed-section" aria-labelledby="overview-title">
      <div class="hero__orbits" aria-hidden="true"><i /><i /><i /></div>
      <div class="hero__content">
        <p class="hero__kicker">The world’s yours for the taking</p>
        <img class="hero__logo" src="/media/logos/power-stone-2-logo.png" alt="Power Stone 2" />
        <h1 id="overview-title" class="sr-only">Power Stone 2 Field Guide</h1>
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
      <a class="hero__scroll" href="#how-to-play">How to play <span aria-hidden="true">↓</span></a>
    </section>

    <section id="how-to-play" class="content-section routed-section content-section--how-to-play" aria-labelledby="how-to-play-title">
      <SectionHeading title-id="how-to-play-title" kicker="01 / Field briefing" title="Learn the scramble." intro="Power Stone 2 is a free-moving arena fight: outlast the opposition while adapting to items, transformations, hazards, and stages that refuse to sit still." />
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
    </section>

    <section id="multiplayer" class="content-section routed-section" aria-labelledby="multiplayer-title">
      <SectionHeading title-id="multiplayer-title" kicker="02 / Network bench" title="Bring the couch online." intro="A version-agnostic Flycast Dojo readiness path focused on matching setups and diagnosing issues—without promising a permanent link or frozen interface." />
      <ol class="steps">
        <li v-for="(step, index) in multiplayerSteps" :key="step[0]"><span class="steps__number">{{ String(index + 1).padStart(2, '0') }}</span><div><h3>{{ step[0] }}</h3><p>{{ step[1] }}</p></div></li>
      </ol>
      <aside class="callout"><b>Keep it legitimate and current.</b> Supply your own game files, consult Flycast Dojo’s current official documentation, and expect networking screens or requirements to evolve.</aside>
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
          <div class="item-detail__copy"><p class="eyebrow">{{ entityNumberLabel(selectedEntity) }} · {{ entityContext(selectedEntity) }}</p><h3>{{ selectedEntity.record.name }}</h3><dl v-if="selectedEntity.kind === 'item'"><div><dt>Function</dt><dd>{{ selectedEntity.record.function }}</dd></div><div><dt>Item level</dt><dd>{{ selectedEntity.record.level }}</dd></div></dl><dl v-else-if="selectedEntity.kind === 'material'"><div><dt>Material type</dt><dd>{{ selectedEntity.record.type }}</dd></div><div><dt>Rarity</dt><dd>{{ selectedEntity.record.rarity ?? 'Unknown' }}</dd></div><div><dt>Worth</dt><dd>{{ selectedEntity.record.worth ?? 'Unknown' }}</dd></div></dl><dl v-else><div><dt>Entity kind</dt><dd>Essence card</dd></div></dl><p v-if="selectedEntity.record.provenance.notes.length" class="data-note">{{ selectedEntity.record.provenance.notes.join(' ') }}</p></div>
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
          <span v-if="character.availability === 'psp-exclusive'" class="status-tag">PSP exclusive</span>
          <span>{{ character.name }}</span>
        </button>
      </div>
      <article class="fighter-file" aria-live="polite">
        <div class="fighter-file__hero" :style="{ '--character-color': selectedCharacter.color }">
          <img v-if="selectedCharacter.portrait" class="fighter-file__portrait" :src="selectedCharacter.portrait" :alt="`${selectedCharacter.name} full character art`" />
          <span v-else aria-hidden="true">{{ selectedCharacter.name.slice(0, 2).toUpperCase() }}</span>
          <span v-if="selectedCharacter.availability === 'psp-exclusive'" class="status-tag">PSP exclusive</span>
          <small v-if="!selectedCharacter.portrait">Replaceable character art</small>
        </div>
        <div class="fighter-file__copy"><p class="eyebrow">Player file</p><h3>{{ selectedCharacter.name }}</h3><p class="fighter-file__tagline">{{ selectedCharacter.tagline }}</p><h4>Background / history</h4><p>{{ selectedCharacter.history }}</p><h4>Editorial attributes</h4><ul class="attribute-list"><li v-for="attribute in selectedCharacter.attributes" :key="attribute">{{ attribute }}</li></ul></div>
        <div class="fighter-file__moves"><div><p class="eyebrow">Moves & play categories</p><h4>Field notes</h4></div><ol><li v-for="(move, index) in selectedCharacter.moves" :key="move"><span>0{{ index + 1 }}</span>{{ move }}</li></ol></div>
      </article>
    </section>

    <section id="levels" class="content-section routed-section content-section--levels" aria-labelledby="levels-title">
      <SectionHeading title-id="levels-title" kicker="06 / Arenas" title="Every stage is in motion." intro="Open an arena file to inspect its replaceable visual study. Use the arrow keys inside the gallery to move between views." />
      <div class="level-grid">
        <button v-for="(level, index) in levels" :key="level.id" class="level-card" type="button" @click="store.showLevel(level.id)"><img :src="level.media" :alt="`${level.name} replaceable level artwork`" /><span class="level-card__number">0{{ index + 1 }}</span><span class="level-card__copy"><b>{{ level.name }}</b><small>{{ level.description }}</small><em>Open arena file →</em></span></button>
      </div>
    </section>

    <section id="bosses" class="content-section routed-section content-section--bosses" aria-labelledby="bosses-title">
      <SectionHeading title-id="bosses-title" kicker="07 / Encounters" title="When the arena fights back." intro="Two established Power Stone 2 encounters, described cautiously and without padding the roster with uncertain names." />
      <div class="boss-grid">
        <article v-for="(boss, index) in bosses" :key="boss.id" class="boss-card"><img v-if="boss.media" :src="boss.media" :alt="`${boss.name} replaceable boss artwork placeholder`" /><div><p class="eyebrow">Encounter {{ String(index + 1).padStart(2, '0') }}</p><h3>{{ boss.name }}</h3><p>{{ boss.description }}</p><span class="status-tag">{{ boss.status }}</span></div></article>
      </div>
    </section>

    <section id="unlocks" class="content-section routed-section content-section--split" aria-labelledby="unlocks-title">
      <SectionHeading title-id="unlocks-title" kicker="08 / Progress" title="Know which version you’re playing." intro="Progress systems differ across releases. Treat the notes below as a safe orientation, not a substitute for a version-specific verified checklist." />
      <div class="unlock-grid">
        <article><p class="platform-label">Home console</p><h3>Dreamcast</h3><p>Adventure play and the in-game item economy underpin the home progression loop. Character and item requirements can vary by release or source.</p><span class="status-tag">Exact conditions to verify</span><p>Before investing time, confirm your region and save context against a verified manual or gameplay record.</p></article>
        <article><p class="platform-label">Portable compilation</p><h3>PSP · Power Stone Collection</h3><p>The compilation combines both games and includes its own portable-era presentation and progression context.</p><span class="status-tag">Collection-specific details to verify</span><p>Do not assume every Dreamcast instruction maps one-to-one to this release.</p></article>
        <article class="unlock-grid__context"><p class="platform-label">Hardware context</p><h3>Arcade / NAOMI</h3><p>The arcade release is historical and hardware context here—not a home unlock path. This guide does not apply Dreamcast save-based instructions to arcade operation.</p></article>
      </div>
    </section>

    <section id="history" class="content-section routed-section content-section--history" aria-labelledby="history-title">
      <SectionHeading title-id="history-title" kicker="09 / Archive" title="A bright streak through arcade history." intro="From Capcom’s first 3D arena experiment to a portable compilation and an enduring multiplayer legacy." />
      <ol class="timeline"><li v-for="(milestone, index) in milestones" :key="index"><time>{{ milestone[0] }}</time><span aria-hidden="true" /><p>{{ milestone[1] }}</p></li></ol>
    </section>

    <section id="about" class="content-section routed-section about" aria-labelledby="about-title">
      <div class="about__mark" aria-hidden="true">PS<br />2</div>
      <div class="about__copy"><SectionHeading title-id="about-title" kicker="10 / About Us" title="Made by fans, built to be corrected." intro="This independent, non-commercial field guide celebrates Power Stone 2 and gives players a clear, accessible place to learn. Provisional facts are visibly flagged for future verification." /><p>It is not affiliated with or endorsed by Capcom. Game names, characters, artwork, logos, music, footage, and all other related rights remain with their respective rights holders.</p>
        <div class="about__reference">
          <figure><img src="/media/box-art/dreamcast-box-art.jpg" alt="Original Power Stone 2 Dreamcast box art, shown for reference only." /><figcaption>Dreamcast box art</figcaption></figure>
          <figure><img src="/media/menus/menu-items.png" alt="Screenshot of the original game's in-game menu text, shown for reference only." /><figcaption>Menu text reference</figcaption></figure>
          <figure><img src="/media/fonts/font-sprite.png" alt="Bitmap font sprite sheet from the original game, shown for reference only." /><figcaption>Font sprite reference</figcaption></figure>
        </div>
        <p class="about__promise">No hotlinked media. No invented certainty. A structure ready for sourced updates.</p></div>
    </section>
  </div>
  <LevelDialog />
</template>
