import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  bosses,
  characters,
  getBossById,
  getCharacterById,
  getLevelById,
  levels,
} from '@/data/world'
import type { DataProvenance } from '@/data/types'

const projectRoot = process.cwd()
const records = [...characters, ...levels, ...bosses]

const expectedCharacterCopy = [
  ['Falcon', 'A daring aerial adventurer and the guide’s default fighter.', 'Falcon returns to the hunt with a bold, mobile style and a taste for treasure.'],
  ['Wang-Tang', 'An energetic martial artist built around direct momentum.', 'Wang-Tang brings disciplined training and irrepressible confidence to the fray.'],
  ['Ryoma', 'A wandering swordsman with measured reach.', 'Ryoma’s traditional bearing contrasts with the chaos of transforming arenas.'],
  ['Rouge', 'A fortune-teller whose presentation leans into fire and mystery.', 'Rouge enters the contest with poise, spectacle, and an enigmatic past.'],
  ['Ayame', 'A nimble performer with a fast, evasive identity.', 'Ayame balances her stagecraft with the agility needed for the stone hunt.'],
  ['Gunrock', 'A huge miner whose identity emphasizes raw force.', 'Gunrock’s working-life roots and massive frame make him an imposing contender.'],
  ['Galuda', 'A proud warrior whose identity emphasizes strength and duty.', 'Galuda carries a protective spirit into every arena.'],
  ['Jack', 'A mysterious, bladed combatant with an unsettling silhouette.', 'Jack’s motives and identity remain deliberately obscure.'],
  ['Accel', 'A cool-headed gunslinger introduced in Power Stone 2.', 'Accel brings a frontier-inspired style to the expanded roster.'],
  ['Julia', 'An adventurous newcomer with an elegant, spirited presence.', 'Julia joins the treasure chase on her own terms.'],
  ['Pete', 'A compact mechanical fighter with playful movement.', 'Pete adds a bright retro-future personality to the roster.'],
  ['Gourmand', 'A chef-themed competitor with an eccentric fighting identity.', 'Gourmand turns culinary flair into arena spectacle.'],
  ['Pride', 'A composed swordsman presented as an unlockable fighter.', 'Pride’s connection to Falcon gives his appearance extra narrative weight.'],
  ['Mel', 'A poised adventurer presented as an unlockable fighter.', 'Mel’s role ties the wider adventure and item systems together.'],
].map(([name, tagline, history], index) => ({
  name,
  tagline,
  history,
  attributes: ['Editorial read: ' + (index % 2 ? 'technical' : 'approachable'), 'Editorial read: ' + (index % 3 ? 'mobile' : 'powerful')],
  moves: ['Core attacks — notation to verify', 'Power Stone transformation — inputs to verify', 'Mobility / item play — inputs to verify'],
}))

const expectedPspExclusiveCopy = [
  {
    name: 'Kraken',
    tagline: 'A monstrous unlockable fighter added in the PSP compilation.',
    history: 'Kraken appears as one of two fighters exclusive to Power Stone Collection on PSP, expanding the roster beyond the original Dreamcast and arcade lineup.',
    attributes: ['Editorial read: powerful', 'Editorial read: unconventional'],
    moves: ['Core attacks — notation to verify', 'Power Stone transformation — inputs to verify', 'Mobility / item play — inputs to verify'],
  },
  {
    name: 'General Valgas',
    tagline: 'A commanding unlockable fighter added in the PSP compilation.',
    history: 'General Valgas joins Kraken as one of two fighters exclusive to Power Stone Collection on PSP, not part of the original Dreamcast and arcade roster.',
    attributes: ['Editorial read: powerful', 'Editorial read: technical'],
    moves: ['Core attacks — notation to verify', 'Power Stone transformation — inputs to verify', 'Mobility / item play — inputs to verify'],
  },
]

const expectedLevelCopy = [
  { name: 'Melting Pot', description: 'An airborne arena where the route itself becomes part of the scramble.', media: '/media/placeholders/level-airship-cover-placeholder.svg', slides: ['/media/placeholders/level-airship-slide-1-placeholder.svg', '/media/placeholders/level-airship-slide-2-placeholder.svg', '/media/placeholders/level-airship-slide-3-placeholder.svg'] },
  { name: 'Blue Sky Area', description: 'A bright multi-tier battleground represented with replaceable study art.', media: '/media/placeholders/level-temple-cover-placeholder.svg', slides: ['/media/placeholders/level-temple-slide-1-placeholder.svg', '/media/placeholders/level-temple-slide-2-placeholder.svg', '/media/placeholders/level-temple-slide-3-placeholder.svg'] },
  { name: 'Dark Castle', description: 'A hazardous stage concept where awareness matters as much as offense.', media: '/media/placeholders/level-factory-cover-placeholder.svg', slides: ['/media/placeholders/level-factory-slide-1-placeholder.svg', '/media/placeholders/level-factory-slide-2-placeholder.svg', '/media/placeholders/level-factory-slide-3-placeholder.svg'] },
]

