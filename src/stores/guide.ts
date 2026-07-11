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
  const catalogKind = ref<CatalogKind>('all')
  const itemCategory = ref('All')
  const itemQuery = ref('')
  const openLevelId = ref<LevelRecord['id'] | null>(null)
  const slideIndex = ref(0)
  const selectedMoveIndex = ref(0)
  const selectedSpecialIndex = ref(0)
  const openBossId = ref<BossRecord['id'] | null>(null)
  const lightboxImage = ref<LightboxImage | null>(null)

  const selectedCharacter = computed(() => characters.find(c => c.id === selectedCharacterId.value) ?? characters[0])
  const selectedMove = computed(() => selectedCharacter.value.moveList[selectedMoveIndex.value] ?? selectedCharacter.value.moveList[0] ?? null)
  const selectedSpecial = computed(() => selectedCharacter.value.specials[selectedSpecialIndex.value] ?? selectedCharacter.value.specials[0] ?? null)
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
  const openLevel = computed(() => levels.find(l => l.id === openLevelId.value) ?? null)
  const openBoss = computed(() => bosses.find(b => b.id === openBossId.value) ?? null)

  function reconcileSelection() {
    if (!filteredEntities.value.some(entity => entity.record.id === selectedEntityId.value)) selectedEntityId.value = filteredEntities.value[0]?.record.id ?? null
  }
  function selectCharacter(id: CharacterRecord['id']) { selectedCharacterId.value = id; selectedMoveIndex.value = 0; selectedSpecialIndex.value = 0 }
  function selectMove(index: number) { selectedMoveIndex.value = index }
  function selectSpecial(index: number) { selectedSpecialIndex.value = index }
  function selectEntity(id: EntityId) { selectedEntityId.value = id }
  function setCatalogKind(kind: CatalogKind) {
    catalogKind.value = kind
    if (kind !== 'item') itemCategory.value = 'All'
  }
  function setCategory(category: string) { itemCategory.value = category }
  function setItemQuery(query: string) { itemQuery.value = query }
  function showLevel(id: LevelRecord['id']) { openLevelId.value = id; slideIndex.value = 0 }
  function closeLevel() { openLevelId.value = null; slideIndex.value = 0 }
  function nextSlide() { if (openLevel.value) slideIndex.value = (slideIndex.value + 1) % openLevel.value.slides.length }
  function previousSlide() { if (openLevel.value) slideIndex.value = (slideIndex.value - 1 + openLevel.value.slides.length) % openLevel.value.slides.length }
  function showBoss(id: BossRecord['id']) { openBossId.value = id }
  function closeBoss() { openBossId.value = null }
  function openLightbox(image: LightboxImage) { lightboxImage.value = image }
  function closeLightbox() { lightboxImage.value = null }

  watch([catalogKind, itemCategory, itemQuery], reconcileSelection, { flush: 'sync' })

  return { selectedCharacterId, selectedEntityId, catalogKind, itemCategory, itemQuery, openLevelId, slideIndex, selectedMoveIndex, selectedSpecialIndex, openBossId, lightboxImage, selectedCharacter, selectedEntity, selectedMove, selectedSpecial, filteredEntities, openLevel, openBoss, selectCharacter, selectEntity, selectMove, selectSpecial, setCatalogKind, setCategory, setItemQuery, showLevel, closeLevel, nextSlide, previousSlide, showBoss, closeBoss, openLightbox, closeLightbox }
})
