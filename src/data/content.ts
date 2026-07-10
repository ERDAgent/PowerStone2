export const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'items', label: 'Items' },
  { id: 'combinations', label: 'Combinations' },
  { id: 'levels', label: 'Levels' },
  { id: 'characters', label: 'Characters' },
  { id: 'unlocks', label: 'Unlocks' },
  { id: 'multiplayer', label: 'Multiplayer' },
  { id: 'bosses', label: 'Bosses' },
  { id: 'history', label: 'History' },
  { id: 'about', label: 'About' },
] as const

export type SectionId = typeof sections[number]['id']

export interface Item {
  id: string; name: string; category: string; description: string; effect: string; stat: string; image: string
}

export const items: Item[] = [
  { id: 'flame-sword', name: 'Flame Sword', category: 'Weapon', description: 'A close-range blade presented here as a browser test entry.', effect: 'Short-range attacks with a fiery visual treatment.', stat: 'Damage values: awaiting verification', image: '/media/item-flame-sword-placeholder.svg' },
  { id: 'machine-gun', name: 'Machine Gun', category: 'Ranged', description: 'A rapid-fire pickup useful for testing ranged-item filtering.', effect: 'Fires a burst toward the wielder’s aim.', stat: 'Ammo and damage: awaiting verification', image: '/media/item-machine-gun-placeholder.svg' },
  { id: 'power-shield', name: 'Power Shield', category: 'Defense', description: 'A defensive test entry with provisional documentation.', effect: 'Provides temporary frontal protection.', stat: 'Duration: awaiting verification', image: '/media/item-power-shield-placeholder.svg' },
  { id: 'skateboard', name: 'Skateboard', category: 'Mobility', description: 'A rideable item used to demonstrate the mobility category.', effect: 'Changes traversal while held.', stat: 'Speed values: awaiting verification', image: '/media/item-skateboard-placeholder.svg' },
]

export interface Character {
  id: string; name: string; tagline: string; history: string; attributes: string[]; moves: string[]; color: string
}

const characterNames = ['Falcon', 'Wang-Tang', 'Ryoma', 'Rouge', 'Ayame', 'Gunrock', 'Galuda', 'Jack', 'Accel', 'Julia', 'Pete', 'Gourmand', 'Pride', 'Mel']
const details: Record<string, [string, string]> = {
  Falcon: ['A daring aerial adventurer and the guide’s default fighter.', 'Falcon returns to the hunt with a bold, mobile style and a taste for treasure.'],
  'Wang-Tang': ['An energetic martial artist built around direct momentum.', 'Wang-Tang brings disciplined training and irrepressible confidence to the fray.'],
  Ryoma: ['A wandering swordsman with measured reach.', 'Ryoma’s traditional bearing contrasts with the chaos of transforming arenas.'],
  Rouge: ['A fortune-teller whose presentation leans into fire and mystery.', 'Rouge enters the contest with poise, spectacle, and an enigmatic past.'],
  Ayame: ['A nimble performer with a fast, evasive identity.', 'Ayame balances her stagecraft with the agility needed for the stone hunt.'],
  Gunrock: ['A huge miner whose identity emphasizes raw force.', 'Gunrock’s working-life roots and massive frame make him an imposing contender.'],
  Galuda: ['A proud warrior whose identity emphasizes strength and duty.', 'Galuda carries a protective spirit into every arena.'],
  Jack: ['A mysterious, bladed combatant with an unsettling silhouette.', 'Jack’s motives and identity remain deliberately obscure.'],
  Accel: ['A cool-headed gunslinger introduced in Power Stone 2.', 'Accel brings a frontier-inspired style to the expanded roster.'],
  Julia: ['An adventurous newcomer with an elegant, spirited presence.', 'Julia joins the treasure chase on her own terms.'],
  Pete: ['A compact mechanical fighter with playful movement.', 'Pete adds a bright retro-future personality to the roster.'],
  Gourmand: ['A chef-themed competitor with an eccentric fighting identity.', 'Gourmand turns culinary flair into arena spectacle.'],
  Pride: ['A composed swordsman presented as an unlockable fighter.', 'Pride’s connection to Falcon gives his appearance extra narrative weight.'],
  Mel: ['A poised adventurer presented as an unlockable fighter.', 'Mel’s role ties the wider adventure and item systems together.'],
}

export const characters: Character[] = characterNames.map((name, index) => ({
  id: name.toLowerCase().replace(/[^a-z]+/g, '-'), name,
  tagline: details[name][0], history: details[name][1],
  attributes: ['Editorial read: ' + (index % 2 ? 'technical' : 'approachable'), 'Editorial read: ' + (index % 3 ? 'mobile' : 'powerful')],
  moves: ['Core attacks — notation to verify', 'Power Stone transformation — inputs to verify', 'Mobility / item play — inputs to verify'],
  color: `hsl(${(index * 37 + 18) % 360} 82% 58%)`,
}))

export interface Level { id: string; name: string; description: string; image: string; slides: string[] }
export const levels: Level[] = [
  { id: 'airship', name: 'Melting Pot', description: 'An airborne arena where the route itself becomes part of the scramble.', image: '/media/level-airship-cover-placeholder.svg', slides: ['/media/level-airship-slide-1-placeholder.svg', '/media/level-airship-slide-2-placeholder.svg', '/media/level-airship-slide-3-placeholder.svg'] },
  { id: 'temple', name: 'Blue Sky Area', description: 'A bright multi-tier battleground represented with replaceable study art.', image: '/media/level-temple-cover-placeholder.svg', slides: ['/media/level-temple-slide-1-placeholder.svg', '/media/level-temple-slide-2-placeholder.svg', '/media/level-temple-slide-3-placeholder.svg'] },
  { id: 'factory', name: 'Dark Castle', description: 'A hazardous stage concept where awareness matters as much as offense.', image: '/media/level-factory-cover-placeholder.svg', slides: ['/media/level-factory-slide-1-placeholder.svg', '/media/level-factory-slide-2-placeholder.svg', '/media/level-factory-slide-3-placeholder.svg'] },
]
