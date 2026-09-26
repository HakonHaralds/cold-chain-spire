import { DEF, cardCost } from './cards'
import { addFloat, cardTrigger, relicEvents, addCards, addStatus, cstats, anim, applyDamage, charge, drawCards, exhaustBugs, gainBlock, gainCharge, livingEnemies, log, loseHp, shuffle, st, totalExcursion } from './core'
import { ENEMY, intentOf, mkEnemy, speak } from './enemies'
import { companionAct } from './companions'
import { relicEnergy, relicsCardPlayed, relicsCombatEnd, runRelics } from './relics'
import type { CardInst, Combat, Run, StatusId } from './types'
import { emptyCombatStats, emptyRunStats } from './stats'
import { applyReviewToEnemies } from '../meta/review'

const clone = (c: Combat): Combat => {
  const n = structuredClone(c)
  n.floats = n.floats.slice(-14)
  n.fx = n.fx.slice(-16)
  return n
}

export function startCombat(run: Run, enemyIds: string[], kind: Combat['kind']): Combat {
  const c: Combat = {
    player: { hp: run.hp, maxHp: run.maxHp, block: 0, statuses: {} },
    energy: 0,
    maxEnergy: 3 + (run.relics.includes('espresso') ? 1 : 0) + (run.relics.includes('stock_options') ? 1 : 0) + (run.relics.includes('unlimited_pto') ? 1 : 0) + relicEnergy(run.relics),
    enemies: enemyIds.map((id) => mkEnemy(id, run.act)),
    draw: shuffle(run.deck.map((d) => ({ ...d }))),
    hand: [],
    discard: [],
    exhaust: [],
    turn: 0,
    phase: 'player',
    floats: [],
    fx: [],
    shake: 0,
    speech: null,
    log: [],
    anim: {},
    attacksPlayed: 0,
    dmgDealt: 0,
    goldStolen: 0,
    kind,
    relics: run.relics,
    stats: emptyCombatStats(),
    reviewLevel: run.reviewLevel ?? 0,
    companion: run.companion ?? null,
    relicState: {},
  }
  if (run.relics.includes('energy_drink')) c.player.statuses.strength = 1
  applyReviewToEnemies(c)
  if (run.relics.includes('unlimited_pto')) addCards(c, 'meeting', 'draw', 2)
  if (run.relics.includes('headphones')) c.player.statuses.dexterity = 1
  if (run.relics.includes('soldering_station')) gainCharge(c, 3)
  for (const e of c.enemies) {
    ENEMY[e.defId].start?.(e, c)
    e.move = ENEMY[e.defId].choose(e, c)
  }
  if (run.relics.includes('ref_thermometer')) for (const e of c.enemies) addStatus(c, e.uid, 'excursion', 2)
  runRelics(c, 'onCombatStart')
  const boss = c.enemies.find((e) => ENEMY[e.defId].tier === 'boss')
  if (boss) speak(c, boss, boss.move)
  return beginPlayerTurn(c)
}

function beginPlayerTurn(c: Combat): Combat {
  c.turn += 1
  c.phase = 'player'
  cstats(c).cardsThisTurn = 0
  c.player.block = 0
  const p = c.player
  c.energy = c.maxEnergy - st(p, 'energyDown')
  delete p.statuses.energyDown
  if (st(p, 'ota')) addStatus(c, 'player', 'strength', st(p, 'ota'))
  if (st(p, 'excursion')) {
    loseHp(c, 'player', st(p, 'excursion') * (c.rules?.excursionMul ?? 1))
    addStatus(c, 'player', 'excursion', -1)
  }
  if (st(p, 'fleet')) for (const e of livingEnemies(c)) addStatus(c, e.uid, 'excursion', st(p, 'fleet'))
  if (st(p, 'capbank')) gainCharge(c, st(p, 'capbank'))
  if (st(p, 'certificate')) gainBlock(c, 'player', Math.min(15, Math.floor((totalExcursion(c) * st(p, 'certificate')) / 2)), true)
  if (c.turn === 1 && c.relics.includes('hoodie')) gainBlock(c, 'player', 10, true)
  let n = 5 + st(p, 'sprint') + (c.relics.includes('corner_office') ? 1 : 0)
  if (c.turn === 1 && c.relics.includes('standing_desk')) n += 2
  drawCards(c, n)
  c.playedThisTurn = []
  for (const e of livingEnemies(c)) ENEMY[e.defId].onPlayerTurnStart?.(e, c)
  runRelics(c, 'onTurnStart')
  companionAct(c, 'start')
  checkEnd(c)
  return c
}

function checkEnd(c: Combat) {
  if (c.player.hp <= 0) c.phase = 'lost'
  else if (livingEnemies(c).length === 0) c.phase = 'won'
}

/** What a card costs right now, including enemy effects (the CFO's Cost Cutting). */
export function playCost(c: Combat, card: CardInst): number {
  const base = cardCost(card.id, card.upgraded, card.rewrite)
  if (base >= 2 && livingEnemies(c).some((e) => st(e, 'costcut') > 0 && e.block > 0)) return base + 1
  return base
}

