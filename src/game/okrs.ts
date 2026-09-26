import { DEF, poolFor } from './cards'
import { mkCard, pick, shuffle } from './core'
import { grantRelic, RELIC, rollRelic } from './relics'
import { tokensText } from './tokens'
import type { CharId, Run, RunStats } from './types'

/** Quarterly objectives (M29): pick one per act, finish it for a reward. */

type Reward =
  | { kind: 'tokens'; amount: number }
  | { kind: 'rare' }
  | { kind: 'relic' }
  | { kind: 'maxHp'; amount: number }
  | { kind: 'upgrade'; count: number }
  | { kind: 'trim'; count: number } // remove starter cards
  | { kind: 'combo'; amount: number } // rare card + tokens

export interface OkrDef {
  id: string
  icon: string
  title: string
  /** Target per act (index act-1). */
  targets: [number, number, number]
  /** Act 4 is only a rest, a shop and Peter: its own target, or null if the OKR can't be done there. */
  act4?: number | null
  desc: (target: number) => string
  /** Counter in RunStats measured since the OKR was chosen. */
  stat?: keyof RunStats
  /** Custom progress (overrides stat). Returns the current value. */
  progress?: (run: Run, delta: (k: keyof RunStats) => number) => number
  reward: (act: number) => Reward
  cls?: CharId
}

const defs: OkrDef[] = [
  { id: 'flawless', icon: '🧊', title: 'Zero Excursions', act4: null, targets: [2, 2, 3], stat: 'flawlessFights', desc: (t) => `Win ${t} fights without losing any HP.`, reward: () => ({ kind: 'rare' }) },
  { id: 'elite_hunter', icon: '😈', title: 'Escalation Path', act4: null, targets: [1, 2, 2], stat: 'elitesDefeated', desc: (t) => `Defeat ${t} elite${t > 1 ? 's' : ''}.`, reward: () => ({ kind: 'relic' }) },
  { id: 'velocity', icon: '🏎️', title: 'Velocity', act4: 40, targets: [60, 80, 100], stat: 'cardsPlayed', desc: (t) => `Play ${t} cards.`, reward: (a) => ({ kind: 'tokens', amount: 50000 + 25000 * a }) },
  { id: 'ship_it', icon: '🚀', title: 'Ship It', act4: 20, targets: [30, 40, 50], stat: 'attacks', desc: (t) => `Play ${t} Attacks.`, reward: () => ({ kind: 'upgrade', count: 2 }) },
  { id: 'process', icon: '📋', title: 'Process Excellence', act4: 15, targets: [25, 35, 45], stat: 'skills', desc: (t) => `Play ${t} Skills.`, reward: () => ({ kind: 'maxHp', amount: 6 }) },
  { id: 'platform', icon: '🏗️', title: 'Platform Thinking', act4: 3, targets: [2, 3, 4], stat: 'powers', desc: (t) => `Play ${t} Powers.`, reward: () => ({ kind: 'rare' }) },
  { id: 'revenue', icon: '📈', title: 'Revenue Target', act4: 400, targets: [400, 600, 800], stat: 'damageDealt', desc: (t) => `Deal ${t} damage.`, reward: (a) => ({ kind: 'tokens', amount: 60000 + 30000 * a }) },
  { id: 'headcount', icon: '✂️', title: 'Headcount Reduction', act4: null, targets: [8, 10, 12], stat: 'enemiesDefeated', desc: (t) => `Defeat ${t} enemies.`, reward: () => ({ kind: 'maxHp', amount: 8 }) },
  { id: 'cadence', icon: '📦', title: 'Delivery Cadence', act4: null, targets: [4, 5, 5], stat: 'fights', desc: (t) => `Win ${t} fights.`, reward: (a) => ({ kind: 'tokens', amount: 40000 + 20000 * a }) },
  { id: 'lean', icon: '🥗', title: 'Lean Deck', act4: 4, targets: [5, 7, 9], stat: 'cardsExhausted', desc: (t) => `Exhaust ${t} cards.`, reward: () => ({ kind: 'trim', count: 2 }) },
  { id: 'discovery', icon: '🧭', title: 'Customer Discovery', act4: null, targets: [2, 2, 3], stat: 'eventsVisited', desc: (t) => `Visit ${t} ❓ events.`, reward: (a) => ({ kind: 'tokens', amount: 40000 + 20000 * a }) },
  { id: 'invest', icon: '💸', title: 'Invest in Growth', act4: 120000, targets: [150000, 200000, 250000], stat: 'tokensSpent', desc: (t) => `Spend ${tokensText(t)}.`, reward: () => ({ kind: 'relic' }) },
  { id: 'paydown', icon: '🧹', title: 'Tech Debt Paydown', act4: 1, targets: [1, 1, 2], stat: 'removals', desc: (t) => `Remove ${t} card${t > 1 ? 's' : ''} from your deck.`, reward: () => ({ kind: 'upgrade', count: 2 }) },
  {
    id: 'always_on',
    icon: '⚡',
    title: 'Always On',
    targets: [1, 1, 1],
    desc: () => 'Beat this act’s boss without resting at a coffee machine.',
    progress: (_run, d) => (d('bossesDefeated') >= 1 && d('rests') === 0 ? 1 : 0),
    reward: (a) => ({ kind: 'combo', amount: 25000 * a }),
  },
  { id: 'bug_bash', icon: '🐛', title: 'Bug Bash', act4: 6, targets: [8, 12, 16], stat: 'bugsExhausted', desc: (t) => `Exhaust ${t} Bugs.`, reward: () => ({ kind: 'relic' }), cls: 'fw' },
  { id: 'breach', icon: '🌡️', title: 'Cold Chain Breach', act4: 25, targets: [30, 45, 60], stat: 'excursionApplied', desc: (t) => `Apply ${t} Excursion to enemies.`, reward: () => ({ kind: 'rare' }), cls: 'cal' },
]

