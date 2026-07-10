<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { getEntityById, items, recipeExtraction, recipes } from '@/data'
import type { ItemRecord } from '@/data/types'

const query = ref('')
const selectedId = ref<ItemRecord['id'] | null>(null)
const activeIndex = ref(-1)
const input = ref<HTMLInputElement | null>(null)

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
  query.value = item.name
  activeIndex.value = matches.value.findIndex(match => match.id === item.id)
  nextTick(() => input.value?.focus())
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
    if (item) select(item)
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
</script>

<template>
  <div class="recipe-lookup">
    <div class="recipe-lookup__search">
      <label for="recipe-search">Find an item result</label>
      <div class="recipe-search-controls">
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
          placeholder="Search 121 items by name or number"
          @keydown="onKeydown"
        />
        <button type="button" class="button button--ghost recipe-clear" @click="clearInput">Clear input</button>
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
          :class="['recipe-option', { 'recipe-option--active': activeIndex === index }]"
          @mouseenter="activeIndex = index"
          @click="select(item)"
        >
          <img v-if="item.media" :src="item.media" alt="" />
          <span v-else class="entity-fallback" aria-hidden="true">{{ item.name.slice(0, 2) }}</span>
          <span><b>{{ item.name }}</b><small>Item {{ Number(item.number) }} · {{ item.category ?? 'Uncategorized' }}</small></span>
        </button>
        <p v-if="!matches.length" class="recipe-empty" role="status">No items match “{{ query }}”. Try another name or catalog number.</p>
      </div>
    </div>

    <div class="recipe-lookup__detail" aria-live="polite">
      <div v-if="!selected" class="recipe-empty recipe-empty--detail">
        <h3>Choose an item result</h3>
        <p>Search the canonical item catalog to see its documented alternatives.</p>
      </div>
      <template v-else>
        <header class="recipe-result-heading">
          <img v-if="selected.media" :src="selected.media" :alt="`${selected.name} artwork`" />
          <span v-else class="entity-fallback" aria-hidden="true">{{ selected.name.slice(0, 2) }}</span>
          <div><p class="eyebrow">{{ selected.category ?? 'Item' }} · #{{ selected.number }}</p><h3>{{ selected.name }}</h3></div>
        </header>
        <p v-if="selected.provenance.notes.length" class="data-note recipe-result-note">{{ selected.provenance.notes.join(' ') }}</p>
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
                  <img v-if="getEntityById(ingredient.id)?.media" :src="getEntityById(ingredient.id)!.media!" alt="" />
                  <span v-else class="entity-fallback" aria-hidden="true">{{ getEntityById(ingredient.id)?.name.slice(0, 2) }}</span>
                  <b>{{ getEntityById(ingredient.id)?.name }}</b><small v-if="ingredient.quantity > 1">×{{ ingredient.quantity }}</small>
                </div>
              </template>
              <span class="formula-symbol" aria-hidden="true">→</span>
              <div class="recipe-entity recipe-entity--result">
                <img v-if="selected.media" :src="selected.media" alt="" />
                <span v-else class="entity-fallback" aria-hidden="true">{{ selected.name.slice(0, 2) }}</span>
                <b>{{ selected.name }}</b>
              </div>
            </div>
            <p class="recipe-provenance"><b>Source:</b> {{ recipe.sourceFormula }} · {{ recipe.provenance.evidence[0]?.locator }}<template v-if="recipe.provenance.notes.length"> · {{ recipe.provenance.notes.join(' ') }}</template></p>
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
