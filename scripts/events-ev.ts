// Rough expected value of every event option, in "points": 1 HP = 1, 1 Max HP = 3, 1k tokens = 0.25,
// common/uncommon/rare card = 8/12/18, upgrade = 8, card removal = 10, relic = 20, curse/status in deck = -12.
import { DEF } from '../src/game/cards'
import { mkCard } from '../src/game/core'
import { EVENTS } from '../src/game/events'
import { emptyRunStats } from '../src/game/stats'
import type { Run } from '../src/game/types'

const mem = new Map<string, string>()
;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v), removeItem: (k: string) => mem.delete(k) }

const base = (): Run => ({
  character: 'fw', hp: 50, maxHp: 80, gold: 150000,
  deck: [...Array(4)].map(() => mkCard('ping')).concat([...Array(4)].map(() => mkCard('insulate')), [mkCard('printf'), mkCard('breakpoint'), mkCard('sugar_crash')]),
  relics: ['jlink'], act: 2, map: { nodes: {}, rows: 0, bossId: '' }, position: null, floor: 8, seenBosses: [],
  stats: emptyRunStats(), settings: ['m2', 's3', 'logipharma', 'mine'], companion: null, okr: null, reviewLevel: 0, startedAt: 0,
})

const cardVal = (id: string) => {
  const d = DEF[id]
  if (d.type === 'curse' || d.type === 'status') return -12
  return d.rarity === 'rare' ? 18 : d.rarity === 'uncommon' ? 12 : 8
}

function value(before: Run, after: Run, text: string): number {
  let v = (after.hp - before.hp) + 3 * (after.maxHp - before.maxHp) + 0.25 * ((after.gold - before.gold) / 1000)
  const bu = new Map(before.deck.map((c) => [c.uid, c]))
  for (const c of after.deck) {
    const o = bu.get(c.uid)
    if (!o) v += cardVal(c.id)
    else if (!o.upgraded && c.upgraded) v += 8
  }
  const au = new Set(after.deck.map((c) => c.uid))
  for (const c of before.deck) if (!au.has(c.uid)) v += DEF[c.id].type === 'curse' ? 15 : 10
  v += 20 * after.relics.filter((r) => !before.relics.includes(r)).length
  if (text === 'REMOVE') v += 10
  return v
}

const rows: string[] = []
for (const ev of EVENTS) {
  const vals = ev.options.map((o) => {
    let sum = 0
    const n = 400
    for (let i = 0; i < n; i++) {
      const b = base()
      if (o.enabled && !o.enabled(b)) return NaN
      const res = o.apply(b)
      sum += value(b, res.run, res.text)
    }
    return sum / n
  })
  const spread = Math.max(...vals.filter((x) => !isNaN(x))) - Math.min(...vals.filter((x) => !isNaN(x)))
  const best = Math.max(...vals.filter((x) => !isNaN(x)))
  const flag = best > 40 ? '  ⚠ high' : best < 5 ? '  ⚠ low' : spread > 25 ? '  ⚠ one option dominates?' : ''
  rows.push(`${ev.title.slice(0, 34).padEnd(36)}${vals.map((v, i) => `${ev.options[i].label.slice(0, 22)}: ${isNaN(v) ? 'n/a' : v.toFixed(0)}`).join(' | ')}${flag}`)
}
console.log(rows.join('\n'))
