import { DEF } from './cards'
import {
  addCards,
  addFloat,
  addStatus,
  applyDamage,
  charge,
  drawCards,
  gainBlock,
  gainCharge,
  heal,
  livingEnemies,
  exhaustBugs,
  randomEnemy,
  relicEvents,
  st,
} from './core'
import type { CardInst, CharId, Combat, EnemyInst, Run } from './types'

export type RelicTier = 'starter' | 'common' | 'uncommon' | 'rare' | 'boss' | 'shop'

export interface RelicDef {
  id: string
  name: string
  icon: string
  text: string
  tier: RelicTier
  /** Class-specific: only offered to this character. */
  cls?: CharId
  // ---- static modifiers (read by App / startCombat) ----
  energy?: number // extra max Energy
  shopMul?: number // shop price multiplier
  restBonus?: number // extra fraction of Max HP healed at the coffee machine
  cardChoice?: number // extra (or fewer) card reward choices
  tokenMul?: number // combat token reward multiplier
  shopExtraCards?: number // extra cards offered in shops
  // ---- hooks ----
  onPickup?: (run: Run) => Run
  onCombatStart?: (c: Combat) => void
  onTurnStart?: (c: Combat) => void // after the turn's draw
  onTurnEnd?: (c: Combat) => void // before the hand is discarded
  onCardPlayed?: (c: Combat, card: CardInst) => void
  onExhaust?: (c: Combat, n: number, bugs: number) => void
  onEnemyDeath?: (c: Combat, e: EnemyInst) => void
  onPlayerHpLoss?: (c: Combat, n: number) => void
  onCombatEnd?: (run: Run, c: Combat) => Run
}

// ---------- helpers ----------

/** Per-combat relic counters (Combat.relicState may be missing on older saves). */
const rs = (c: Combat) => (c.relicState ??= {})
const bump = (c: Combat, key: string, n = 1) => (rs(c)[key] = (rs(c)[key] ?? 0) + n)
const energy = (c: Combat, n: number) => {
  c.energy += n
  addFloat(c, 'player', `+${n} Energy`, 'status')
}
const maxHp = (run: Run, n: number): Run => ({ ...run, maxHp: run.maxHp + n, hp: run.hp + n })

// ---------- content ----------

