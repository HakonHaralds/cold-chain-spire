import { DEF, cardCost } from './cards'
import { addCards, addStatus, anim, applyDamage, charge, drawCards, exhaustBugs, gainBlock, gainCharge, livingEnemies, log, loseHp, shuffle, st, totalExcursion } from './core'
import { ENEMY, intentOf, mkEnemy, speak } from './enemies'
import type { CardInst, Combat, Run, StatusId } from './types'

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
    maxEnergy: 3 + (run.relics.includes('espresso') ? 1 : 0) + (run.relics.includes('stock_options') ? 1 : 0) + (run.relics.includes('unlimited_pto') ? 1 : 0),
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
  }
  if (run.relics.includes('energy_drink')) c.player.statuses.strength = 1
  if (run.relics.includes('unlimited_pto')) addCards(c, 'meeting', 'draw', 2)
  if (run.relics.includes('headphones')) c.player.statuses.dexterity = 1
  if (run.relics.includes('soldering_station')) gainCharge(c, 3)
  for (const e of c.enemies) {
    ENEMY[e.defId].start?.(e, c)
    e.move = ENEMY[e.defId].choose(e, c)
  }
  if (run.relics.includes('ref_thermometer')) for (const e of c.enemies) addStatus(c, e.uid, 'excursion', 2)
  const boss = c.enemies.find((e) => ENEMY[e.defId].tier === 'boss')
  if (boss) speak(c, boss, boss.move)
  return beginPlayerTurn(c)
}

function beginPlayerTurn(c: Combat): Combat {
  c.turn += 1
  c.phase = 'player'
  c.player.block = 0
  const p = c.player
  c.energy = c.maxEnergy - st(p, 'energyDown')
  delete p.statuses.energyDown
  if (st(p, 'ota')) addStatus(c, 'player', 'strength', st(p, 'ota'))
  if (st(p, 'excursion')) {
    loseHp(c, 'player', st(p, 'excursion'))
    addStatus(c, 'player', 'excursion', -1)
  }
  if (st(p, 'fleet')) for (const e of livingEnemies(c)) addStatus(c, e.uid, 'excursion', st(p, 'fleet'))
  if (st(p, 'capbank')) gainCharge(c, st(p, 'capbank'))
  if (st(p, 'certificate')) gainBlock(c, 'player', Math.min(15, Math.floor((totalExcursion(c) * st(p, 'certificate')) / 2)), true)
  if (c.turn === 1 && c.relics.includes('hoodie')) gainBlock(c, 'player', 10, true)
  let n = 5 + st(p, 'sprint') + (c.relics.includes('corner_office') ? 1 : 0)
  if (c.turn === 1 && c.relics.includes('standing_desk')) n += 2
  drawCards(c, n)
  checkEnd(c)
  return c
}

function checkEnd(c: Combat) {
  if (c.player.hp <= 0) c.phase = 'lost'
  else if (livingEnemies(c).length === 0) c.phase = 'won'
}

export function canPlay(c: Combat, card: CardInst): boolean {
  const d = DEF[card.id]
  if (c.phase !== 'player' || d.unplayable) return false
  return cardCost(card.id, card.upgraded) <= c.energy
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
  c.energy -= cardCost(card.id, card.upgraded)
  c.hand.splice(idx, 1)
  c.speech = null

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
  if (duck) {
    c.player.statuses.tempStrength = st(c.player, 'tempStrength') - 8
    if (!c.player.statuses.tempStrength) delete c.player.statuses.tempStrength
  }
  log(c, `You played ${d.name}${card.upgraded ? '+' : ''}.`)

  if (d.type !== 'power') {
    if (d.exhaust?.(card.upgraded)) c.exhaust.push(card)
    else c.discard.push(card)
  }
  checkEnd(c)
  return c
}

const PLAYER_TICK: StatusId[] = ['weak', 'vulnerable', 'frail']

export function endPlayerTurn(prev: Combat): Combat {
  const c = clone(prev)
  if (c.phase !== 'player') return prev
  c.speech = null
  const p = c.player
  for (const card of c.hand) {
    if (card.id === 'meeting') loseHp(c, 'player', 2)
    if (card.id === 'pip') loseHp(c, 'player', 3)
    if (card.id === 'malware') loseHp(c, 'player', 1)
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
  delete p.statuses.tempStrength
  delete p.statuses.doubleTap
  for (const card of c.hand) {
    if (DEF[card.id].ethereal) c.exhaust.push(card)
    else c.discard.push(card)
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
    loseHp(c, e.uid, st(e, 'excursion'))
    if (!st(c.player, 'hysteresis')) addStatus(c, e.uid, 'excursion', -1)
    if (e.dead) {
      checkEnd(c)
      return c
    }
  }
  const def = ENEMY[e.defId]
  const move = def.moves[e.move]
  if (intentOf(e, c).damage !== undefined) anim(c, e.uid, 'lunge-left')
  else anim(c, e.uid, 'pulse')
  speak(c, e, e.move)
  move.act(c, e)
  e.history.push(e.move)
  e.turn += 1
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
  return {
    ...run,
    hp,
    gold: Math.max(0, run.gold - c.goldStolen),
    stats: {
      ...run.stats,
      enemiesDefeated: run.stats.enemiesDefeated + c.enemies.filter((e) => e.dead).length,
      damageDealt: run.stats.damageDealt + c.dmgDealt,
    },
  }
}

