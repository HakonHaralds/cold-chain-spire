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
  | 'speed'
  | 'layers'
  | 'clout'
  | 'costcut'
  | 'escape'
  | 'docReview'
  | 'traceability'
  | 'tempMapping'
  | 'auditGate'

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
  /** Branching upgrade (M8): "Rewrite" = upgraded, costs 1 less, shuffles a Bug into your draw pile when played. */
  rewrite?: boolean
  /** Frozen by the CFO's Budget Freeze: unplayable until the end of this turn. */
  frozen?: boolean
}

/** Per-combat counters (updated by the engine; read by achievements and OKRs). */
export interface CombatStats {
  damageTaken: number // HP lost by the player
  maxHit: number // biggest single hit dealt by the player (HP + block removed)
  maxBlock: number // most Block held at once
  blockGained: number
  cardsPlayed: number
  attacks: number
  skills: number
  powers: number
  cardsThisTurn: number
  maxCardsInTurn: number
  excursionApplied: number // total Excursion stacks applied to enemies
  excursionKills: number // enemies killed by Excursion ticks
  bugsExhausted: number
  maxCharge: number
  healed: number
  cardsExhausted: number
  energyWasted: number // unspent energy at end of turn, summed
}

/** Run-long counters (combat stats are folded in at the end of each fight). */
export interface RunStats {
  enemiesDefeated: number
  cardsPlayed: number
  damageDealt: number
  fights: number
  elitesDefeated: number
  bossesDefeated: number
  flawlessFights: number // fights won without losing HP
  damageTaken: number
  attacks: number
  skills: number
  powers: number
  maxHit: number
  maxBlock: number
  maxCardsInTurn: number
  excursionApplied: number
  excursionKills: number
  bugsExhausted: number
  maxCharge: number
  healed: number
  cardsExhausted: number
  tokensEarned: number
  tokensSpent: number
  eventsVisited: number
  rests: number
  upgrades: number
  removals: number
  cardsAdded: number
  relicsGained: number
  shopsVisited: number
  fastestFight: number // fewest turns to win a fight (0 = none yet)
}

export interface CompanionState {
  id: string
  level: number // 1..3
}

export interface OkrState {
  id: string
  act: number
  baseline: RunStats // run.stats snapshot when the OKR was chosen
  done: boolean
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
  /** Left the fight without dying (e.g. the Recruiter escaping). Counts as gone, not defeated. */
  escaped?: boolean
  /** Short free-text note shown under the enemy's name (e.g. which card the Recruiter is after). */
  note?: string
  /** String data for enemy mechanics (e.g. the uid of the card being headhunted). */
  data?: Record<string, string>
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
  /** Status/curse cards that just triggered (shown popping out of the hand). Optional for older saves. */
  cardFx?: { id: number; cardId: string; text: string }[]
  shake: number // bumps on heavy hits → screen shake
  speech: Speech | null
  log: string[]
  anim: Record<string, string> // uid -> css anim class
  attacksPlayed: number
  dmgDealt: number
  goldStolen: number
  kind: 'normal' | 'elite' | 'boss'
  relics: string[]
  stats: CombatStats
  reviewLevel: number
  companion: CompanionState | null
  /** Per-combat relic counters (optional for older saves). */
  relicState?: Record<string, number>
  /** Combat-wide rule changes from enemy mechanics (e.g. the Global Audit's phases). */
  rules?: { blockMul?: number; repeatPenalty?: number; excursionMul?: number }
  /** Card ids played this player turn (for the Audit's Traceability Check). */
  playedThisTurn?: string[]
  /** Run-deck card uids taken by enemies (removed from the deck after the fight). */
  stolenCards?: string[]
  /** One-off centre-screen banner (e.g. a boss changing phase). */
  banner?: { id: number; title: string; text: string }
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
  | { kind: 'companionselect' }
  | { kind: 'okrselect'; options: string[] }
  | { kind: 'career' }
  | { kind: 'compendium' }

export type CharId = 'fw' | 'hw' | 'cal'

export interface Run {
  character: CharId
  hp: number
  maxHp: number
  gold: number // displayed as "tokens" (values are in full units, e.g. 25000)
  deck: CardInst[]
  relics: string[]
  act: number
  map: ActMap
  position: string | null
  floor: number
  seenBosses: string[]
  stats: RunStats
  settings: string[] // setting id per act (index act-1), e.g. ['m2', 's3', 'logipharma', 'mine']
  companion: CompanionState | null
  okr: OkrState | null
  reviewLevel: number // Performance Review level (M22), 0 = off
  startedAt: number
  /** Boss rolled for each act (index act-1). Optional for older saves. */
  bosses?: string[]
}
