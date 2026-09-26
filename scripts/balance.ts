// Balance matrix: a greedy bot plays elites and bosses per character under several scenarios
// (baseline, each companion, Rewrite upgrades, Performance Review 5/10, first-win perk).
// Usage: npx tsx scripts/balance.ts   (N=150 by default; set N=400 for tighter numbers)
import { DEF, canRewrite, incomingDamage, poolFor } from '../src/game/cards'
import { canPlay, endPlayerTurn, enemyAct, finishEnemyPhase, playCard, startCombat } from '../src/game/combat'
import { CHARACTERS, CHARACTER_IDS } from '../src/game/characters'
import { COMPANION_IDS } from '../src/game/companions'
import { charge, livingEnemies, mkCard, pick, st } from '../src/game/core'
import { applyPerk, PERK_LADDER } from '../src/meta/career'
import { applyReviewStart } from '../src/meta/review'
import { emptyRunStats } from '../src/game/stats'
import type { CharId, Combat, Run } from '../src/game/types'

// The meta module reads localStorage; give it an in-memory stand-in.
const mem = new Map<string, string>()
;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v), removeItem: (k: string) => mem.delete(k) }

const N = Number(process.env.N ?? 150)

interface Scenario {
  name: string
  companion?: string
  rewrite?: boolean
  review?: number
  perk?: boolean
}

function mkRun(ch: CharId, extra: number, act: number, s: Scenario): Run {
  const def = CHARACTERS[ch]
  const deck = def.deck.map((id) => mkCard(id))
  for (let i = 0; i < Math.min(act - 1, 3) * 2; i++) {
    const idx = deck.findIndex((c) => c.id === (i % 2 ? 'insulate' : 'ping'))
    if (idx >= 0) deck.splice(idx, 1)
  }
  const pool = poolFor(ch)
  for (let i = 0; i < extra; i++) {
    const id = pick(pool).id
    const up = Math.random() < 0.3
    deck.push({ ...mkCard(id, up), ...(up && s.rewrite && canRewrite(id) ? { rewrite: true } : {}) })
  }
  const relics = [def.relic, ...(act >= 2 ? ['espresso', 'hoodie'] : []), ...(act >= 3 ? ['energy_drink', 'gdp_cert'] : []), ...(act >= 4 ? ['headphones', 'corner_office'] : [])]
  let run: Run = {
    character: ch, hp: def.hp, maxHp: def.hp, gold: 0, deck, relics, act,
    map: { nodes: {}, rows: 0, bossId: '' }, position: null, floor: 0, seenBosses: [],
    stats: emptyRunStats(), settings: ['m2', 's3', 'logipharma', 'mine'],
    companion: s.companion ? { id: s.companion, level: Math.min(3, act) } : null,
    okr: null, reviewLevel: s.review ?? 0, startedAt: 0,
  }
  if (s.review) run = applyReviewStart(run)
  if (s.perk) run = applyPerk(run, PERK_LADDER[ch][0])
  return run
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

function fight(ch: CharId, ids: string[], extra: number, act: number, hpFrac: number, s: Scenario, kind: Combat['kind']) {
  const r = mkRun(ch, extra, act, s)
  r.hp = Math.round(r.maxHp * hpFrac)
  let c: Combat = startCombat(r, ids, kind)
  let guard = 0
  while (c.phase !== 'won' && c.phase !== 'lost' && guard++ < 400) {
    let progress = true
    while (progress && c.phase === 'player') {
      progress = false
      for (const card of [...c.hand].sort((a, b) => score(c, b.id) - score(c, a.id))) {
        if (!canPlay(c, card) || score(c, card.id) < 0) continue
        const living = livingEnemies(c)
        const t = /target's Excursion|loses HP equal/.test(DEF[card.id].text(false)) ? living.sort((a, b) => st(b, 'excursion') - st(a, 'excursion'))[0] : living.sort((a, b) => a.hp - b.hp)[0]
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
  return c.phase === 'won'
}

const FIGHTS: [string, string[], number, number, number, Combat['kind']][] = [
  ['Auditor (A1e)', ['lead_auditor'], 4, 1, 0.93, 'elite'],
  ['P&C (A1)', ['boss_pc'], 7, 1, 0.87, 'boss'],
  ['Roche VP (A2e)', ['roche_vp'], 9, 2, 0.93, 'elite'],
  ['CTO (A2)', ['boss_cto'], 12, 2, 1, 'boss'],
  ['Inspector (A3e)', ['fda_inspector'], 15, 3, 1, 'elite'],
  ['CEO (A3)', ['boss_ceo'], 17, 3, 1, 'boss'],
  ['Peter (A4)', ['boss_peter'], 20, 4, 1, 'boss'],
]

const SCENARIOS: Scenario[] = [
  { name: 'baseline' },
  ...COMPANION_IDS.map((id) => ({ name: `+${id}`, companion: id })),
  { name: 'rewrite upgrades', rewrite: true },
  { name: 'first-win perk', perk: true },
  { name: 'review 5', review: 5 },
  { name: 'review 10', review: 10 },
]

const rate = (ch: CharId, f: (typeof FIGHTS)[number], s: Scenario) => {
  let w = 0
  for (let i = 0; i < N; i++) if (fight(ch, f[1], f[2], f[3], f[4], s, f[5])) w++
  return Math.round((100 * w) / N)
}

const results: Record<string, Record<string, Record<string, number>>> = {}
for (const ch of CHARACTER_IDS) {
  console.log(`\n=== ${CHARACTERS[ch].name} (win % per fight, N=${N}) ===`)
  console.log('scenario'.padEnd(20) + FIGHTS.map((f) => f[0].padStart(16)).join('') + '     avg')
  results[ch] = {}
  for (const s of SCENARIOS) {
    const row = FIGHTS.map((f) => rate(ch, f, s))
    results[ch][s.name] = Object.fromEntries(FIGHTS.map((f, i) => [f[0], row[i]]))
    const avg = Math.round(row.reduce((a, b) => a + b, 0) / row.length)
    console.log(s.name.padEnd(20) + row.map((v) => `${v}%`.padStart(16)).join('') + `${avg}%`.padStart(8))
  }
}
