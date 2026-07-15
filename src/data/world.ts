import characterData from './characters.json'
import levelData from './levels.json'
import bossData from './bosses.json'
import type { DataProvenance, MediaRecord } from './types'

export type MoveType = 'standard' | 'unique'
export type CharacteristicLevel = 'low' | 'medium' | 'high'

export interface MoveRecord {
  readonly name: string
  readonly type: MoveType
  readonly video: string
  readonly poster: string
}

export interface SpecialMoveRecord {
  readonly name: string
  readonly video: string
  readonly poster: string
}

export interface CharacterCharacteristics {
  readonly strength: CharacteristicLevel
  readonly throwDistance: CharacteristicLevel
  readonly damage: CharacteristicLevel
  readonly toughness: CharacteristicLevel
  readonly speed: CharacteristicLevel
}

export interface CharacterRecord extends MediaRecord {
  readonly id: `character-${string}`
  readonly name: string
  readonly tagline: string
  readonly playstyle: string
  readonly keywords: readonly string[]
  readonly moves: readonly string[]
  readonly moveList: readonly MoveRecord[]
  readonly specials: readonly SpecialMoveRecord[]
  readonly characteristics: CharacterCharacteristics
  readonly color: string
  readonly portrait: string | null
  readonly availability: readonly ('dreamcast' | 'PSP' | 'Arcade')[]
  readonly provenance: DataProvenance
}

export type LevelStageCount = 1 | 3 | 4
export type LevelMode = 'PVP' | 'PVE'

export interface LevelRecord {
  readonly id: `level-${string}`
  readonly name: string
  readonly description: string
  readonly media: string
  readonly slides: readonly string[]
  readonly stageCount: LevelStageCount
  readonly modes: readonly LevelMode[]
  readonly provenance: DataProvenance
}

export interface BossRecord extends MediaRecord {
  readonly id: `boss-${string}`
  readonly name: string
  readonly description: string
  readonly status: string
  readonly arenaMedia?: string | null
  readonly provenance: DataProvenance
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}

export const characters = deepFreeze(characterData as CharacterRecord[])
export const levels = deepFreeze(levelData as LevelRecord[])
export const bosses = deepFreeze(bossData as BossRecord[])

const characterLookup = new Map(characters.map((record) => [record.id, record]))
const levelLookup = new Map(levels.map((record) => [record.id, record]))
const bossLookup = new Map(bosses.map((record) => [record.id, record]))

export const getCharacterById = (id: CharacterRecord['id']) => characterLookup.get(id)
export const getLevelById = (id: LevelRecord['id']) => levelLookup.get(id)
export const getBossById = (id: BossRecord['id']) => bossLookup.get(id)
