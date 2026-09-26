import { emptyCombatStats } from './stats'
import type { CardInst, Combat, EnemyInst, Fighter, StatusId } from './types'

let seq = 1
export const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`
export const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const st = (f: Fighter, id: StatusId) => f.statuses[id] ?? 0

/** Relic event hooks, filled in by relics.ts (kept here to avoid a circular import). */
export const relicEvents: {
  exhaust: (c: Combat, n: number, bugs: number) => void
  enemyDeath: (c: Combat, e: EnemyInst) => void
  hpLoss: (c: Combat, n: number) => void
} = { exhaust: () => {}, enemyDeath: () => {}, hpLoss: () => {} }

/** Enemy event hooks, filled in by enemies.ts (kept here to avoid a circular import). */
export const enemyEvents: {
  /** Player-sourced damage to an enemy: `amount` counts HP and Block removed; `blockBroken` when Block hit 0. */
  damaged: (c: Combat, e: EnemyInst, amount: number, blockBroken: boolean) => void
} = { damaged: () => {} }

/** A one-off centre-screen banner (e.g. a boss changing phase). */
export function banner(c: Combat, title: string, text: string) {
  c.banner = { id: seq++, title, text }
}

/** Combat stats (created lazily so combats restored from older saves still work). */
export const cstats = (c: Combat) => (c.stats ??= emptyCombatStats())

export function getFighter(c: Combat, id: string): Fighter | undefined {
  if (id === 'player') return c.player
  return c.enemies.find((e) => e.uid === id)
}

export const livingEnemies = (c: Combat) => c.enemies.filter((e) => !e.dead)
export const randomEnemy = (c: Combat): EnemyInst | undefined => {
  const l = livingEnemies(c)
  return l.length ? pick(l) : undefined
}

export function addFloat(c: Combat, target: string, text: string, kind: Combat['floats'][number]['kind']) {
  c.floats.push({ id: seq++, target, text, kind })
}

export function fx(c: Combat, target: string, kind: Combat['fx'][number]['kind'], big = false) {
  c.fx.push({ id: seq++, target, kind, big })
}

/** A status or curse card in hand did something: pop it up so the player sees why. */
export function cardTrigger(c: Combat, cardId: string, text: string) {
  c.cardFx = [...(c.cardFx ?? []), { id: seq++, cardId, text }].slice(-6)
}

export function say(c: Combat, target: string, text: string) {
  c.speech = { target, text, id: seq++ }
}

export function log(c: Combat, msg: string) {
  c.log = [...c.log.slice(-40), msg]
}

export function anim(c: Combat, target: string, cls: string) {
  c.anim[target] = `${cls} a${seq++ % 2}`
}

const DEBUFFS: StatusId[] = ['weak', 'vulnerable', 'frail', 'excursion']

export function addStatus(c: Combat, target: string, id: StatusId, n: number) {
  const f = getFighter(c, target)
  if (!f || n === 0) return
  if (target !== 'player' && (f as EnemyInst).dead) return
  // Dry Ice Pack: apply 1 extra Excursion.
  if (id === 'excursion' && target !== 'player' && n > 0 && c.relics.includes('dry_ice')) {
    const key = 'dry'
    const state = (c.relicState ??= {})
    if (state[key] !== c.turn) {
      state[key] = c.turn
      n += 1
    }
  }
  f.statuses[id] = (f.statuses[id] ?? 0) + n
  if (f.statuses[id] === 0) delete f.statuses[id]
  if (id === 'excursion' && target !== 'player' && n > 0) cstats(c).excursionApplied += n
  if (id === 'capacitor' && target === 'player') cstats(c).maxCharge = Math.max(cstats(c).maxCharge, f.statuses[id] ?? 0)
  if (DEBUFFS.includes(id) || n < 0) addFloat(c, target, `${n > 0 ? '+' : ''}${n} ${STATUS_INFO[id].name}`, 'status')
  if (n > 0) fx(c, target, DEBUFFS.includes(id) ? 'debuff' : 'buff')
}

export function attackValue(c: Combat, source: string, target: string | null, base: number): number {
  const s = getFighter(c, source)
  let dmg = base
  if (s) {
    dmg += st(s, 'strength') + st(s, 'tempStrength')
    if (st(s, 'weak') > 0) dmg = Math.floor(dmg * 0.75)
  }
  const t = target ? getFighter(c, target) : undefined
  if (t && st(t, 'vulnerable') > 0) dmg = Math.floor(dmg * 1.5)
  return Math.max(0, dmg)
}

/** Apply already-computed damage to a target through block. Returns HP lost. */
export function applyDamage(c: Combat, target: string, dmg: number, source?: string): number {
  const t = getFighter(c, target)
  if (!t) return 0
  if (target !== 'player' && (t as EnemyInst).dead) return 0
  let rest = dmg
  const blockBefore = t.block
  if (t.block > 0) {
    const absorbed = Math.min(t.block, rest)
    t.block -= absorbed
    rest -= absorbed
    if (absorbed > 0 && rest === 0) {
      addFloat(c, target, 'Blocked', 'block')
      fx(c, target, 'blockhit')
    }
  }
  // Travel Insurance: small attack hits on the player are reduced to 1.
  if (target === 'player' && source !== undefined && rest >= 2 && rest <= 5 && c.relics.includes('travel_insurance')) rest = 1
  if (rest > 0) {
    t.hp = Math.max(0, t.hp - rest)
    addFloat(c, target, `-${rest}`, 'damage')
    anim(c, target, 'hit')
    const big = rest >= 15
    fx(c, target, source === 'player' || source === 'thorns-player' ? 'slash' : 'claw', big)
    if (big) c.shake += 1
    if (source === 'player' || source === 'thorns-player') c.dmgDealt += rest
    if (target === 'player') {
      cstats(c).damageTaken += rest
      relicEvents.hpLoss(c, rest)
    }
  }
  if ((source === 'player' || source === 'thorns-player') && target !== 'player') {
    cstats(c).maxHit = Math.max(cstats(c).maxHit, Math.min(dmg, blockBefore) + rest)
    const removed = Math.min(dmg, blockBefore) + rest
    if (removed > 0 && !(t as EnemyInst).dead) enemyEvents.damaged(c, t as EnemyInst, removed, blockBefore > 0 && t.block === 0)
  }
  if (target !== 'player' && t.hp <= 0 && !(t as EnemyInst).dead) {
    ;(t as EnemyInst).dead = true
    t.block = 0
    fx(c, target, 'death', true)
    relicEvents.enemyDeath(c, t as EnemyInst)
  }
  return rest
}

/** A full attack: strength/weak/vulnerable, tipsy misses, thorns. */
export function attack(c: Combat, source: string, target: string, base: number): number {
  const s = getFighter(c, source)
  if (!s || s.hp <= 0) return 0
  const t = getFighter(c, target)
  if (!t || (target !== 'player' && (t as EnemyInst).dead)) return 0
  const tipsy = st(s, 'tipsy')
  if (tipsy > 0 && Math.random() * 100 < tipsy) {
    addFloat(c, target, '*hic* Miss!', 'miss')
    return 0
  }
  const dmg = attackValue(c, source, target, base)
  const lost = applyDamage(c, target, dmg, source)
  const thorns = st(t, 'thorns')
  if (thorns > 0) applyDamage(c, source, thorns, target === 'player' ? 'thorns-player' : 'thorns')
  return lost
}

export function loseHp(c: Combat, target: string, n: number) {
  const f = getFighter(c, target)
  if (!f || n <= 0) return
  if (target === 'player') cstats(c).damageTaken += Math.min(n, f.hp)
  f.hp = Math.max(0, f.hp - n)
  addFloat(c, target, `-${n}`, 'damage')
  fx(c, target, 'heat')
  anim(c, target, 'hit')
  if (target === 'player') relicEvents.hpLoss(c, n)
  if (target !== 'player' && f.hp <= 0 && !(f as EnemyInst).dead) {
    ;(f as EnemyInst).dead = true
    fx(c, target, 'death', true)
    relicEvents.enemyDeath(c, f as EnemyInst)
  }
}

export function gainBlock(c: Combat, target: string, base: number, raw = false) {
  const f = getFighter(c, target)
  if (!f) return
  let n = base
  if (!raw) {
    n += st(f, 'dexterity')
    if (st(f, 'frail') > 0) n = Math.floor(n * 0.75)
  }
  if (target === 'player' && c.rules?.blockMul !== undefined) n = Math.floor(n * c.rules.blockMul)
  n = Math.max(0, n)
  if (n === 0) return
  f.block += n
  if (target === 'player') {
    cstats(c).blockGained += n
    cstats(c).maxBlock = Math.max(cstats(c).maxBlock, f.block)
  }
  addFloat(c, target, `+${n} Block`, 'block')
  fx(c, target, 'shield')
  if (target === 'player' && st(f, 'auditTrail') > 0) {
    const e = randomEnemy(c)
    if (e) applyDamage(c, e.uid, st(f, 'auditTrail'), 'player')
  }
}

export function heal(c: Combat, target: string, n: number) {
  const f = getFighter(c, target)
  if (!f) return
  const h = Math.min(n, f.maxHp - f.hp)
  if (h <= 0) return
  f.hp += h
  if (target === 'player') cstats(c).healed += h
  addFloat(c, target, `+${h}`, 'heal')
  fx(c, target, 'heal')
}

export function mkCard(id: string, upgraded = false): CardInst {
  return { uid: uid(), id, upgraded }
}

export function drawCards(c: Combat, n: number) {
  for (let i = 0; i < n; i++) {
    if (c.hand.length >= 10) break
    if (c.draw.length === 0) {
      if (c.discard.length === 0) break
      c.draw = shuffle(c.discard)
      c.discard = []
    }
    const card = c.draw.pop()!
    c.hand.push(card)
    if (card.id === 'hangover') {
      c.energy = Math.max(0, c.energy - 1)
      addFloat(c, 'player', '-1 Energy (Hangover)', 'status')
      cardTrigger(c, 'hangover', '−1 Energy')
    }
    if (card.id === 'pc_load_letter') {
      // Paper jam: another random card in hand gets discarded.
      const others = c.hand.filter((h) => h.uid !== card.uid && h.id !== 'pc_load_letter')
      if (others.length) {
        const victim = pick(others)
        c.hand.splice(c.hand.indexOf(victim), 1)
        c.discard.push(victim)
        cardTrigger(c, 'pc_load_letter', 'Paper jam! A card is discarded')
      }
    }
    if (card.id === 'hiring_freeze') {
      if (freezeRandomCard(c, card.uid)) cardTrigger(c, 'hiring_freeze', 'A card is frozen')
    }
  }
}

/** Freeze a random playable card in hand for the rest of the turn. Returns whether one was frozen. */
export function freezeRandomCard(c: Combat, exceptUid?: string): boolean {
  const pool = c.hand.filter((h) => h.uid !== exceptUid && !h.frozen && !['status', 'curse'].includes(cardType(h.id)))
  if (!pool.length) return false
  const card = pick(pool)
  card.frozen = true
  addFloat(c, 'player', '🧊 Card frozen', 'status')
  return true
}

/** Card types by id, registered by cards.ts (avoids a circular import). */
export const cardTypes: Record<string, string> = {}
const cardType = (id: string) => cardTypes[id] ?? 'skill'

export function addCards(c: Combat, id: string, where: 'draw' | 'discard' | 'hand', n: number) {
  for (let i = 0; i < n; i++) {
    const card = mkCard(id)
    if (where === 'hand' && c.hand.length < 10) c.hand.push(card)
    else if (where === 'draw') c.draw.splice(Math.floor(Math.random() * (c.draw.length + 1)), 0, card)
    else c.discard.push(card)
  }
}

export const STATUS_INFO: Record<StatusId, { name: string; icon: string; desc: string; debuff?: boolean }> = {
  strength: { name: 'Strength', icon: '💪', desc: 'Increases attack damage by X.' },
  dexterity: { name: 'Dexterity', icon: '🧤', desc: 'Increases Block gained from cards by X.' },
  weak: { name: 'Weak', icon: '🥀', desc: 'Deals 25% less attack damage. Lasts X turns.', debuff: true },
  vulnerable: { name: 'Vulnerable', icon: '🎯', desc: 'Takes 50% more attack damage. Lasts X turns.', debuff: true },
  frail: { name: 'Frail', icon: '🦴', desc: 'Gains 25% less Block. Lasts X turns.', debuff: true },
  excursion: { name: 'Excursion', icon: '🌡️', desc: 'Temperature excursion! Loses X HP at the start of its turn, then X decreases by 1.', debuff: true },
  metallicize: { name: 'Insulated', icon: '🧊', desc: 'Gains X Block at the end of its turn.' },
  ritual: { name: '200-Slide Deck', icon: '📊', desc: 'Gains X Strength at the end of its turn.' },
  thorns: { name: 'Crystalline Skin', icon: '💎', desc: 'Attackers take X damage.' },
  tempStrength: { name: 'Humblebrag', icon: '📣', desc: 'Temporary Strength. Lost at end of turn.' },
  ota: { name: 'OTA Update', icon: '📡', desc: 'Gain X Strength at the start of each turn.' },
  sprint: { name: 'Sprint Planning', icon: '🗂️', desc: 'Draw X additional cards each turn.' },
  fleet: { name: 'Saga Fleet', icon: '🛰️', desc: 'At the start of your turn, apply X Excursion to ALL enemies.' },
  doubleTap: { name: 'Pair Programming', icon: '👯', desc: 'Your next X Attacks this turn are played twice.' },
  auditTrail: { name: 'Audit Trail', icon: '🧾', desc: 'Whenever you gain Block, deal X damage to a random enemy.' },
  tipsy: { name: 'Tipsy', icon: '🍺', desc: 'X% chance for each hit to miss.' },
  charge: { name: 'Nitrate Charge', icon: '🧨', desc: 'At 3 charges, something explodes.' },
  energyDown: { name: 'Hungover', icon: '🥴', desc: 'Lose X Energy next turn.', debuff: true },
  capacitor: { name: 'Charge', icon: '⚡', desc: 'Stored Charge (X). Discharge cards consume it for big effects.' },
  watchdog: { name: 'Watchdog Timer', icon: '🐕', desc: 'At the end of your turn, exhaust all Bugs in your hand and gain X Block for each.' },
  memsafe: { name: 'Memory Safety', icon: '🦀', desc: 'Whenever you exhaust a Bug, draw 1 card and gain X Block.' },
  capbank: { name: 'Capacitor Bank', icon: '🔋', desc: 'At the start of your turn, gain X Charge.' },
  thermalpad: { name: 'Thermal Pad', icon: '🟦', desc: 'At the end of your turn, gain Block equal to X times your Charge.' },
  tesla: { name: 'Tesla Coil', icon: '🌩️', desc: 'At the end of your turn, deal damage equal to your Charge to ALL enemies.' },
  certificate: { name: 'Traceable Certificate', icon: '📑', desc: 'At the start of your turn, gain Block from the total Excursion on all enemies (max 15).' },
  hysteresis: { name: 'Hysteresis', icon: '➰', desc: 'Excursion on enemies no longer decreases.' },
  speed: { name: 'Speed', icon: '💨', desc: 'Speed X. Every 3rd turn Frank RAMs you for 12 + 3 per Speed. Each 6 Block you hold when he acts knocks off 1 Speed. Gains 2 Speed each turn.' },
  layers: { name: 'Pallet Layers', icon: '🪵', desc: 'X layers left. Each time you break its Block it loses a layer and you draw 1 card. At 0 layers it falls apart (Vulnerable).' },
  clout: { name: 'Clout', icon: '📱', desc: 'Gains 1 Strength (Followers) whenever you play an Attack. Loses 1 when you play a Skill.' },
  costcut: { name: 'Cost Cutting', icon: '✂️', desc: 'While this enemy has Block, your cards that cost 2 or more cost 1 more. Break the Block to lift it. Also freezes a card in your hand each turn.' },
  escape: { name: 'Headhunting', icon: '🏃', desc: 'Escapes with the card it is after in X turns. Defeat it first!', debuff: true },
  docReview: { name: 'Documentation Review', icon: '📑', desc: 'Phase 1: your Block gains are halved. X turns until the phase closes with 2 Findings.' },
  traceability: { name: 'Traceability Check', icon: '🔗', desc: 'Phase 2: playing a card you already played this turn costs you 3 HP. X turns until the phase closes with 2 Findings.' },
  tempMapping: { name: 'Temperature Mapping', icon: '🌡️', desc: 'Phase 3: Excursion damage on you is doubled. The final phase.' },
  auditGate: { name: 'Phase Gate', icon: '🚪', desc: 'Deal X more damage to the Audit this turn to force it into its next phase.' },
}

// ---------- class mechanics ----------

type Pile = 'hand' | 'draw' | 'discard'

export function countBugs(c: Combat, where: Pile[] = ['hand', 'draw', 'discard']): number {
  return where.reduce((n, w) => n + c[w].filter((x) => x.id === 'bug').length, 0)
}

/** Exhaust Bug cards from the given piles. Triggers J-Link and Memory Safety. Returns how many were exhausted. */
export function exhaustBugs(c: Combat, where: Pile[], max = Infinity): number {
  let n = 0
  for (const w of where) {
    const pile = c[w]
    for (let i = pile.length - 1; i >= 0 && n < max; i--) {
      if (pile[i].id === 'bug') {
        c.exhaust.push(pile.splice(i, 1)[0])
        n++
      }
    }
  }
  if (n === 0) return 0
  cstats(c).bugsExhausted += n
  cstats(c).cardsExhausted += n
  relicEvents.exhaust(c, n, n)
  addFloat(c, 'player', `-${n} Bug${n > 1 ? 's' : ''}`, 'status')
  if (c.relics.includes('jlink')) {
    for (let i = 0; i < n; i++) {
      const e = randomEnemy(c)
      if (e) applyDamage(c, e.uid, 7, 'player')
    }
  }
  const mem = st(c.player, 'memsafe')
  if (mem > 0) {
    drawCards(c, Math.min(n, 3))
    gainBlock(c, 'player', mem * n, true)
  }
  return n
}

export const charge = (c: Combat) => st(c.player, 'capacitor')

export function gainCharge(c: Combat, n: number) {
  if (n <= 0) return
  c.player.statuses.capacitor = charge(c) + n
  cstats(c).maxCharge = Math.max(cstats(c).maxCharge, charge(c))
  addFloat(c, 'player', `+${n} ⚡`, 'status')
}

/** Remove all Charge and return how much there was. */
export function consumeCharge(c: Combat): number {
  const n = charge(c)
  if (n > 0) {
    delete c.player.statuses.capacitor
    addFloat(c, 'player', `-${n} ⚡`, 'status')
  }
  return n
}

export const totalExcursion = (c: Combat) => livingEnemies(c).reduce((s, e) => s + st(e, 'excursion'), 0)