export function canPlay(c: Combat, card: CardInst): boolean {
  const d = DEF[card.id]
  if (c.phase !== 'player' || d.unplayable || card.frozen) return false
  return playCost(c, card) <= c.energy
}

export function playCard(prev: Combat, cardUid: string, target: string | null): Combat {
  const c = clone(prev)
  const idx = c.hand.findIndex((h) => h.uid === cardUid)
  if (idx < 0) return prev
  const card = c.hand[idx]
  const d = DEF[card.id]
  if (!canPlay(c, card)) return prev
  if (d.target === 'enemy') {
    const t = c.enemies.find((e) => e.uid === target && !e.dead)
    if (!t) return prev
  }
  c.energy -= playCost(c, card)
  c.hand.splice(idx, 1)
  c.speech = null
  // Global Audit, Traceability Check: replaying the same card in a turn costs HP.
  const played = (c.playedThisTurn ??= [])
  if (c.rules?.repeatPenalty && played.includes(card.id)) {
    loseHp(c, 'player', c.rules.repeatPenalty)
    addFloat(c, 'player', 'Traceability!', 'status')
  }
  played.push(card.id)

  let times = 1
  let duck = false
  if (d.type === 'attack') {
    anim(c, 'player', 'lunge')
    if (st(c.player, 'doubleTap') > 0) {
      times = 2
      addStatus(c, 'player', 'doubleTap', -1)
    }
    if (c.attacksPlayed === 0 && c.relics.includes('rubber_duck')) {
      duck = true
      c.player.statuses.tempStrength = st(c.player, 'tempStrength') + 8
    }
    c.attacksPlayed += 1
  }
  for (let i = 0; i < times; i++) d.play?.(c, target, card.upgraded)
  // Rewrite (branching upgrade): cheaper, but ships a Bug.
  if (card.rewrite) addCards(c, 'bug', 'draw', 1)
  if (duck) {
    c.player.statuses.tempStrength = st(c.player, 'tempStrength') - 8
    if (!c.player.statuses.tempStrength) delete c.player.statuses.tempStrength
  }
  log(c, `You played ${d.name}${card.upgraded ? '+' : ''}.`)
  const cs = cstats(c)
  cs.cardsPlayed += 1
  if (d.type === 'attack') cs.attacks += 1
  else if (d.type === 'skill') cs.skills += 1
  else if (d.type === 'power') cs.powers += 1
  cs.cardsThisTurn += 1
  cs.maxCardsInTurn = Math.max(cs.maxCardsInTurn, cs.cardsThisTurn)

  if (d.type !== 'power') {
    if (d.exhaust?.(card.upgraded)) {
      c.exhaust.push(card)
      cs.cardsExhausted += 1
      relicEvents.exhaust(c, 1, 0)
    } else c.discard.push(card)
  }
  relicsCardPlayed(c, card)
  for (const e of livingEnemies(c)) ENEMY[e.defId].onPlayerCardPlayed?.(e, c, card, d.type)
  checkEnd(c)
  return c
}

const PLAYER_TICK: StatusId[] = ['weak', 'vulnerable', 'frail']

export function endPlayerTurn(prev: Combat): Combat {
  const c = clone(prev)
  if (c.phase !== 'player') return prev
  c.speech = null
  const p = c.player
  cstats(c).energyWasted += Math.max(0, c.energy)
  runRelics(c, 'onTurnEnd')
  for (const card of c.hand) {
    if (card.id === 'meeting') {
      cardTrigger(c, 'meeting', '−2 HP')
      loseHp(c, 'player', 2)
    }
    if (card.id === 'pip') {
      cardTrigger(c, 'pip', '−3 HP')
      loseHp(c, 'player', 3)
    }
    if (card.id === 'malware') {
      cardTrigger(c, 'malware', '−1 HP')
      loseHp(c, 'player', 1)
    }
    if (card.id === 'finding') {
      cardTrigger(c, 'finding', '−2 HP')
      loseHp(c, 'player', 2)
    }
  }
  if (c.relics.includes('jlink')) exhaustBugs(c, ['hand'], 1)
  if (st(p, 'watchdog')) {
    const bugs = exhaustBugs(c, ['hand'])
    if (bugs) gainBlock(c, 'player', bugs * st(p, 'watchdog'), true)
  }
  if (st(p, 'metallicize')) gainBlock(c, 'player', st(p, 'metallicize'), true)
  if (st(p, 'thermalpad') && charge(c)) gainBlock(c, 'player', charge(c) * st(p, 'thermalpad'), true)
  if (st(p, 'tesla') && charge(c)) for (const e of livingEnemies(c)) applyDamage(c, e.uid, charge(c) * st(p, 'tesla'), 'player')
  if (c.relics.includes('gdp_cert')) gainBlock(c, 'player', 4, true)
  companionAct(c, 'end')
  delete p.statuses.tempStrength
  delete p.statuses.doubleTap
  for (const card of c.hand) {
    delete card.frozen
    if (DEF[card.id].ethereal) {
      c.exhaust.push(card)
      cstats(c).cardsExhausted += 1
      relicEvents.exhaust(c, 1, 0)
    } else c.discard.push(card)
  }
  c.hand = []
  for (const s of PLAYER_TICK) if (st(p, s)) addStatus(c, 'player', s, -1)
  c.phase = 'enemy'
  checkEnd(c)
  return c
}