const defs: RelicDef[] = [
  // ===== Starters =====
  { id: 'jlink', name: 'J-Link Debugger', icon: '🔗', tier: 'starter', cls: 'fw', text: 'At the end of your turn, exhaust a Bug from your hand. Whenever you exhaust a Bug, deal 7 damage to a random enemy.' },
  { id: 'soldering_station', name: 'Soldering Station', icon: '🔥', tier: 'starter', cls: 'hw', text: 'Start each combat with 3 Charge.' },
  { id: 'ref_thermometer', name: 'Reference Thermometer', icon: '🌡️', tier: 'starter', cls: 'cal', text: 'At the start of each combat, apply 2 Excursion to ALL enemies.' },

  // ===== Common =====
  { id: 'saga_card', name: 'Saga Card', icon: '📟', tier: 'common', text: 'At the end of combat, heal 6 HP. It logged every second of it.' },
  { id: 'standing_desk', name: 'Standing Desk', icon: '🧍', tier: 'common', text: 'Draw 2 additional cards on the first turn of each combat.' },
  { id: 'energy_drink', name: 'Energy Drink', icon: '🥤', tier: 'common', text: 'Start each combat with 1 Strength.' },
  { id: 'headphones', name: 'Noise-Cancelling Headphones', icon: '🎧', tier: 'common', text: 'Start each combat with 1 Dexterity.' },
  { id: 'dry_ice', name: 'Dry Ice Pack', icon: '❄️', tier: 'rare', cls: 'cal', text: 'The first time you apply Excursion each turn, apply 1 more.' },
  { id: 'lanyard', name: 'Company Lanyard', icon: '🪪', tier: 'common', text: 'On pickup, raise Max HP by 10.', onPickup: (r) => maxHp(r, 10) },
  { id: 'rubber_duck', name: 'Rubber Duck', icon: '🦆', tier: 'common', text: 'Your first Attack each combat deals 8 additional damage.' },
  { id: 'hoodie', name: 'Company Hoodie', icon: '🧥', tier: 'common', text: 'Start each combat with 10 Block.' },
  { id: 'kanelsnudur', name: 'Cinnamon Bun', icon: '🥐', tier: 'common', text: 'On pickup, heal 20 HP. Friday treats are sacred.', onPickup: (r) => ({ ...r, hp: Math.min(r.maxHp, r.hp + 20) }) },
  {
    id: 'thermos', name: 'Thermos', icon: '🫖', tier: 'common', text: 'Gain 1 Energy on the first turn of each combat. Keeps coffee hot for 12 hours.',
    onTurnStart: (c) => void (c.turn === 1 && energy(c, 1)),
  },
  {
    id: 'postit_wall', name: 'Post-it Wall', icon: '📝', tier: 'common', text: 'At the start of your 2nd turn, draw 2 additional cards.',
    onTurnStart: (c) => void (c.turn === 2 && drawCards(c, 2)),
  },
  {
    id: 'second_monitor', name: 'Second Monitor', icon: '🖥️', tier: 'common', text: 'Every 3rd turn, draw 1 additional card.',
    onTurnStart: (c) => void (c.turn % 3 === 0 && drawCards(c, 1)),
  },
  {
    id: 'ergonomic_chair', name: 'Ergonomic Chair', icon: '🪑', tier: 'common', text: 'At the end of your turn, if you have no Block, gain 5 Block.',
    onTurnEnd: (c) => void (c.player.block === 0 && gainBlock(c, 'player', 5, true)),
  },
  {
    id: 'usbc_dongle', name: 'USB-C Dongle', icon: '🔌', tier: 'uncommon', text: 'Every 10th card you play in a combat gives 1 Energy. You will need another one.',
    onCardPlayed: (c) => void (bump(c, 'usbc') % 10 === 0 && energy(c, 1)),
  },
  {
    id: 'label_printer', name: 'Label Printer', icon: '🏷️', tier: 'common', text: 'At the start of each combat, apply 1 Vulnerable to ALL enemies.',
    onCombatStart: (c) => livingEnemies(c).forEach((e) => addStatus(c, e.uid, 'vulnerable', 1)),
  },
  {
    id: 'pallet_jack', name: 'Pallet Jack', icon: '🛻', tier: 'common', text: 'At the start of each combat, apply 1 Weak to ALL enemies.',
    onCombatStart: (c) => livingEnemies(c).forEach((e) => addStatus(c, e.uid, 'weak', 1)),
  },
  {
    id: 'logger_mk1', name: 'Data Logger Mk1', icon: '📼', tier: 'uncommon', text: 'Every 6th card you play in a combat deals 5 damage to a random enemy. Battery life: legendary.',
    onCardPlayed: (c) => {
      if (bump(c, 'mk1') % 6 !== 0) return
      const e = randomEnemy(c)
      if (e) applyDamage(c, e.uid, 5, 'player')
    },
  },
  {
    id: 'spare_battery', name: 'Spare Battery', icon: '🔋', tier: 'common', text: 'The first time your HP drops to 50% or below in a combat, heal 8 HP.',
    onPlayerHpLoss: (c) => {
      if (rs(c).battery || c.player.hp <= 0 || c.player.hp > c.player.maxHp / 2) return
      rs(c).battery = 1
      heal(c, 'player', 8)
    },
  },
  { id: 'coffee_grinder', name: 'Coffee Grinder', icon: '⚙️', tier: 'common', restBonus: 0.15, text: 'The coffee machine heals an additional 15% of your Max HP. Freshly ground, obviously.' },
  {
    id: 'calibration_weight', name: 'Calibration Weight', icon: '⚖️', tier: 'common', text: 'At the start of your turn, if your HP is at or below 50%, gain 4 Block.',
    onTurnStart: (c) => void (c.player.hp <= c.player.maxHp / 2 && gainBlock(c, 'player', 4, true)),
  },
  {
    id: 'fika_cake', name: 'Fika Cake', icon: '🍰', tier: 'common', restBonus: 0.05, text: 'At the end of combat, heal 2 HP. The coffee machine heals an additional 5%.',
    onCombatEnd: (run, c) => (c.player.hp > 0 ? { ...run, hp: Math.min(run.maxHp, run.hp + 2) } : run),
  },

  // ===== Uncommon =====
  {
    id: 'gdp_handbook', name: 'GDP Handbook', icon: '📘', tier: 'common', text: 'Whenever you exhaust a card, gain 4 Block.',
    onExhaust: (c, n) => gainBlock(c, 'player', 4 * n, true),
  },
  {
    id: 'antistatic', name: 'Anti-static Wristband', icon: '🧷', tier: 'uncommon', text: 'Whenever you play a Power, gain 6 Block and draw 1 card.',
    onCardPlayed: (c, card) => {
      if (DEF[card.id].type !== 'power') return
      gainBlock(c, 'player', 6, true)
      drawCards(c, 1)
    },
  },
  {
    id: 'noise_machine', name: 'White Noise Machine', icon: '🔈', tier: 'uncommon', text: 'At the end of your turn, gain 1 Block for each card left in your hand.',
    onTurnEnd: (c) => void (c.hand.length && gainBlock(c, 'player', c.hand.length, true)),
  },
  {
    id: 'flaky_ci', name: 'Flaky CI', icon: '🎲', tier: 'uncommon', text: 'At the start of your turn: 1-in-3 chance to draw 1 card, 1-in-3 chance to gain 3 Block, otherwise nothing. Nobody knows why.',
    onTurnStart: (c) => {
      const r = Math.random()
      if (r < 1 / 3) drawCards(c, 1)
      else if (r < 2 / 3) gainBlock(c, 'player', 3, true)
    },
  },
  {
    id: 'monorepo', name: 'Monorepo', icon: '🗃️', tier: 'common', text: 'Draw 1 additional card on each of your first 3 turns.',
    onTurnStart: (c) => void (c.turn <= 3 && drawCards(c, 1)),
  },
  {
    id: 'whiteboard', name: 'Whiteboard', icon: '🧑‍🏫', tier: 'uncommon', text: 'Whenever you play 3 Attacks in a single turn, gain 1 Strength.',
    onTurnStart: (c) => void (rs(c).wbAtk = 0),
    onCardPlayed: (c, card) => void (DEF[card.id].type === 'attack' && bump(c, 'wbAtk') === 3 && addStatus(c, 'player', 'strength', 1)),
  },
  {
    id: 'kanban', name: 'Kanban Board', icon: '📋', tier: 'uncommon', text: 'Whenever you play 3 Skills in a single turn, gain 1 Dexterity.',
    onTurnStart: (c) => void (rs(c).kbSkill = 0),
    onCardPlayed: (c, card) => void (DEF[card.id].type === 'skill' && bump(c, 'kbSkill') === 3 && addStatus(c, 'player', 'dexterity', 1)),
  },
  {
    id: 'customer_quote', name: 'Glowing Customer Quote', icon: '💬', tier: 'uncommon', text: 'Whenever an enemy dies, gain 1 Energy and draw 1 card.',
    onEnemyDeath: (c) => {
      if (c.phase !== 'player' || livingEnemies(c).length === 0) return
      energy(c, 1)
      drawCards(c, 1)
    },
  },
  {
    id: 'overclocked', name: 'Overclocked Laptop', icon: '💻', tier: 'rare', text: 'If you end your turn with 0 Energy, gain 1 Energy next turn. Needs a turn to cool down after triggering.',
    onTurnEnd: (c) => void (rs(c).oc = c.energy === 0 && !rs(c).ocCool ? 1 : 0),
    onTurnStart: (c) => {
      rs(c).ocCool = 0
      if (!rs(c).oc) return
      rs(c).oc = 0
      rs(c).ocCool = 1
      energy(c, 1)
    },
  },
  // Firmware
  {
    id: 'linter', name: 'Linter', icon: '🧹', tier: 'uncommon', cls: 'fw', text: 'At the end of your turn, exhaust 1 additional Bug from your hand. 4,000 warnings, 0 errors.',
    onTurnEnd: (c) => void exhaustBugs(c, ['hand'], 1),
  },
  {
    id: 'core_dump', name: 'Core Dump', icon: '💥', tier: 'uncommon', cls: 'fw', text: 'Whenever you exhaust a Bug, gain 4 Block.',
    onExhaust: (c, _n, bugs) => void (bugs > 0 && gainBlock(c, 'player', 4 * bugs, true)),
  },
  // Hardware
  {
    id: 'scope_probe', name: 'Oscilloscope Probe', icon: '🔬', tier: 'uncommon', cls: 'hw', text: 'At the start of every 2nd turn, gain 1 Charge.',
    onTurnStart: (c) => void (c.turn % 2 === 0 && gainCharge(c, 1)),
  },
  {
    id: 'hot_air', name: 'Hot Air Station', icon: '🌬️', tier: 'uncommon', cls: 'hw', text: 'Whenever you play a card that consumes Charge, gain 9 Block.',
    onCardPlayed: (c, card) => void (DEF[card.id].discharge && gainBlock(c, 'player', 9, true)),
  },
  {
    id: 'surge_protector', name: 'Surge Protector', icon: '🛡️', tier: 'uncommon', cls: 'hw', text: 'Start each combat with 4 additional Charge and 6 Block.',
    onCombatStart: (c) => {
      gainCharge(c, 4)
      gainBlock(c, 'player', 6, true)
    },
  },
  // Calibration
  {
    id: 'phase_change', name: 'Phase-Change Packs', icon: '🧊', tier: 'uncommon', cls: 'cal', text: 'At the start of every 2nd turn, apply 1 Excursion to a random enemy.',
    onTurnStart: (c) => {
      if (c.turn % 2 !== 0) return
      const e = randomEnemy(c)
      if (e) addStatus(c, e.uid, 'excursion', 1)
    },
  },
  {
    id: 'probe_array', name: 'Probe Array', icon: '📡', tier: 'uncommon', cls: 'cal', text: 'At the start of each combat, apply 1 Excursion to ALL enemies. Whenever an enemy with Excursion dies, apply its Excursion to a random enemy.',
    onCombatStart: (c) => livingEnemies(c).forEach((e) => addStatus(c, e.uid, 'excursion', 1)),
    onEnemyDeath: (c, e) => {
      const n = st(e, 'excursion')
      const t = randomEnemy(c)
      if (n > 0 && t) addStatus(c, t.uid, 'excursion', n)
    },
  },

  // ===== Rare =====
  {
    id: 'rollback_plan', name: 'Rollback Plan', icon: '⏪', tier: 'rare', text: 'The first time you would die, heal to 30% of your Max HP instead. Then this relic is used up.',
    onPlayerHpLoss: (c) => {
      if (c.player.hp > 0 || rs(c).rollback) return
      rs(c).rollback = 1
      c.player.hp = Math.round(c.player.maxHp * 0.3)
      addFloat(c, 'player', 'Rolled back!', 'heal')
    },
    onCombatEnd: (run, c) => (c.relicState?.rollback ? { ...run, relics: run.relics.map((r) => (r === 'rollback_plan' ? 'rollback_used' : r)) } : run),
  },
  {
    id: 'feature_flag', name: 'Feature Flag', icon: '🚩', tier: 'rare', text: 'The first Power you play each combat is played twice.',
    onCardPlayed: (c, card) => {
      if (DEF[card.id].type !== 'power' || rs(c).flag) return
      rs(c).flag = 1
      DEF[card.id].play?.(c, null, card.upgraded)
      addFloat(c, 'player', 'Flag enabled!', 'status')
    },
  },
  {
    id: 'employee_month', name: 'Employee of the Month', icon: '🌟', tier: 'rare', text: 'Start each combat with 2 Strength. Your photo is on the wall by the lifts.',
    onCombatStart: (c) => addStatus(c, 'player', 'strength', 2),
  },
  {
    id: 'mentor', name: 'Mentor', icon: '🧓', tier: 'rare', text: 'On the first turn of each combat, upgrade every card in your hand for that combat.',
    onTurnStart: (c) => {
      if (c.turn !== 1) return
      for (const h of c.hand) if (DEF[h.id].type !== 'status' && DEF[h.id].type !== 'curse') h.upgraded = true
    },
  },
  {
    id: 'ops_dashboard', name: 'Ops Dashboard', icon: '📊', tier: 'rare', text: 'Enemies start each combat with 12% less HP.',
    onCombatStart: (c) => livingEnemies(c).forEach((e) => (e.hp = Math.max(1, Math.round(e.hp * 0.88)))),
  },
  { id: 'travel_insurance', name: 'Travel Insurance', icon: '🧳', tier: 'uncommon', text: 'Whenever you would lose 2 to 5 HP from an attack, lose only 1.' },
  {
    id: 'saga_gateway', name: 'Saga Gateway', icon: '📶', tier: 'rare', text: 'Whenever you play your 4th card in a turn, deal 9 damage to ALL enemies.',
    onTurnStart: (c) => void (rs(c).gwCards = 0),
    onCardPlayed: (c) => {
      if (bump(c, 'gwCards') !== 4) return
      for (const e of livingEnemies(c)) applyDamage(c, e.uid, 9, 'player')
    },
  },
  {
    id: 'stack_trace', name: 'Stack Trace', icon: '📜', tier: 'uncommon', cls: 'fw', text: 'Whenever you exhaust a Bug, gain 2 Block, and during your turn draw 1 card (up to 3 per turn).',
    onTurnStart: (c) => {
      rs(c).trace = 0
      rs(c).traceEnding = 0
    },
    onTurnEnd: (c) => void (rs(c).traceEnding = 1),
    onExhaust: (c, _n, bugs) => {
      if (bugs > 0) gainBlock(c, 'player', 2 * bugs, true)
      const n = Math.min(Math.max(0, 3 - (rs(c).trace ?? 0)), bugs)
      if (n <= 0 || c.phase !== 'player' || rs(c).traceEnding) return
      rs(c).trace = (rs(c).trace ?? 0) + n
      drawCards(c, n)
    },
  },
  {
    id: 'flux_capacitor', name: 'Flux Capacitor', icon: '⚡', tier: 'rare', cls: 'hw', text: 'At the start of your turn, if you have 4 or more Charge, gain 1 Energy.',
    onTurnStart: (c) => void (charge(c) >= 4 && energy(c, 1)),
  },
  { id: 'cold_room_door', name: 'Cold Room Door', icon: '🚪', tier: 'rare', cls: 'cal', text: 'Excursion on enemies deals 50% more damage. Someone left it open again.' },

  // ===== Boss =====
  { id: 'espresso', name: 'Espresso Machine', icon: '☕', tier: 'boss', text: 'Gain 1 additional Energy each turn. You can no longer Rest at the coffee machine: you are wired enough already.' },
  { id: 'stock_options', name: 'Stock Options', icon: '📈', tier: 'boss', text: 'Gain 1 additional Energy each turn. Gain 50% fewer tokens from combat. (Vesting schedule applies.)' },
  { id: 'unlimited_pto', name: 'Unlimited PTO', icon: '🏖️', tier: 'boss', text: 'Gain 1 additional Energy each turn. At the start of each combat, shuffle 2 Meeting Invites into your draw pile. (Nobody actually takes it.)' },
  { id: 'corner_office', name: 'Corner Office', icon: '🪟', tier: 'boss', text: 'Draw 1 additional card each turn.' },
  { id: 'gdp_cert', name: 'GDP Certificate', icon: '🏅', tier: 'boss', text: 'At the end of your turn, gain 4 Block.' },
  {
    id: 'company_car', name: 'Company Car', icon: '🚗', tier: 'boss', energy: 1, text: 'Gain 1 additional Energy each turn. Start each combat with 2 Weak (stuck in traffic).',
    onCombatStart: (c) => addStatus(c, 'player', 'weak', 2),
  },
  {
    id: 'open_plan', name: 'Open-Plan Office', icon: '🏢', tier: 'boss', energy: 1, text: 'Gain 1 additional Energy each turn. At the start of every 2nd turn, a colleague interrupts you: discard a random card.',
    onTurnStart: (c) => {
      if (!c.hand.length || c.turn % 2 !== 0) return
      const i = Math.floor(Math.random() * c.hand.length)
      c.discard.push(c.hand.splice(i, 1)[0])
      addFloat(c, 'player', '"Got a sec?"', 'status')
    },
  },
  {
    id: 'ai_copilot', name: 'AI Copilot', icon: '🤖', tier: 'boss', energy: 1, text: 'Gain 1 additional Energy each turn. At the start of each combat, shuffle 3 Bugs into your draw pile. It writes code fast.',
    onCombatStart: (c) => addCards(c, 'bug', 'draw', 3),
  },
  {
    id: 'ipo', name: 'IPO', icon: '🔔', tier: 'boss', cardChoice: -1, text: 'On pickup, gain 350k tokens and raise Max HP by 8. Card rewards offer 1 fewer card.',
    onPickup: (r) => maxHp({ ...r, gold: r.gold + 350000 }, 8),
  },
  {
    id: 'four_day_week', name: 'Four-Day Week', icon: '📅', tier: 'boss', energy: 1, text: 'Gain 1 additional Energy each turn. Every 4th turn is a half day: discard 2 random cards at the start of it.',
    onTurnStart: (c) => {
      if (c.turn % 4 !== 0) return
      for (let i = 0; i < 2 && c.hand.length; i++) c.discard.push(c.hand.splice(Math.floor(Math.random() * c.hand.length), 1)[0])
      addFloat(c, 'player', 'Half day!', 'status')
    },
  },

  // ===== Shop only =====
  { id: 'company_card', name: 'Company Credit Card', icon: '💳', tier: 'shop', shopMul: 0.8, text: 'Shop prices are 20% lower. Expense it.' },
  { id: 'loyalty_card', name: 'Loyalty Card', icon: '🎟️', tier: 'shop', tokenMul: 1.25, text: 'Earn 25% more tokens from combat.' },
  { id: 'coupon_book', name: 'Coupon Book', icon: '🧾', tier: 'shop', shopExtraCards: 2, cardChoice: 1, text: 'Shops offer 2 more cards and card rewards offer 1 more card.' },
  {
    id: 'swag_voucher', name: 'Swag Voucher', icon: '🎫', tier: 'shop', text: 'On pickup, gain a random common relic and a random uncommon relic.',
    onPickup: (r) => {
      let out = r
      for (const tier of ['common', 'uncommon'] as const) {
        const pool = eligible(out, tier)
        if (pool.length) out = grantRelic(out, pool[Math.floor(Math.random() * pool.length)])
      }
      return out
    },
  },

  // Marker left behind once Rollback Plan triggers (never offered).
  { id: 'rollback_used', name: 'Rollback Plan (used)', icon: '🧯', tier: 'starter', text: 'Already rolled back once. Hope you learned something.' },
]

