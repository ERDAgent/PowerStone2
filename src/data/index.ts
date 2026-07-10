import itemData from './items.json'
import materialData from './materials.json'
import essenceData from './essences.json'
import recipeData from './recipes.json'
import extractionData from './recipe-extraction.json'
import type {
  EntityId,
  EssenceRecord,
  ItemRecord,
  MaterialRecord,
  RecipeExtractionManifest,
  RecipeRecord,
} from './types'

export type * from './types'

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}

export const items = deepFreeze(itemData as ItemRecord[])
export const materials = deepFreeze(materialData as MaterialRecord[])
export const essences = deepFreeze(essenceData as EssenceRecord[])
export const recipes = deepFreeze(recipeData as RecipeRecord[])
export const recipeExtraction = deepFreeze(extractionData as RecipeExtractionManifest)

const itemLookup = new Map(items.map((item) => [item.id, item]))
const itemNumberLookup = new Map(items.map((item) => [item.number, item]))
const materialLookup = new Map(materials.map((material) => [material.id, material]))
const essenceLookup = new Map(essences.map((essence) => [essence.id, essence]))
const recipeLookup = new Map(recipes.map((recipe) => [recipe.id, recipe]))
const entityLookup = new Map<EntityId, ItemRecord | MaterialRecord | EssenceRecord>([
  ...items.map((item) => [item.id, item] as const),
  ...materials.map((material) => [material.id, material] as const),
  ...essences.map((essence) => [essence.id, essence] as const),
])

export const getItemById = (id: ItemRecord['id']) => itemLookup.get(id)
export const getItemByNumber = (number: string | number) => itemNumberLookup.get(String(number).padStart(3, '0'))
export const getMaterialById = (id: MaterialRecord['id']) => materialLookup.get(id)
export const getEssenceById = (id: EssenceRecord['id']) => essenceLookup.get(id)
export const getRecipeById = (id: RecipeRecord['id']) => recipeLookup.get(id)
export const getEntityById = (id: EntityId) => entityLookup.get(id)
export const getRecipesForResult = (id: ItemRecord['id']) => recipes.filter((recipe) => recipe.resultId === id)
