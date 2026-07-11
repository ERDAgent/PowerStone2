import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { essences, items, materials } from '@/data'
import { characters, levels } from '@/data/content'
import type { EntityId, EssenceRecord, ItemRecord, MaterialRecord } from '@/data/types'
import type { CharacterRecord, LevelRecord } from '@/data/world'

export type CatalogKind = 'all' | 'item' | 'material' | 'essence'
export type CatalogEntity =
  | { readonly kind: 'item'; readonly record: ItemRecord }
  | { readonly kind: 'material'; readonly record: MaterialRecord }
  | { readonly kind: 'essence'; readonly record: EssenceRecord }

const catalog: readonly CatalogEntity[] = [
  ...items.map(record => ({ kind: 'item', record }) as const),
  ...materials.map(record => ({ kind: 'material', record }) as const),
  ...essences.map(record => ({ kind: 'essence', record }) as const),
]

export const useGuideStore = defineStore('guide', () => {
  const selectedCharacterId = ref(characters[0].id)
  const selectedEntityId = ref<EntityId | null>(items[0].id)
  const catalogKind = ref<CatalogKind>('item')
  const itemCategory = ref('All')
  const itemQuery = ref('')
  const selectedLevelId = ref<LevelRecord['id']>(levels[0].id)
  const slideIndex = ref(0)

  const selectedCharacter = computed(() => characters.find(c => c.id === selectedCharacterId.value) ?? characters[0])
  const filteredEntities = computed(() => {
    const query = itemQuery.value.trim().toLocaleLowerCase()
    return catalog.filter(entity => {
      if (catalogKind.value !== 'all' && entity.kind !== catalogKind.value) return false
      if (entity.kind === 'item' && catalogKind.value === 'item' && itemCategory.value !== 'All' && (entity.record.category ?? 'Uncategorized') !== itemCategory.value) return false
      const numericNumber = String(Number(entity.record.number))
      return !query || entity.record.name.toLocaleLowerCase().includes(query) || entity.record.number === query || numericNumber === query
    })
  })
  const selectedEntity = computed(() => filteredEntities.value.find(entity => entity.record.id === selectedEntityId.value) ?? null)
  const selectedLevel = computed(() => levels.find(l => l.id === selectedLevelId.value) ?? levels[0])

  function reconcileSelection() {
    if (!filteredEntities.value.some(entity => entity.record.id === selectedEntityId.value)) selectedEntityId.value = filteredEntities.value[0]?.record.id ?? null
  }
  function selectCharacter(id: CharacterRecord['id']) { selectedCharacterId.value = id }
  function selectEntity(id: EntityId) { selectedEntityId.value = id }
  function setCatalogKind(kind: CatalogKind) {
    catalogKind.value = kind
    if (kind !== 'item') itemCategory.value = 'All'
  }
  function setCategory(category: string) { itemCategory.value = category }
  function setItemQuery(query: string) { itemQuery.value = query }
  function selectLevel(id: LevelRecord['id']) { selectedLevelId.value = id; slideIndex.value = 0 }
  function nextSlide() { slideIndex.value = (slideIndex.value + 1) % selectedLevel.value.slides.length }
  function previousSlide() { slideIndex.value = (slideIndex.value - 1 + selectedLevel.value.slides.length) % selectedLevel.value.slides.length }

  watch([catalogKind, itemCategory, itemQuery], reconcileSelection, { flush: 'sync' })

  return { selectedCharacterId, selectedEntityId, catalogKind, itemCategory, itemQuery, selectedLevelId, slideIndex, selectedCharacter, selectedEntity, filteredEntities, selectedLevel, selectCharacter, selectEntity, setCatalogKind, setCategory, setItemQuery, selectLevel, nextSlide, previousSlide }
})
