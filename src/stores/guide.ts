import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { characters, items, levels } from '@/data/content'
import type { ItemRecord } from '@/data/types'
import type { CharacterRecord, LevelRecord } from '@/data/world'

export const useGuideStore = defineStore('guide', () => {
  const selectedCharacterId = ref(characters[0].id)
  const selectedItemId = ref(items[0].id)
  const itemCategory = ref('All')
  const itemQuery = ref('')
  const openLevelId = ref<LevelRecord['id'] | null>(null)
  const slideIndex = ref(0)

  const selectedCharacter = computed(() => characters.find(c => c.id === selectedCharacterId.value) ?? characters[0])
  const selectedItem = computed(() => items.find(i => i.id === selectedItemId.value) ?? items[0])
  const filteredItems = computed(() => {
    const query = itemQuery.value.trim().toLocaleLowerCase()
    return items.filter(item =>
      (itemCategory.value === 'All' || (item.category ?? 'Uncategorized') === itemCategory.value)
      && (!query || item.name.toLocaleLowerCase().includes(query) || item.number.includes(query)),
    )
  })
  const openLevel = computed(() => levels.find(l => l.id === openLevelId.value) ?? null)

  function selectCharacter(id: CharacterRecord['id']) { selectedCharacterId.value = id }
  function selectItem(id: ItemRecord['id']) { selectedItemId.value = id }
  function setCategory(category: string) {
    itemCategory.value = category
    const first = filteredItems.value[0]
    if (first) selectedItemId.value = first.id
  }
  function setItemQuery(query: string) { itemQuery.value = query }
  function showLevel(id: LevelRecord['id']) { openLevelId.value = id; slideIndex.value = 0 }
  function closeLevel() { openLevelId.value = null; slideIndex.value = 0 }
  function nextSlide() { if (openLevel.value) slideIndex.value = (slideIndex.value + 1) % openLevel.value.slides.length }
  function previousSlide() { if (openLevel.value) slideIndex.value = (slideIndex.value - 1 + openLevel.value.slides.length) % openLevel.value.slides.length }

  return { selectedCharacterId, selectedItemId, itemCategory, itemQuery, openLevelId, slideIndex, selectedCharacter, selectedItem, filteredItems, openLevel, selectCharacter, selectItem, setCategory, setItemQuery, showLevel, closeLevel, nextSlide, previousSlide }
})
