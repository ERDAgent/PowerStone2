export const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'game-overview', label: 'About the Game' },
  { id: 'how-to-play', label: 'How to Play' },
  { id: 'items', label: 'Items' },
  { id: 'combinations', label: 'Combinations' },
  { id: 'characters', label: 'Characters' },
  { id: 'levels', label: 'Levels' },
  { id: 'bosses', label: 'Bosses' },
  { id: 'unlocks', label: 'Unlocks' },
  { id: 'history', label: 'History' },
  { id: 'about', label: 'About Us' },
] as const

export type SectionId = typeof sections[number]['id']

// Keep navigation copy here; entity records live only in their canonical modules.
export { items } from '@/data/index'
export { bosses, characters, levels } from '@/data/world'
export type { ItemRecord as Item } from '@/data/types'
export type { BossRecord, CharacterRecord as Character, LevelRecord as Level } from '@/data/world'