export const OKRS: Record<string, OkrDef> = Object.fromEntries(defs.map((d) => [d.id, d]))

const targetFor = (d: OkrDef, act: number) => (act >= 4 && d.act4 != null ? d.act4 : d.targets[Math.min(3, Math.max(1, act)) - 1])

export function rewardText(r: Reward): string {
  switch (r.kind) {
    case 'tokens':
      return `+${tokensText(r.amount)}`
    case 'rare':
      return 'A random Rare card'
    case 'relic':
      return 'A random relic'
    case 'maxHp':
      return `+${r.amount} Max HP`
    case 'upgrade':
      return `Upgrade ${r.count} random cards`
    case 'trim':
      return `Remove ${r.count} starter cards (Ping/Insulate)`
    case 'combo':
      return `A Rare card and ${tokensText(r.amount)}`
  }
}

/** Title, description and reward text for the picker. */
export function describeOkr(id: string, act: number) {
  const d = OKRS[id]
  const t = targetFor(d, act)
  return { icon: d.icon, title: d.title, desc: d.desc(t), reward: rewardText(d.reward(act)), target: t }
}

/** Three options for the act, class-aware. */
export function rollOkrs(act: number, character: CharId): string[] {
  const pool = defs.filter((d) => (!d.cls || d.cls === character) && !(act >= 4 && d.act4 === null)).map((d) => d.id)
  return shuffle(pool).slice(0, 3)
}

export function startOkr(run: Run, id: string): Run {
  return { ...run, okr: { id, act: run.act, baseline: { ...run.stats }, done: false } }
}

export function okrProgress(run: Run): { current: number; target: number; done: boolean; claimed: boolean } | null {
  const o = run.okr
  if (!o) return null
  const d = OKRS[o.id]
  if (!d) return null
  const delta = (k: keyof RunStats) => (run.stats[k] ?? 0) - (o.baseline[k] ?? 0)
  const target = targetFor(d, o.act)
  const current = d.progress ? d.progress(run, delta) : d.stat ? delta(d.stat) : 0
  return { current: Math.min(current, target), target, done: current >= target, claimed: o.done }
}

function randomRare(run: Run): string {
  return pick(poolFor(run.character).filter((c) => c.rarity === 'rare')).id
}

function upgradeRandom(run: Run, n: number): Run {
  const cands = shuffle(run.deck.filter((c) => !c.upgraded && !['status', 'curse'].includes(DEF[c.id].type)))
  const pickIds = new Set(cands.slice(0, n).map((c) => c.uid))
  return { ...run, deck: run.deck.map((c) => (pickIds.has(c.uid) ? { ...c, upgraded: true } : c)) }
}

/** Grant the reward if the OKR is complete and unclaimed. Returns null when nothing to claim. */
export function claimOkr(run: Run): { run: Run; rewardText: string } | null {
  const p = okrProgress(run)
  if (!p || !p.done || p.claimed || !run.okr) return null
  const d = OKRS[run.okr.id]
  const reward = d.reward(run.okr.act)
  let r: Run = { ...run, okr: { ...run.okr, done: true } }
  let text = rewardText(reward)
  switch (reward.kind) {
    case 'tokens':
      r = { ...r, gold: r.gold + reward.amount, stats: { ...r.stats, tokensEarned: r.stats.tokensEarned + reward.amount } }
      break
    case 'rare': {
      const id = randomRare(r)
      r = { ...r, deck: [...r.deck, mkCard(id)] }
      text = `${DEF[id].name} (Rare) added to your deck`
      break
    }
    case 'relic': {
      const id = rollRelic(r, 'elite')
      if (id) {
        r = grantRelic(r, id)
        text = `Relic: ${RELIC[id].name}`
      } else {
        r = { ...r, gold: r.gold + 100000 }
        text = `+${tokensText(100000)} (you own every relic)`
      }
      break
    }
    case 'maxHp':
      r = { ...r, maxHp: r.maxHp + reward.amount, hp: r.hp + reward.amount }
      break
    case 'upgrade':
      r = upgradeRandom(r, reward.count)
      break
    case 'trim': {
      const starters = shuffle(r.deck.filter((c) => c.id === 'ping' || c.id === 'insulate')).slice(0, reward.count)
      const drop = new Set(starters.map((c) => c.uid))
      r = { ...r, deck: r.deck.filter((c) => !drop.has(c.uid)) }
      break
    }
    case 'combo': {
      const id = randomRare(r)
      r = { ...r, deck: [...r.deck, mkCard(id)], gold: r.gold + reward.amount }
      text = `${DEF[id].name} (Rare) and ${tokensText(reward.amount)}`
      break
    }
  }
  return { run: r, rewardText: `${d.title} complete: ${text}` }
}
