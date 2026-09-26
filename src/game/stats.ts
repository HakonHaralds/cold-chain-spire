import type { CombatStats, RunStats } from './types'

export const emptyCombatStats = (): CombatStats => ({
  damageTaken: 0,
  maxHit: 0,
  maxBlock: 0,
  blockGained: 0,
  cardsPlayed: 0,
  attacks: 0,
  skills: 0,
  powers: 0,
  cardsThisTurn: 0,
  maxCardsInTurn: 0,
  excursionApplied: 0,
  excursionKills: 0,
  bugsExhausted: 0,
  maxCharge: 0,
  healed: 0,
  cardsExhausted: 0,
  energyWasted: 0,
})

export const emptyRunStats = (): RunStats => ({
  enemiesDefeated: 0,
  cardsPlayed: 0,
  damageDealt: 0,
  fights: 0,
  elitesDefeated: 0,
  bossesDefeated: 0,
  flawlessFights: 0,
  damageTaken: 0,
  attacks: 0,
  skills: 0,
  powers: 0,
  maxHit: 0,
  maxBlock: 0,
  maxCardsInTurn: 0,
  excursionApplied: 0,
  excursionKills: 0,
  bugsExhausted: 0,
  maxCharge: 0,
  healed: 0,
  cardsExhausted: 0,
  tokensEarned: 0,
  tokensSpent: 0,
  eventsVisited: 0,
  rests: 0,
  upgrades: 0,
  removals: 0,
  cardsAdded: 0,
  relicsGained: 0,
  shopsVisited: 0,
  fastestFight: 0,
})

/** Add a delta to run stats (immutable). */
export const bump = (s: RunStats, d: Partial<RunStats>): RunStats => {
  const out = { ...s }
  for (const [k, v] of Object.entries(d) as [keyof RunStats, number][]) out[k] = (out[k] ?? 0) + v
  return out
}
