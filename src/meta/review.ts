import { mkCard } from '../game/core'
import { ENEMY } from '../game/enemies'
import type { Combat, Run } from '../game/types'

/** Performance Review (difficulty) levels. Each level includes all levels below it. */
export interface ReviewLevel {
  level: number
  name: string
  icon: string
  desc: string
}

export const REVIEW_LEVELS: ReviewLevel[] = [
  { level: 1, name: 'Stretch Goals', icon: '📈', desc: 'Normal enemies have 10% more HP.' },
  { level: 2, name: 'Hiring Freeze', icon: '🧊', desc: 'Shop prices are 25% higher.' },
  { level: 3, name: 'Budget Cuts', icon: '✂️', desc: 'Token rewards from combat are 25% lower.' },
  { level: 4, name: 'Return to Office', icon: '🏢', desc: 'Start each run with 6 less Max HP.' },
  { level: 5, name: 'Scope Creep', icon: '🐍', desc: 'Elites have 15% more HP and start with 1 Strength.' },
  { level: 6, name: 'Reorg', icon: '🔀', desc: 'Bosses have 10% more HP.' },
  { level: 7, name: 'Crunch Time', icon: '⏰', desc: 'The coffee machine heals 20% of Max HP instead of 30%.' },
  { level: 8, name: 'Technical Debt', icon: '🐛', desc: 'Start each run with a Bug in your deck.' },
  { level: 9, name: 'Quiet Quitting', icon: '🤫', desc: 'Card rewards offer 2 cards instead of 3.' },
  { level: 10, name: 'The Final Review', icon: '⚖️', desc: 'Bosses start with 3 Strength.' },
]

export const MAX_REVIEW = REVIEW_LEVELS.length

export const shopPriceMul = (level: number) => (level >= 2 ? 1.25 : 1)
export const rewardTokenMul = (level: number) => (level >= 3 ? 0.75 : 1)
export const restHealPct = (level: number) => (level >= 7 ? 0.2 : 0.3)
export const cardRewardCount = (level: number) => (level >= 9 ? 2 : 3)

/** Apply start-of-run modifiers (call once when the run is created). */
export function applyReviewStart(run: Run): Run {
  const lvl = run.reviewLevel ?? 0
  let r = run
  if (lvl >= 4) r = { ...r, maxHp: r.maxHp - 6, hp: Math.min(r.hp, r.maxHp - 6) }
  if (lvl >= 8) r = { ...r, deck: [...r.deck, mkCard('bug')] }
  return r
}

/** Engine hook, called from startCombat: scale enemy HP and add Strength by level. */
export function applyReviewToEnemies(c: Combat) {
  const lvl = c.reviewLevel ?? 0
  if (!lvl) return
  for (const e of c.enemies) {
    const tier = ENEMY[e.defId].tier
    let mul = 1
    if ((tier === 'normal' || tier === 'minion') && lvl >= 1) mul = 1.1
    if (tier === 'elite' && lvl >= 5) mul = 1.15
    if (tier === 'boss' && lvl >= 6) mul = 1.1
    if (mul !== 1) {
      e.maxHp = Math.round(e.maxHp * mul)
      e.hp = e.maxHp
    }
    if (tier === 'elite' && lvl >= 5) e.statuses.strength = (e.statuses.strength ?? 0) + 1
    if (tier === 'boss' && lvl >= 10) e.statuses.strength = (e.statuses.strength ?? 0) + 3
  }
}