export const RELIC: Record<string, RelicDef> = Object.fromEntries(defs.map((d) => [d.id, d]))
/** Class-agnostic commons (used by perks, events and OKR rewards). */
export const COMMON_RELICS = defs.filter((d) => d.tier === 'common' && !d.cls).map((d) => d.id)
export const BOSS_RELICS = defs.filter((d) => d.tier === 'boss').map((d) => d.id)

// ---------- hook runner ----------

type HookName = 'onCombatStart' | 'onTurnStart' | 'onTurnEnd'
export function runRelics(c: Combat, hook: HookName) {
  for (const id of c.relics) RELIC[id]?.[hook]?.(c)
}
export function relicsCardPlayed(c: Combat, card: CardInst) {
  for (const id of c.relics) RELIC[id]?.onCardPlayed?.(c, card)
}
export function relicsCombatEnd(run: Run, c: Combat): Run {
  let r = run
  for (const id of c.relics) r = RELIC[id]?.onCombatEnd?.(r, c) ?? r
  return r
}
/** Extra max Energy from relics declaring `energy` (the original three energy relics are applied in startCombat). */
export const relicEnergy = (relics: string[]) => relics.reduce((s, id) => s + (RELIC[id]?.energy ?? 0), 0)

relicEvents.exhaust = (c, n, bugs) => {
  for (const id of c.relics) RELIC[id]?.onExhaust?.(c, n, bugs)
}
relicEvents.enemyDeath = (c, e) => {
  for (const id of c.relics) RELIC[id]?.onEnemyDeath?.(c, e)
}
relicEvents.hpLoss = (c, n) => {
  for (const id of c.relics) RELIC[id]?.onPlayerHpLoss?.(c, n)
}

