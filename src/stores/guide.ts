import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { characters, items, levels } from '@/data/content'

export const useGuideStore = defineStore('guide', () => {
  const selectedCharacterId = ref('falcon')
  const selectedItemId = ref(items[0].id)
  const itemCategory = ref('All')
  const openLevelId = ref<string | null>(null)
  const slideIndex = ref(0)

  const selectedCharacter = computed(() => characters.find(c => c.id === selectedCharacterId.value) ?? characters[0])
  const selectedItem = computed(() => items.find(i => i.id === selectedItemId.value) ?? items[0])
  const filteredItems = computed(() => itemCategory.value === 'All' ? items : items.filter(i => i.category === itemCategory.value))
  const openLevel = computed(() => levels.find(l => l.id === openLevelId.value) ?? null)

  function selectCharacter(id: string) { selectedCharacterId.value = id }
  function selectItem(id: string) { selectedItemId.value = id }
  function setCategory(category: string) {
    itemCategory.value = category
    const first = category === 'All' ? items[0] : items.find(i => i.category === category)
    if (first) selectedItemId.value = first.id
  }
  function showLevel(id: string) { openLevelId.value = id; slideIndex.value = 0 }
  function closeLevel() { openLevelId.value = null; slideIndex.value = 0 }
  function nextSlide() { if (openLevel.value) slideIndex.value = (slideIndex.value + 1) % openLevel.value.slides.length }
  function previousSlide() { if (openLevel.value) slideIndex.value = (slideIndex.value - 1 + openLevel.value.slides.length) % openLevel.value.slides.length }

  return { selectedCharacterId, selectedItemId, itemCategory, openLevelId, slideIndex, selectedCharacter, selectedItem, filteredItems, openLevel, selectCharacter, selectItem, setCategory, showLevel, closeLevel, nextSlide, previousSlide }
})
