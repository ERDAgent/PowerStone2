<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import SectionHeading from '@/components/SectionHeading.vue'
import LevelDialog from '@/components/LevelDialog.vue'
import { characters, items, levels } from '@/data/content'
import { useGuideStore } from '@/stores/guide'

const store = useGuideStore()
const { selectedCharacter, selectedItem, filteredItems, itemCategory } = storeToRefs(store)
const categories = computed(() => ['All', ...new Set(items.map(item => item.category))])

const combinations = [
  { parts: 'Boots + Wing card', result: 'Mobility-focused result', note: 'Exact outcome to verify' },
  { parts: 'Sword + Fire card', result: 'Flame-themed weapon result', note: 'Exact recipe to verify' },
  { parts: 'Shield + Star card', result: 'Defensive modifier result', note: 'Exact behavior to verify' },
]
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
        <img class="hero__logo" src="/media/power-stone-2-logo.png" alt="Power Stone 2" />
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
        <video class="hero__video" autoplay muted loop playsinline poster="/media/gameplay-loop-poster.jpg" aria-hidden="true">
          <source src="/media/gameplay-loop.mp4" type="video/mp4" />
        </video>
        <span class="hero__media-label">Power Stone 2 in motion</span>
      </div>
      <a class="hero__scroll" href="#how-to-play">How to play <span aria-hidden="true">↓</span></a>
    </section>

    <section id="how-to-play" class="content-section routed-section content-section--how-to-play" aria-labelledby="how-to-play-title">
      <SectionHeading title-id="how-to-play-title" kicker="01 / Field briefing" title="Learn the scramble." intro="Power Stone 2 is a free-moving arena fight: outlast the opposition while adapting to items, transformations, hazards, and stages that refuse to sit still." />
      <div class="play-guide">
        <img class="play-guide__controller" src="/media/dreamcast-controller.svg" alt="Dreamcast controller" />
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
      <SectionHeading title-id="items-title" kicker="03 / Arsenal" title="Pick it up. Change the match." intro="Browse representative item entries from the field guide’s growing catalog." />
      <div class="filter-bar" aria-label="Filter items by category">
        <button v-for="category in categories" :key="category" type="button" :class="['chip', { 'chip--active': itemCategory === category }]" @click="store.setCategory(category)">{{ category }}</button>
      </div>
      <div class="item-browser">
        <div class="item-browser__list" role="list" aria-label="Items">
          <button v-for="item in filteredItems" :key="item.id" type="button" :class="['item-tile', { 'item-tile--active': selectedItem.id === item.id }]" @click="store.selectItem(item.id)">
            <img :src="item.image" alt="" /><span><small>{{ item.category }}</small>{{ item.name }}</span><b aria-hidden="true">↗</b>
          </button>
        </div>
        <article class="item-detail" aria-live="polite">
          <div class="item-detail__visual"><img :src="selectedItem.image" :alt="`${selectedItem.name} item artwork`" /></div>
          <div class="item-detail__copy"><p class="eyebrow">{{ selectedItem.category }}</p><h3>{{ selectedItem.name }}</h3><p>{{ selectedItem.description }}</p><dl><div><dt>Field effect</dt><dd>{{ selectedItem.effect }}</dd></div><div><dt>Best use</dt><dd>{{ selectedItem.stat }}</dd></div></dl></div>
        </article>
      </div>
    </section>

    <section id="combinations" class="content-section routed-section" aria-labelledby="combinations-title">
      <SectionHeading title-id="combinations-title" kicker="04 / Workshop" title="Build beyond the pickup." intro="The sequel’s wider item loop includes combinations and card modifiers. This guide separates the system overview from unverified recipe specifics." />
      <div class="system-note"><span aria-hidden="true">✦</span><div><h3>How the workshop is represented</h3><p>Collected materials can feed item creation, while cards can modify a recipe. Exact inputs, names, and outcomes below are deliberately illustrative until checked against primary gameplay evidence.</p></div></div>
      <p class="sample-banner">V1 sample data · not a verified recipe list</p>
      <div class="recipe-grid">
        <article v-for="recipe in combinations" :key="recipe.parts" class="recipe-card"><div class="recipe-card__parts"><span>{{ recipe.parts.split(' + ')[0] }}</span><b>+</b><span>{{ recipe.parts.split(' + ')[1] }}</span></div><span class="recipe-card__arrow" aria-hidden="true">↓</span><div class="recipe-card__result"><small>Sample result</small><h3>{{ recipe.result }}</h3><p>{{ recipe.note }}</p></div></article>
      </div>
    </section>

    <section id="characters" class="content-section routed-section content-section--characters" aria-labelledby="characters-title">
      <SectionHeading title-id="characters-title" kicker="05 / Select player" title="Fourteen ways into the fray." intro="Choose a portrait to update the player file. Attributes are editorial impressions; move notation remains queued for gameplay verification." />
      <div class="character-select" role="list" aria-label="Playable characters">
        <button v-for="character in characters" :key="character.id" type="button" :aria-pressed="selectedCharacter.id === character.id" :class="['portrait', { 'portrait--active': selectedCharacter.id === character.id }]" :style="{ '--character-color': character.color }" @click="store.selectCharacter(character.id)"><span class="portrait__avatar" aria-hidden="true">{{ character.name.slice(0, 2).toUpperCase() }}</span><span>{{ character.name }}</span></button>
      </div>
      <article class="fighter-file" aria-live="polite">
        <div class="fighter-file__hero" :style="{ '--character-color': selectedCharacter.color }"><span aria-hidden="true">{{ selectedCharacter.name.slice(0, 2).toUpperCase() }}</span><small>Replaceable character art</small></div>
        <div class="fighter-file__copy"><p class="eyebrow">Player file</p><h3>{{ selectedCharacter.name }}</h3><p class="fighter-file__tagline">{{ selectedCharacter.tagline }}</p><h4>Background / history</h4><p>{{ selectedCharacter.history }}</p><h4>Editorial attributes</h4><ul class="attribute-list"><li v-for="attribute in selectedCharacter.attributes" :key="attribute">{{ attribute }}</li></ul></div>
        <div class="fighter-file__moves"><div><p class="eyebrow">Moves & play categories</p><h4>Field notes</h4></div><ol><li v-for="(move, index) in selectedCharacter.moves" :key="move"><span>0{{ index + 1 }}</span>{{ move }}</li></ol></div>
      </article>
    </section>

    <section id="levels" class="content-section routed-section content-section--levels" aria-labelledby="levels-title">
      <SectionHeading title-id="levels-title" kicker="06 / Arenas" title="Every stage is in motion." intro="Open an arena file to inspect its replaceable visual study. Use the arrow keys inside the gallery to move between views." />
      <div class="level-grid">
        <button v-for="(level, index) in levels" :key="level.id" class="level-card" type="button" @click="store.showLevel(level.id)"><img :src="level.image" :alt="`${level.name} replaceable level artwork`" /><span class="level-card__number">0{{ index + 1 }}</span><span class="level-card__copy"><b>{{ level.name }}</b><small>{{ level.description }}</small><em>Open arena file →</em></span></button>
      </div>
    </section>

    <section id="bosses" class="content-section routed-section content-section--bosses" aria-labelledby="bosses-title">
      <SectionHeading title-id="bosses-title" kicker="07 / Encounters" title="When the arena fights back." intro="Two established Power Stone 2 encounters, described cautiously and without padding the roster with uncertain names." />
      <div class="boss-grid">
        <article class="boss-card"><img src="/media/boss-pharaoh-walker-placeholder.svg" alt="Pharaoh Walker replaceable boss artwork placeholder" /><div><p class="eyebrow">Encounter 01</p><h3>Pharaoh Walker</h3><p>A large mechanical, pharaoh-styled encounter. Its scale and changing attack space reward watching hazards before committing to an approach.</p><span class="status-tag">Strategy details pending verification</span></div></article>
        <article class="boss-card"><img src="/media/boss-dr-erode-placeholder.svg" alt="Dr. Erode replaceable boss artwork placeholder" /><div><p class="eyebrow">Encounter 02</p><h3>Dr. Erode</h3><p>A climactic opponent associated with the game’s final stretch. This summary intentionally avoids asserting phase counts or exact patterns without verification.</p><span class="status-tag">Strategy details pending verification</span></div></article>
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
      <div class="about__copy"><SectionHeading title-id="about-title" kicker="10 / About Us" title="Made by fans, built to be corrected." intro="This independent, non-commercial field guide celebrates Power Stone 2 and gives players a clear, accessible place to learn. Provisional facts are visibly flagged for future verification." /><p>It is not affiliated with or endorsed by Capcom. Game names, characters, artwork, logos, music, footage, and all other related rights remain with their respective rights holders.</p><p class="about__promise">No hotlinked media. No invented certainty. A structure ready for sourced updates.</p></div>
    </section>
  </div>
  <LevelDialog />
</template>