// ---------- static modifiers ----------

export function relicMods(relics: string[]) {
  let shopMul = 1
  let restBonus = 0
  let cardChoice = 0
  let tokenMul = 1
  let shopExtraCards = 0
  for (const id of relics) {
    const d = RELIC[id]
    if (!d) continue
    shopMul *= d.shopMul ?? 1
    restBonus += d.restBonus ?? 0
    cardChoice += d.cardChoice ?? 0
    tokenMul *= d.tokenMul ?? 1
    shopExtraCards += d.shopExtraCards ?? 0
  }
  return { shopMul, restBonus, cardChoice, tokenMul, shopExtraCards }
}

// ---------- acquisition ----------

/** Relics of a tier this run could still receive (class-appropriate, not owned). */
export function eligible(run: Run, tier: RelicTier): string[] {
  return defs
    .filter((d) => d.tier === tier && (!d.cls || d.cls === run.character) && !run.relics.includes(d.id) && !(d.id === 'rollback_plan' && run.relics.includes('rollback_used')))
    .map((d) => d.id)
}

const WEIGHTS: Record<'elite' | 'treasure' | 'shop', [RelicTier, number][]> = {
  elite: [['common', 50], ['uncommon', 35], ['rare', 15]],
  treasure: [['common', 45], ['uncommon', 35], ['rare', 20]],
  shop: [['common', 35], ['uncommon', 30], ['rare', 15], ['shop', 20]],
}

