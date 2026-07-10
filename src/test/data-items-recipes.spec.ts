import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  essences,
  getEntityById,
  getItemByNumber,
  items,
  materials,
  recipeExtraction,
  recipes,
} from '@/data'

const projectRoot = process.cwd()
const rtfPath = `${projectRoot}/existing-resources/List.rtf`

function decodeRtf(buffer: Buffer) {
  return buffer.toString('latin1')
    .replace(/\0/g, '')
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\par\b/g, '\n')
    .replace(/\\tab\b/g, '\t')
    .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
    .replace(/\\([{}\\])/g, '$1')
    .replace(/[{}]/g, '')
}

function independentlyExtractLocators(buffer: Buffer) {
  const lines = decodeRtf(buffer).split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const locators: string[] = []
  let itemNumber: number | undefined
  let inRecipeRegion = false

  for (const line of lines) {
    const heading = /^Item#(\d+)$/i.exec(line)
    if (heading) {
      itemNumber = Number(heading[1])
      inRecipeRegion = true
      continue
    }
    if (itemNumber === undefined) continue
    if (/^(Other Ways:|Buy:|Description:)/i.test(line)) {
      inRecipeRegion = false
      continue
    }
    const numbered = inRecipeRegion ? /^(\d+)\.\s*(.+)$/.exec(line) : null
    if (numbered) {
      const formula = numbered[2].replace(/\s+/g, ' ').trim()
      locators.push(`item-${itemNumber}|${Number(numbered[1])}|${formula}`)
    }
  }
  return locators
}

describe('canonical item data', () => {
  it('covers every machine catalog record with unique stable IDs and numbers', () => {
    expect(items).toHaveLength(121)
    expect(materials).toHaveLength(22)
    expect(essences).toHaveLength(9)

    for (const collection of [items, materials, essences]) {
      expect(new Set(collection.map(record => record.id)).size).toBe(collection.length)
      expect(new Set(collection.map(record => record.number)).size).toBe(collection.length)
    }
    expect(getItemByNumber(1)?.id).toBe('item-gun')
    expect(essences.find(record => record.name === 'Special Card')?.id).toBe('essence-special')
  })

  it('declares only media files that exist and preserves absent art as null', () => {
    const records = [...items, ...materials, ...essences]
    for (const record of records) {
      if (record.media !== null) expect(existsSync(`${projectRoot}/public${record.media}`), record.media).toBe(true)
    }
    expect(items.filter(record => record.media === null)).toHaveLength(24)
    expect(materials.filter(record => record.media === null)).toHaveLength(9)
    expect(essences.every(record => record.media !== null)).toBe(true)
  })

  it('retains source disagreements in provenance', () => {
    const homingMissile = getItemByNumber(8)!
    expect(homingMissile.name).toBe('Homing Missile')
    expect(homingMissile.spreadsheetName).toBe('Marking Missile')
    expect(homingMissile.provenance.verification).toBe('conflicting')
    expect(homingMissile.provenance.notes.join(' ')).toContain('Marking Missile')

    const oil = materials.find(record => record.id === 'material-oil')!
    expect(oil.name).toBe('Oil')
    expect(oil.spreadsheetName).toBe('Fire Material')
    expect(oil.provenance.evidence.map(entry => entry.source)).toEqual(['gameItems.json', 'Items.xlsx'])
  })
})

describe('recipe integrity and extraction coverage', () => {
  it('uses valid entity references and item results', () => {
    const recipeIds = new Set(recipes.map(recipe => recipe.id))
    expect(recipeIds.size).toBe(recipes.length)
    for (const recipe of recipes) {
      expect(items.some(item => item.id === recipe.resultId), recipe.id).toBe(true)
      for (const ingredient of recipe.ingredients) {
        expect(getEntityById(ingredient.id), `${recipe.id}: ${ingredient.id}`).toBeDefined()
        expect(ingredient.id.startsWith(`${ingredient.kind}-`)).toBe(true)
        expect(ingredient.quantity).toBeGreaterThan(0)
      }
    }
  })

  it('keeps representative material, repeated-item, and essence recipes', () => {
    expect(recipes.find(recipe => recipe.id === 'recipe-001-02-01')).toMatchObject({
      resultId: 'item-gun',
      ingredients: [
        { id: 'material-iron', kind: 'material', quantity: 1 },
        { id: 'material-gunpowder', kind: 'material', quantity: 1 },
      ],
    })
    expect(recipes.find(recipe => recipe.id === 'recipe-012-04-01')).toMatchObject({
      resultId: 'item-powerfulbuster',
      ingredients: [
        { id: 'item-gun', quantity: 2 },
        { id: 'essence-special', kind: 'essence', quantity: 1 },
      ],
    })
  })

  it('accounts reproducibly for every resolved and ambiguous paragraph', () => {
    expect(recipeExtraction.rows).toHaveLength(469)
    expect(recipeExtraction.rows.filter(row => row.status === 'resolved')).toHaveLength(446)
    expect(recipeExtraction.rows.filter(row => row.status === 'ambiguous')).toHaveLength(23)
    expect(recipes).toHaveLength(446)
    expect(recipeExtraction.rows.filter(row => row.status === 'resolved').map(row => row.recipeId)).toEqual(recipes.map(recipe => recipe.id))
    expect(recipeExtraction.rows.find(row => row.locator === 'item-10|2|Beam Gun Gun')).toMatchObject({
      status: 'ambiguous',
      recipeId: null,
    })
  })

  it('independently decodes RTF boundaries and pins the evidence checksum', () => {
    const source = readFileSync(rtfPath)
    const checksum = createHash('sha256').update(source).digest('hex')
    expect(checksum).toBe(recipeExtraction.sourceSha256)
    expect(checksum).toBe('237e7d26fc5d414e358c8e71177013cdf38ce29c86e49978d261bf0f2ad478b6')

    const sourceLocators = independentlyExtractLocators(source)
    const manifestLocators = recipeExtraction.rows.map(row => row.locator)
    expect(sourceLocators).toHaveLength(recipeExtraction.rows.length)
    expect(manifestLocators).toEqual(sourceLocators)
    expect(new Set(manifestLocators).size).toBe(manifestLocators.length)
  })
})