const expectedBossCopy = [
  { name: 'Pharaoh Walker', description: 'A large mechanical, pharaoh-styled encounter. Its scale and changing attack space reward watching hazards before committing to an approach.', status: 'Strategy details pending verification', media: '/media/placeholders/boss-pharaoh-walker-placeholder.svg' },
  { name: 'Dr. Erode', description: 'A climactic opponent associated with the game’s final stretch. This summary intentionally avoids asserting phase counts or exact patterns without verification.', status: 'Strategy details pending verification', media: '/media/placeholders/boss-dr-erode-placeholder.svg' },
]

function expectSharedProvenance(provenance: DataProvenance) {
  expect(['verified', 'conflicting', 'ambiguous']).toContain(provenance.verification)
  expect(Array.isArray(provenance.evidence)).toBe(true)
  expect(Array.isArray(provenance.notes)).toBe(true)
  for (const evidence of provenance.evidence) {
    expect(evidence.source).toBeTruthy()
    expect(evidence.locator).toBeTruthy()
    expect(evidence.value).toBeTruthy()
  }
}

describe('world data', () => {
  it('preserves expected guide coverage with unique stable IDs', () => {
    expect(characters).toHaveLength(16)
    expect(characters.filter(character => character.availability === 'dreamcast')).toHaveLength(14)
    expect(characters.filter(character => character.availability === 'psp-exclusive').map(character => character.name)).toEqual(['Kraken', 'General Valgas'])
    expect(levels.map(level => level.name)).toEqual(['Melting Pot', 'Blue Sky Area', 'Dark Castle'])
    expect(bosses.map(boss => boss.name)).toEqual(['Pharaoh Walker', 'Dr. Erode'])

    expect(new Set(records.map(record => record.id)).size).toBe(records.length)
    for (const record of records) {
      expect(record.id).toMatch(/^(character|level|boss)-[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(record.name.trim()).not.toBe('')
      expectSharedProvenance(record.provenance)
    }
  })

  it('exactly preserves every displayed field from 1eca5f7', () => {
    const dreamcastCharacters = characters.filter(character => character.availability === 'dreamcast')
    const pspExclusiveCharacters = characters.filter(character => character.availability === 'psp-exclusive')
    expect(dreamcastCharacters.map(({ name, tagline, history, attributes, moves }) => ({ name, tagline, history, attributes, moves }))).toEqual(expectedCharacterCopy)
    expect(pspExclusiveCharacters.map(({ name, tagline, history, attributes, moves }) => ({ name, tagline, history, attributes, moves }))).toEqual(expectedPspExclusiveCopy)
    expect(levels.map(({ name, description, media, slides }) => ({ name, description, media, slides }))).toEqual(expectedLevelCopy)
    expect(bosses.map(({ name, description, status, media }) => ({ name, description, status, media }))).toEqual(expectedBossCopy)

    expect(characters.every(character => character.provenance.verification === 'ambiguous')).toBe(true)
    expect(levels.every(level => level.provenance.verification === 'ambiguous')).toBe(true)
    expect(bosses.every(boss => boss.provenance.verification === 'ambiguous')).toBe(true)
  })

  it('gives every base-roster character chip art, no chip art for PSP exclusives, and every character full portrait art', () => {
    for (const character of characters) {
      if (character.availability === 'dreamcast') expect(character.media, character.name).not.toBeNull()
      else expect(character.media, character.name).toBeNull()
      expect(character.portrait, character.name).not.toBeNull()
    }
  })

  it('declares only public-root media that exist', () => {
    const paths = [
      ...characters.map(record => record.media),
      ...characters.map(record => record.portrait),
      ...levels.flatMap(record => [record.media, ...record.slides]),
      ...bosses.map(record => record.media),
    ]
    for (const media of paths) {
      if (media !== null) {
        expect(media.startsWith('/media/'), media).toBe(true)
        expect(existsSync(`${projectRoot}/public${media}`), media).toBe(true)
      }
    }
  })

  it('exports typed ID lookups', () => {
    expect(getCharacterById('character-wang-tang')?.name).toBe('Wang-Tang')
    expect(getLevelById('level-blue-sky-area')?.name).toBe('Blue Sky Area')
    expect(getBossById('boss-dr-erode')?.name).toBe('Dr. Erode')
  })
})
