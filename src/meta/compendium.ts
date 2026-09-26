import type { Run } from '../game/types'
import { achievementsSince, checkAchievements, type AchievementDef } from './achievements'
import { levelForXp, runXp, TIER_XP, unlocksBetween, type Unlock, type XpLine } from './career'
import { MAX_REVIEW } from './review'
import { loadMeta, updateMeta } from './profile'

/** Compendium tracking (M25). All calls are cheap no-ops when nothing is new. */

export function recordCardsSeen(ids: string[]) {
  const m = loadMeta()
  const fresh = ids.filter((id) => !m.compendium.cards.includes(id))
  if (fresh.length) updateMeta((p) => void p.compendium.cards.push(...new Set(fresh)))
}

export function recordEnemySeen(defId: string) {
  updateMeta((p) => {
    const e = (p.compendium.enemies[defId] ??= { seen: 0, defeated: 0 })
    e.seen += 1
  })
}

export function recordEnemyDefeated(defId: string) {
  updateMeta((p) => {
    const e = (p.compendium.enemies[defId] ??= { seen: 1, defeated: 0 })
    e.defeated += 1
  })
}

export function recordLine(defId: string, text: string) {
  const m = loadMeta()
  if (m.compendium.lines[defId]?.includes(text)) return
  updateMeta((p) => void (p.compendium.lines[defId] ??= []).push(text))
}

export function recordRelic(id: string) {
  if (loadMeta().compendium.relics.includes(id)) return
  updateMeta((p) => void p.compendium.relics.push(id))
}

export function recordEvent(id: string) {
  if (loadMeta().compendium.events.includes(id)) return
  updateMeta((p) => void p.compendium.events.push(id))
}

export interface RunEndResult {
  xpLines: XpLine[] // run XP breakdown (added now)
  achievementXp: number // XP from achievements unlocked during this run (already credited when unlocked)
  xpGained: number // total = run XP + achievement XP
  xpBefore: number
  xpAfter: number
  levelBefore: number
  levelAfter: number
  newUnlocks: Unlock[]
  newReviewLevel: number | null // review level newly unlocked by this win
  achievements: AchievementDef[] // everything unlocked during this run, including run-end ones
}

/** Call exactly once when a run ends (game over or victory). */
export function recordRunEnd(run: Run, won: boolean): RunEndResult {
  // Run-end achievements first, so their XP counts toward this run.
  checkAchievements('runEnd', { run, won })
  const startedAt = run.startedAt ?? Date.now()
  const lines = runXp(run, won)
  const runTotal = lines.reduce((a, l) => a + l.xp, 0)
  const before = loadMeta()
  const achievementXp = achievementsSince(startedAt).reduce((a, x) => a + TIER_XP[x.tier], 0)
  const xpBefore = Math.max(0, before.xp - achievementXp)
  let newReviewLevel: number | null = null
  const lvl = run.reviewLevel ?? 0
  const after = updateMeta((m) => {
    m.xp += runTotal
    m.runs += 1
    m.bestFloor = Math.max(m.bestFloor, run.floor)
    m.totals.enemiesDefeated += run.stats.enemiesDefeated
    m.totals.bossesDefeated += run.stats.bossesDefeated ?? 0
    m.totals.cardsPlayed += run.stats.cardsPlayed
    m.totals.damageDealt += run.stats.damageDealt
    m.totals.tokensEarned += run.stats.tokensEarned ?? 0
    m.totals.eventsVisited += run.stats.eventsVisited ?? 0
    m.totals.floors += run.floor
    if (won) {
      m.wins += 1
      m.charWins[run.character] = (m.charWins[run.character] ?? 0) + 1
      m.reviewBeaten[run.character] = Math.max(m.reviewBeaten[run.character] ?? -1, lvl)
      const next = Math.min(MAX_REVIEW, lvl + 1)
      if (next > m.reviewUnlocked) {
        m.reviewUnlocked = next
        newReviewLevel = next
      }
    }
  })
  // Profile changed (runs, wins, xp): re-check meta achievements, crediting their XP too.
  checkAchievements('meta')
  const final = loadMeta()
  const levelBefore = levelForXp(xpBefore)
  const levelAfter = levelForXp(final.xp)
  return {
    xpLines: lines,
    achievementXp: achievementsSince(startedAt).reduce((a, x) => a + TIER_XP[x.tier], 0),
    xpGained: final.xp - xpBefore,
    xpBefore,
    xpAfter: final.xp || after.xp,
    levelBefore,
    levelAfter,
    newUnlocks: unlocksBetween(levelBefore, levelAfter),
    newReviewLevel,
    achievements: achievementsSince(startedAt),
  }
}