const ENEMY_TICK: StatusId[] = ['weak', 'vulnerable', 'frail']

export function enemyAct(prev: Combat, enemyUid: string): Combat {
  const c = clone(prev)
  const e = c.enemies.find((x) => x.uid === enemyUid)
  if (!e || e.dead || c.phase !== 'enemy') return prev
  e.block = 0
  if (st(e, 'excursion')) {
    const edef = ENEMY[e.defId]
    loseHp(c, e.uid, Math.round(st(e, 'excursion') * (c.relics.includes('cold_room_door') ? 1.5 : 1) * (edef.excursionTaken ?? 1)))
    if (!st(c.player, 'hysteresis')) addStatus(c, e.uid, 'excursion', -Math.min(st(e, 'excursion'), edef.excursionDecay ?? 1))
    if (e.dead) {
      cstats(c).excursionKills += 1
      checkEnd(c)
      return c
    }
  }
  const def = ENEMY[e.defId]
  def.beforeAct?.(e, c)
  if (e.dead || e.escaped) {
    checkEnd(c)
    return c
  }
  const move = def.moves[e.move]
  if (intentOf(e, c).damage !== undefined) anim(c, e.uid, 'lunge-left')
  else anim(c, e.uid, 'pulse')
  speak(c, e, e.move)
  move.act(c, e)
  e.history.push(e.move)
  e.turn += 1
  if (!e.dead) def.afterAct?.(e, c)
  if (st(e, 'metallicize') && !e.dead) gainBlock(c, e.uid, st(e, 'metallicize'), true)
  if (st(e, 'ritual') && e.turn > 1) addStatus(c, e.uid, 'strength', st(e, 'ritual'))
  for (const s of ENEMY_TICK) if (st(e, s)) {
    e.statuses[s]! -= 1
    if (!e.statuses[s]) delete e.statuses[s]
  }
  checkEnd(c)
  return c
}

export function finishEnemyPhase(prev: Combat): Combat {
  const c = clone(prev)
  if (c.phase !== 'enemy') return prev
  for (const e of livingEnemies(c)) e.move = ENEMY[e.defId].choose(e, c)
  return beginPlayerTurn(c)
}

export function applyCombatResult(run: Run, c: Combat): Run {
  let hp = c.player.hp
  if (hp > 0 && run.relics.includes('saga_card')) hp = Math.min(run.maxHp, hp + 6)
  const stolen = new Set(c.stolenCards ?? [])
  return relicsCombatEnd(
    {
      ...run,
      deck: stolen.size ? run.deck.filter((d) => !stolen.has(d.uid)) : run.deck,
      hp,
      gold: Math.max(0, run.gold - c.goldStolen),
      stats: foldStats(run, c),
    },
    c,
  )
}

/** Fold one combat's counters into the run's lifetime stats. */
function foldStats(run: Run, c: Combat): Run['stats'] {
  const s = { ...emptyRunStats(), ...run.stats }
  const cs = cstats(c)
  const won = c.phase === 'won'
  return {
    ...s,
    enemiesDefeated: s.enemiesDefeated + c.enemies.filter((e) => e.dead && !e.escaped).length,
    damageDealt: s.damageDealt + c.dmgDealt,
    fights: s.fights + (won ? 1 : 0),
    elitesDefeated: s.elitesDefeated + (won && c.kind === 'elite' ? 1 : 0),
    bossesDefeated: s.bossesDefeated + (won && c.kind === 'boss' ? 1 : 0),
    flawlessFights: s.flawlessFights + (won && cs.damageTaken === 0 ? 1 : 0),
    damageTaken: s.damageTaken + cs.damageTaken,
    attacks: s.attacks + cs.attacks,
    skills: s.skills + cs.skills,
    powers: s.powers + cs.powers,
    maxHit: Math.max(s.maxHit, cs.maxHit),
    maxBlock: Math.max(s.maxBlock, cs.maxBlock),
    maxCardsInTurn: Math.max(s.maxCardsInTurn, cs.maxCardsInTurn),
    excursionApplied: s.excursionApplied + cs.excursionApplied,
    excursionKills: s.excursionKills + cs.excursionKills,
    bugsExhausted: s.bugsExhausted + cs.bugsExhausted,
    maxCharge: Math.max(s.maxCharge, cs.maxCharge),
    healed: s.healed + cs.healed,
    cardsExhausted: s.cardsExhausted + cs.cardsExhausted,
    fastestFight: won ? (s.fastestFight ? Math.min(s.fastestFight, c.turn) : c.turn) : s.fastestFight,
  }
}