/** Roll a relic by rarity for a reward source. Falls back to other tiers if one is exhausted; null if nothing is left. */
export function rollRelic(run: Run, source: 'elite' | 'treasure' | 'shop', rng: () => number = Math.random, exclude: string[] = []): string | null {
  const table = WEIGHTS[source].map(([t, w]) => [t, w, eligible(run, t).filter((id) => !exclude.includes(id))] as const).filter(([, , pool]) => pool.length)
  if (!table.length) return null
  const total = table.reduce((s, [, w]) => s + w, 0)
  let roll = rng() * total
  for (const [, w, pool] of table) {
    if ((roll -= w) <= 0) return pool[Math.floor(rng() * pool.length)]
  }
  const last = table[table.length - 1][2]
  return last[Math.floor(rng() * last.length)]
}

export function rollBossRelics(run: Run, n = 3): string[] {
  const pool = [...eligible(run, 'boss')]
  const out: string[] = []
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  return out
}

const BASE_PRICE: Record<RelicTier, number> = { starter: 150, common: 140, uncommon: 190, rare: 250, boss: 300, shop: 160 }
/** Shop price in tokens by tier, ±10%, rounded to 1k. */
export function relicPrice(id: string): number {
  const base = BASE_PRICE[RELIC[id]?.tier ?? 'common']
  return Math.round(base * (0.9 + Math.random() * 0.2)) * 1000
}

/** Add a relic to the run and apply its pickup effect. */
export function grantRelic(run: Run, id: string): Run {
  const r: Run = { ...run, relics: [...run.relics, id] }
  return RELIC[id]?.onPickup?.(r) ?? r
}
