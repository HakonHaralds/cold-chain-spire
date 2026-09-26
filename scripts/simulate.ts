// Headless balance check: a greedy bot plays many fights per character against every elite and boss.
import { DEF, incomingDamage, poolFor } from '../src/game/cards'
import { canPlay, endPlayerTurn, enemyAct, finishEnemyPhase, playCard, startCombat } from '../src/game/combat'
import { CHARACTERS, CHARACTER_IDS } from '../src/game/characters'
import { charge, livingEnemies, mkCard, pick, st } from '../src/game/core'
import type { CharId, Combat, Run } from '../src/game/types'
import { emptyRunStats } from '../src/game/stats'

const N = Number(process.env.N ?? 300)
/** Optional companion for the bot, e.g. COMP=office_dog:2 */
const COMP = process.env.COMP

function mkRun(ch: CharId, extra: number, act: number): Run {
  const def = CHARACTERS[ch]
  const deck = def.deck.map((id) => mkCard(id))
  // A player removes some starter Pings/Insulates as the run goes on.
  for (let i = 0; i < Math.min(act - 1, 3) * 2; i++) {
    const idx = deck.findIndex((c) => c.id === (i % 2 ? 'insulate' : 'ping'))
    if (idx >= 0) deck.splice(idx, 1)
  }
  const pool = poolFor(ch)
  for (let i = 0; i < extra; i++) deck.push(mkCard(pick(pool).id, Math.random() < 0.3))
  const relics = [def.relic, ...(act >= 2 ? ['espresso', 'hoodie'] : []), ...(act >= 3 ? ['energy_drink', 'gdp_cert'] : []), ...(act >= 4 ? ['headphones', 'corner_office'] : [])]
  return {
    character: ch, hp: def.hp, maxHp: def.hp, gold: 0, deck, relics, act,
    map: { nodes: {}, rows: 0, bossId: '' }, position: null, floor: 0, seenBosses: [],
    stats: emptyRunStats(),
    settings: ['m2', 's3', 'logipharma', 'mine'],
    companion: COMP ? { id: COMP.split(':')[0], level: Number(COMP.split(':')[1] ?? 1) } : null,
    okr: null,
    reviewLevel: 0,
    startedAt: 0,
  }
}

function score(c: Combat, id: string): number {
  const d = DEF[id]
  const text = d.text(false)
  const need = incomingDamage(c) > c.player.block
  if (d.type === 'power') return 5
  if (d.discharge) return charge(c) >= 5 ? 4 : -1
  if (/Charge/.test(text) && !d.discharge) return 3
  if (/Draw|Energy/.test(text) && d.cost === 0) return 3.5
  const blocky = /Block/.test(text)
  if (need && blocky) return 2.5
  if (/Excursion/.test(text) && d.type === 'skill') return 2
  if (d.type === 'attack') return 1.5
  return blocky ? 0.5 : 1
}

function pickTarget(c: Combat, id: string) {
  const living = livingEnemies(c)
  if (/Excursion\./.test(DEF[id].text(false)) && /target's Excursion|loses HP equal/.test(DEF[id].text(false))) {
    return living.sort((a, b) => st(b, 'excursion') - st(a, 'excursion'))[0]
  }
  return living.sort((a, b) => a.hp - b.hp)[0]
}

function fight(ch: CharId, ids: string[], extra: number, act: number, hpFrac: number) {
  const r = mkRun(ch, extra, act)
  r.hp = Math.round(r.maxHp * hpFrac)
  let c: Combat = startCombat(r, ids, 'boss')
  let guard = 0
  while (c.phase !== 'won' && c.phase !== 'lost' && guard++ < 400) {
    let progress = true
    while (progress && c.phase === 'player') {
      progress = false
      const order = [...c.hand].sort((a, b) => score(c, b.id) - score(c, a.id))
      for (const card of order) {
        if (!canPlay(c, card) || score(c, card.id) < 0) continue
        const t = pickTarget(c, card.id)
        const next = playCard(c, card.uid, DEF[card.id].target === 'enemy' ? t?.uid ?? null : null)
        if (next !== c) {
          c = next
          progress = true
          break
        }
      }
    }
    if (c.phase !== 'player') break
    c = endPlayerTurn(c)
    for (const e of c.enemies.filter((x) => !x.dead).map((x) => x.uid)) c = enemyAct(c, e)
    c = finishEnemyPhase(c)
  }
  return { won: c.phase === 'won', turns: c.turn, hpLeft: c.player.hp }
}

const cases: [string, string[], number, number, number][] = [
  ['Act1 normal', ['sensitech_minion', 'sensitech_minion', 'temptale'], 0, 1, 1],
  ['Act1 elite', ['lead_auditor'], 4, 1, 0.93],
  ['P&C Director', ['boss_pc'], 7, 1, 0.87],
  ['Roche VP', ['roche_vp'], 9, 2, 0.93],
  ['CTO', ['boss_cto'], 12, 2, 1],
  ['Inspector', ['fda_inspector'], 15, 3, 1],
  ['CEO', ['boss_ceo'], 17, 3, 1],
  ['Peter', ['boss_peter'], 20, 4, 1],
]

console.log(`${'fight'.padEnd(14)}${CHARACTER_IDS.map((c) => c.padStart(18)).join('')}`)
for (const [name, ids, extra, act, hp] of cases) {
  const cols = CHARACTER_IDS.map((ch) => {
    let w = 0
    let left = 0
    for (let i = 0; i < N; i++) {
      const f = fight(ch, ids, extra, act, hp)
      if (f.won) {
        w++
        left += f.hpLeft
      }
    }
    return `${((100 * w) / N).toFixed(0).padStart(4)}% (hp ${(w ? left / w : 0).toFixed(0).padStart(2)})`.padStart(18)
  })
  console.log(`${name.padEnd(14)}${cols.join('')}`)
}
