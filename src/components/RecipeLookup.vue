<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getEntityById, items, recipeExtraction, recipes } from '@/data'
import type { EntityId, ItemRecord } from '@/data/types'
import { useGuideStore } from '@/stores/guide'
import { itemTileId } from '@/utils/dom'
import { withSoftHyphens } from '@/utils/text'

const router = useRouter()
const store = useGuideStore()
const query = ref('')
const selectedId = ref<ItemRecord['id'] | null>(null)
const activeIndex = ref(-1)
const input = ref<HTMLInputElement | null>(null)
const detailPanel = ref<HTMLElement | null>(null)
const searchPanel = ref<HTMLElement | null>(null)

const matches = computed(() => {
  const term = query.value.trim().toLocaleLowerCase()
  if (!term) return items
  return items.filter(item => item.name.toLocaleLowerCase().includes(term) || item.number === term || String(Number(item.number)) === term)
})
const selected = computed(() => items.find(item => item.id === selectedId.value) ?? null)
const selectedRecipes = computed(() => selected.value
  ? recipes.filter(recipe => recipe.resultId === selected.value!.id)
  : [])
const ambiguousRows = computed(() => selected.value
  ? recipeExtraction.rows.filter(row => row.itemNumber === Number(selected.value!.number) && row.status === 'ambiguous')
  : [])

watch(query, () => { activeIndex.value = matches.value.length ? 0 : -1 })

function select(item: ItemRecord) {
  selectedId.value = item.id
  activeIndex.value = matches.value.findIndex(match => match.id === item.id)
}

function selectByClick(item: ItemRecord, event: MouseEvent) {
  select(item)
  ;(event.currentTarget as HTMLElement).focus()
  if (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 980px)').matches) {
    nextTick(() => detailPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
}

function scrollToSearch() {
  searchPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!matches.value.length) return
    const direction = event.key === 'ArrowDown' ? 1 : -1
    activeIndex.value = (activeIndex.value + direction + matches.value.length) % matches.value.length
  } else if (event.key === 'Enter' && activeIndex.value >= 0) {
    event.preventDefault()
    const item = matches.value[activeIndex.value]
    if (item) {
      select(item)
      nextTick(() => input.value?.focus())
    }
  } else if (event.key === 'Escape') {
    query.value = ''
  }
}

function clearInput() {
  query.value = ''
  selectedId.value = null
  nextTick(() => { activeIndex.value = -1; input.value?.focus() })
}

function optionId(item: ItemRecord) { return `recipe-option-${item.id}` }

