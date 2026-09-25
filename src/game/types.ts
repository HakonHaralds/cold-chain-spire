export type CardType = 'attack' | 'skill' | 'power' | 'status' | 'curse'
export type Rarity = 'basic' | 'common' | 'uncommon' | 'rare' | 'special'
export type Target = 'enemy' | 'none'

export type StatusId =
  | 'strength'
  | 'dexterity'
  | 'weak'
  | 'vulnerable'
  | 'frail'
  | 'excursion'
  | 'metallicize'
  | 'ritual'
  | 'thorns'
  | 'tempStrength'
  | 'ota'
  | 'sprint'
  | 'fleet'
  | 'doubleTap'
  | 'auditTrail'
  | 'tipsy'
  | 'charge'
  | 'energyDown'
  | 'capacitor'
  | 'watchdog'
  | 'memsafe'
  | 'capbank'
  | 'thermalpad'
  | 'tesla'
  | 'certificate'
  | 'hysteresis'

export type Statuses = Partial<Record<StatusId, number>>

export interface Fighter {
  hp: number
  maxHp: number
  block: number
  statuses: Statuses
}

export interface CardInst {
  uid: string
  id: string
  upgraded: boolean
}

export type IntentKind =
  | 'attack'
  | 'defend'
  | 'buff'
  | 'debuff'
  | 'attack_debuff'
  | 'attack_defend'
  | 'defend_buff'
  | 'summon'
  | 'sleep'
  | 'heal'

export interface Intent {
  kind: IntentKind
  label: string
  damage?: number
  hits?: number
}

export interface EnemyInst extends Fighter {
  uid: string
  defId: string
  move: string
  history: string[]
  turn: number
  flags: Record<string, number>
  dead: boolean
}

export interface FloatText {
  id: number
  target: string // 'player' or enemy uid
  text: string
  kind: 'damage' | 'block' | 'heal' | 'status' | 'miss'
}

export type FxKind = 'slash' | 'claw' | 'blockhit' | 'shield' | 'buff' | 'debuff' | 'heal' | 'heat' | 'death'

export interface Fx {
  id: number
  target: string
  kind: FxKind
  big?: boolean
}

export interface Speech {
  target: string
  text: string
  id: number
}

export interface Combat {
  player: Fighter
  energy: number
  maxEnergy: number
  enemies: EnemyInst[]
  draw: CardInst[]
  hand: CardInst[]
  discard: CardInst[]
  exhaust: CardInst[]
  turn: number
  phase: 'player' | 'enemy' | 'won' | 'lost'
  floats: FloatText[]
  fx: Fx[]
  shake: number // bumps on heavy hits → screen shake
  speech: Speech | null
  log: string[]
  anim: Record<string, string> // uid -> css anim class
  attacksPlayed: number
  dmgDealt: number
  goldStolen: number
  kind: 'normal' | 'elite' | 'boss'
  relics: string[]
}

export type NodeType = 'combat' | 'elite' | 'rest' | 'shop' | 'event' | 'treasure' | 'boss'

export interface MapNode {
  id: string
  row: number
  col: number
  type: NodeType
  next: string[]
}

export interface ActMap {
  nodes: Record<string, MapNode>
  rows: number
  bossId: string
}

export type Screen =
  | { kind: 'title' }
  | { kind: 'map' }
  | { kind: 'combat' }
  | { kind: 'reward'; gold: number; cards: string[]; relic: string | null; bossRelics: string[] | null }
  | { kind: 'rest'; used?: boolean }
  | { kind: 'shop'; cards: { id: string; price: number; sold: boolean }[]; relics: { id: string; price: number; sold: boolean }[]; removeUsed: boolean }
  | { kind: 'event'; eventId: string; result: string | null }
  | { kind: 'treasure'; relic: string; taken: boolean }
  | { kind: 'gameover' }
  | { kind: 'victory' }
  | { kind: 'charselect' }

export type CharId = 'fw' | 'hw' | 'cal'

export interface Run {
  character: CharId
  hp: number
  maxHp: number
  gold: number
  deck: CardInst[]
  relics: string[]
  act: number
  map: ActMap
  position: string | null
  floor: number
  seenBosses: string[]
  stats: { enemiesDefeated: number; cardsPlayed: number; damageDealt: number }
}
