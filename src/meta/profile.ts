import type { CharId } from '../game/types'

/** Persistent, cross-run player profile (career, achievements, compendium). */
export interface MetaProfile {
  version: 1
  xp: number
  achievements: Record<string, number> // id -> unlockedAt (ms)
  reviewUnlocked: number // highest Performance Review level available (0 = none yet)
  reviewBeaten: Partial<Record<CharId, number>> // best review level won per character (-1 = never won)
  charWins: Partial<Record<CharId, number>>
  charRuns: Partial<Record<CharId, number>>
  charAct1: Partial<Record<CharId, boolean>> // beat the Act 1 boss with this character
  runs: number
  wins: number
  bestFloor: number
  compendium: {
    cards: string[]
    enemies: Record<string, { seen: number; defeated: number }>
    relics: string[]
    lines: Record<string, string[]>
    events: string[]
  }
  totals: {
    enemiesDefeated: number
    bossesDefeated: number
    cardsPlayed: number
    damageDealt: number
    tokensEarned: number
    eventsVisited: number
    floors: number
  }
}

const KEY = 'ccs-meta-v1'

const fresh = (): MetaProfile => ({
  version: 1,
  xp: 0,
  achievements: {},
  reviewUnlocked: 0,
  reviewBeaten: {},
  charWins: {},
  charRuns: {},
  charAct1: {},
  runs: 0,
  wins: 0,
  bestFloor: 0,
  compendium: { cards: [], enemies: {}, relics: [], lines: {}, events: [] },
  totals: { enemiesDefeated: 0, bossesDefeated: 0, cardsPlayed: 0, damageDealt: 0, tokensEarned: 0, eventsVisited: 0, floors: 0 },
})

let cache: MetaProfile | null = null

export function loadMeta(): MetaProfile {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<MetaProfile>) : null
    const base = fresh()
    cache = parsed?.version === 1 ? { ...base, ...parsed, compendium: { ...base.compendium, ...parsed.compendium }, totals: { ...base.totals, ...parsed.totals } } : base
  } catch {
    cache = fresh()
  }
  return cache
}

export function saveMeta(m: MetaProfile) {
  cache = m
  try {
    localStorage.setItem(KEY, JSON.stringify(m))
  } catch {
    /* storage unavailable: progress lives for this session only */
  }
}

/** Mutate the profile through a callback and persist it. */
export function updateMeta(fn: (m: MetaProfile) => void): MetaProfile {
  const m = structuredClone(loadMeta())
  fn(m)
  saveMeta(m)
  return m
}

export function resetMeta() {
  cache = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
