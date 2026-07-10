export type DataSource = 'gameItems.json' | 'Items.xlsx' | 'List.rtf'
export type VerificationStatus = 'verified' | 'conflicting' | 'ambiguous'

export interface SourceEvidence {
  readonly source: DataSource
  readonly locator: string
  readonly value: string
}

export interface DataProvenance {
  readonly verification: VerificationStatus
  readonly evidence: readonly SourceEvidence[]
  readonly notes: readonly string[]
}

export interface MediaRecord {
  readonly media: string | null
}

export interface ItemRecord extends MediaRecord {
  readonly id: `item-${string}`
  readonly machineId: string
  readonly number: string
  readonly name: string
  readonly level: number
  readonly function: string
  readonly category: string | null
  readonly spreadsheetName: string | null
  readonly provenance: DataProvenance
}

export interface MaterialRecord extends MediaRecord {
  readonly id: `material-${string}`
  readonly machineId: string
  readonly number: string
  readonly name: string
  readonly type: string
  readonly spreadsheetName: string | null
  readonly rarity: string | null
  readonly worth: number | null
  readonly provenance: DataProvenance
}

export interface EssenceRecord extends MediaRecord {
  readonly id: `essence-${string}`
  readonly machineId: string
  readonly number: string
  readonly name: string
  readonly provenance: DataProvenance
}

export type EntityId = ItemRecord['id'] | MaterialRecord['id'] | EssenceRecord['id']
export type IngredientKind = 'item' | 'material' | 'essence'

export interface RecipeIngredient {
  readonly id: EntityId
  readonly kind: IngredientKind
  readonly quantity: number
}

export interface RecipeRecord {
  readonly id: `recipe-${string}`
  readonly resultId: ItemRecord['id']
  readonly ingredients: readonly RecipeIngredient[]
  readonly sourceFormula: string
  readonly provenance: DataProvenance
}

export interface RecipeExtractionRow {
  readonly itemNumber: number
  readonly displayedOrdinal: number
  readonly rawFormula: string
  readonly normalizedRawFormula: string
  readonly locator: string
  readonly occurrence: number
  readonly status: 'resolved' | 'ambiguous'
  readonly recipeId: RecipeRecord['id'] | null
  readonly notes: readonly string[]
}

export interface RecipeExtractionManifest {
  readonly source: 'existing-resources/List.rtf'
  readonly sourceSha256: string
  readonly definition: string
  readonly rows: readonly RecipeExtractionRow[]
}