function goToEntityInCatalog(id: EntityId) {
  router.push('/items#catalog-tabs')
  store.viewEntityInCatalog(id)
  nextTick(() => {
    document.getElementById(itemTileId(id))?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function selectItem(id: ItemRecord['id']) {
  const item = items.find(candidate => candidate.id === id)
  if (!item) return
  select(item)
  nextTick(() => {
    document.getElementById(optionId(item))?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

defineExpose({ selectItem })
</script>

<template>
  <div id="recipe-lookup" class="recipe-lookup">
    <div ref="searchPanel" class="recipe-lookup__search">
      <label for="recipe-search">Search Items</label>
      <div class="search-field">
        <input
          id="recipe-search"
          ref="input"
          v-model="query"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="recipe-results"
          :aria-activedescendant="activeIndex >= 0 && matches[activeIndex] ? optionId(matches[activeIndex]) : undefined"
          :aria-expanded="matches.length > 0"
          placeholder="Search 121 Items"
          @keydown="onKeydown"
        />
        <button v-if="query" type="button" class="search-field__clear" aria-label="Clear search" @click="clearInput">×</button>
      </div>
      <p class="recipe-lookup__hint">Use ↑ and ↓ to browse; Enter selects. Materials and cards are ingredients only.</p>
      <div id="recipe-results" class="recipe-options" role="listbox" aria-label="Matching item results">
        <button
          v-for="(item, index) in matches"
          :id="optionId(item)"
          :key="item.id"
          type="button"
          role="option"
          :aria-selected="selected?.id === item.id"
          :class="['recipe-option', { 'recipe-option--active': selected?.id === item.id }]"
          @mouseenter="activeIndex = index"
          @click="selectByClick(item, $event)"
        >
          <img v-if="item.media" :src="item.media" alt="" />
          <span v-else class="entity-fallback" aria-hidden="true">{{ item.name.slice(0, 2) }}</span>
          <span><b>{{ item.name }}</b><small>Item {{ Number(item.number) }} · {{ item.category ?? 'Uncategorized' }}</small></span>
        </button>
        <p v-if="!matches.length" class="recipe-empty" role="status">No Items Found</p>
      </div>
    </div>

    <div ref="detailPanel" class="recipe-lookup__detail" aria-live="polite">
      <button
        type="button"
        class="icon-button recipe-lookup__back-to-search"
        aria-label="Back to recipe search"
        @click="scrollToSearch"
      >↑</button>
      <div v-if="!selected" class="recipe-empty recipe-empty--detail">
        <h3>Choose an item result</h3>
        <p>Search the canonical item catalog to see its documented alternatives.</p>
      </div>
      <template v-else>
        <header class="recipe-result-heading">
          <img v-if="selected.media" :src="selected.media" :alt="`${selected.name} artwork`" />
          <span v-else class="entity-fallback" aria-hidden="true">{{ selected.name.slice(0, 2) }}</span>
          <div class="recipe-result-heading__copy"><p class="eyebrow">{{ selected.category ?? 'Item' }} · #{{ selected.number }}</p><h3>{{ withSoftHyphens(selected.name) }}</h3></div>
        </header>
        <p v-if="selected.provenance.recipeNotes.length" class="data-note recipe-result-note">{{ selected.provenance.recipeNotes.join(' ') }}</p>
        <aside v-if="ambiguousRows.length" class="recipe-warning" role="note">
          {{ ambiguousRows.length }} additional {{ ambiguousRows.length === 1 ? 'formula is' : 'formulas are' }} ambiguous in the extraction manifest and {{ ambiguousRows.length === 1 ? 'is' : 'are' }} not shown as valid recipes.
        </aside>
        <div v-if="selectedRecipes.length" class="resolved-recipes">
          <article v-for="(recipe, index) in selectedRecipes" :key="recipe.id" class="resolved-recipe">
            <h4>Recipe {{ index + 1 }}</h4>
            <div class="resolved-recipe__formula">
              <template v-for="(ingredient, ingredientIndex) in recipe.ingredients" :key="`${recipe.id}-${ingredient.id}`">
                <span v-if="ingredientIndex" class="formula-symbol" aria-hidden="true">+</span>
                <div class="recipe-entity">
                  <button v-if="ingredient.kind === 'item'" type="button" class="recipe-entity__link recipe-entity__link--recipe" :aria-label="`Select ${getEntityById(ingredient.id)?.name} in the recipe results list`" @click="selectItem(ingredient.id as ItemRecord['id'])">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                  </button>
                  <button type="button" class="recipe-entity__link recipe-entity__link--catalog" :aria-label="`View ${getEntityById(ingredient.id)?.name} in the items catalog`" @click="goToEntityInCatalog(ingredient.id)">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                  </button>
                  <img v-if="getEntityById(ingredient.id)?.media" :src="getEntityById(ingredient.id)!.media!" alt="" />
                  <span v-else class="entity-fallback" aria-hidden="true">{{ getEntityById(ingredient.id)?.name.slice(0, 2) }}</span>
                  <b>{{ getEntityById(ingredient.id)?.name }}</b><small v-if="ingredient.quantity > 1">×{{ ingredient.quantity }}</small>
                </div>
              </template>
              <span class="formula-symbol" aria-hidden="true">→</span>
              <div class="recipe-entity recipe-entity--result">
                <button type="button" class="recipe-entity__link recipe-entity__link--recipe" :aria-label="`Select ${selected.name} in the recipe results list`" @click="selectItem(selected.id)">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                </button>
                <button type="button" class="recipe-entity__link recipe-entity__link--catalog" :aria-label="`View ${selected.name} in the items catalog`" @click="goToEntityInCatalog(selected.id)">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                </button>
                <img v-if="selected.media" :src="selected.media" alt="" />
                <span v-else class="entity-fallback" aria-hidden="true">{{ selected.name.slice(0, 2) }}</span>
                <b>{{ selected.name }}</b>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="recipe-empty recipe-empty--detail">
          <h3>No resolved recipe documented</h3>
          <p>The database has no confirmed formula for {{ selected.name }}.</p>
        </div>
      </template>
    </div>
  </div>
</template>
