import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { essences, items, materials } from '@/data'
import { bosses, characters, levels } from '@/data/content'
import type { EntityId, EssenceRecord, ItemRecord, MaterialRecord } from '@/data/types'
import type { BossRecord, CharacterRecord, LevelRecord } from '@/data/world'

export interface LightboxImage {
  readonly src: string
  readonly alt: string
}

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
  const itemCategory = ref('All Functions')
  const itemLevel = ref<number | 'All Levels'>('All Levels')
  const materialRarity = ref<string | 'All Rarities'>('All Rarities')
  const itemQuery = ref('')
  const selectedLevelId = ref<LevelRecord['id']>(levels[0].id)
  const selectedMoveIndex = ref(0)
  const selectedSpecialIndex = ref(0)
  const selectedBossId = ref<BossRecord['id']>(bosses[0].id)
  const lightboxImage = ref<LightboxImage | null>(null)

  const selectedCharacter = computed(() => characters.find(c => c.id === selectedCharacterId.value) ?? characters[0])
  const selectedMove = computed(() => selectedCharacter.value.moveList[selectedMoveIndex.value] ?? selectedCharacter.value.moveList[0] ?? null)
  const selectedSpecial = computed(() => selectedCharacter.value.specials[selectedSpecialIndex.value] ?? selectedCharacter.value.specials[0] ?? null)
  const filteredEntities = computed(() => {
    const query = itemQuery.value.trim().toLocaleLowerCase()
    return catalog.filter(entity => {
      if (catalogKind.value !== 'all' && entity.kind !== catalogKind.value) return false
      if (entity.kind === 'item' && catalogKind.value === 'item' && itemCategory.value !== 'All Functions' && (entity.record.category ?? 'Uncategorized') !== itemCategory.value) return false
      if (entity.kind === 'item' && catalogKind.value === 'item' && itemLevel.value !== 'All Levels' && entity.record.level !== itemLevel.value) return false
      if (entity.kind === 'material' && catalogKind.value === 'material' && materialRarity.value !== 'All Rarities' && entity.record.rarity !== materialRarity.value) return false
      const numericNumber = String(Number(entity.record.number))
      return !query || entity.record.name.toLocaleLowerCase().includes(query) || entity.record.number === query || numericNumber === query
    })
  })
  const selectedEntity = computed(() => filteredEntities.value.find(entity => entity.record.id === selectedEntityId.value) ?? null)
  const selectedLevel = computed(() => levels.find(l => l.id === selectedLevelId.value) ?? levels[0])
  const selectedBoss = computed(() => bosses.find(b => b.id === selectedBossId.value) ?? bosses[0])

  function reconcileSelection() {
    if (!filteredEntities.value.some(entity => entity.record.id === selectedEntityId.value)) selectedEntityId.value = filteredEntities.value[0]?.record.id ?? null
  }
  function selectCharacter(id: CharacterRecord['id']) { selectedCharacterId.value = id; selectedMoveIndex.value = 0; selectedSpecialIndex.value = 0 }
  function selectMove(index: number) { selectedMoveIndex.value = index }
  function selectSpecial(index: number) { selectedSpecialIndex.value = index }
  function selectEntity(id: EntityId) { selectedEntityId.value = id }
  function viewEntityInCatalog(id: EntityId) {
    if (!catalog.some(candidate => candidate.record.id === id)) return
    catalogKind.value = 'all'
    itemCategory.value = 'All Functions'
    itemLevel.value = 'All Levels'
    materialRarity.value = 'All Rarities'
    itemQuery.value = ''
    selectedEntityId.value = id
  }
  function setCatalogKind(kind: CatalogKind) {
    catalogKind.value = kind
    if (kind !== 'item') {
      itemCategory.value = 'All Functions'
      itemLevel.value = 'All Levels'
    }
    if (kind !== 'material') {
      materialRarity.value = 'All Rarities'
    }
  }
  function setCategory(category: string) { itemCategory.value = category }
  function setItemLevel(level: number | 'All Levels') { itemLevel.value = level }
  function setMaterialRarity(rarity: string | 'All Rarities') { materialRarity.value = rarity }
  function setItemQuery(query: string) { itemQuery.value = query }
  function selectLevel(id: LevelRecord['id']) { selectedLevelId.value = id }
  function selectBoss(id: BossRecord['id']) { selectedBossId.value = id }
  function openLightbox(image: LightboxImage) { lightboxImage.value = image }
  function closeLightbox() { lightboxImage.value = null }

  watch([catalogKind, itemCategory, itemLevel, materialRarity, itemQuery], reconcileSelection, { flush: 'sync' })

  return { selectedCharacterId, selectedEntityId, catalogKind, itemCategory, itemLevel, materialRarity, itemQuery, selectedLevelId, selectedMoveIndex, selectedSpecialIndex, selectedBossId, lightboxImage, selectedCharacter, selectedEntity, selectedMove, selectedSpecial, filteredEntities, selectedLevel, selectedBoss, selectCharacter, selectEntity, viewEntityInCatalog, selectMove, selectSpecial, setCatalogKind, setCategory, setItemLevel, setMaterialRarity, setItemQuery, selectLevel, selectBoss, openLightbox, closeLightbox }
})
