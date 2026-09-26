import { poolFor } from '../game/cards'
import { mkCard, pick } from '../game/core'
import { COMMON_RELICS } from '../game/relics'
import type { Run } from '../game/types'
import { loadMeta } from './profile'

/** Career ladder (M21): XP from runs and achievements raises your title and unlocks perks and companions. */

export type Unlock =
  | { kind: 'perk'; id: string; label: string }
  | { kind: 'companion'; id: string; label: string }
  | { kind: 'review'; label: string }
  | { kind: 'cosmetic'; label: string }

export interface CareerLevel {
  level: number
  title: string
  xp: number // cumulative XP needed
  unlocks: Unlock[]
}

export const CAREER: CareerLevel[] = [
  { level: 1, title: 'Summer Intern', xp: 0, unlocks: [{ kind: 'companion', id: 'intern', label: 'Companions: The Intern, Rubber Duck, QA Ally' }] },
  { level: 2, title: 'Junior Engineer', xp: 100, unlocks: [{ kind: 'perk', id: 'seed_funding', label: 'Perk: Seed Funding' }] },
  { level: 3, title: 'Engineer', xp: 250, unlocks: [{ kind: 'review', label: 'Performance Reviews (difficulty levels)' }, { kind: 'companion', id: 'it_guy', label: 'Companion: The IT Guy' }] },
  { level: 4, title: 'Engineer II', xp: 450, unlocks: [{ kind: 'perk', id: 'gym_membership', label: 'Perk: Gym Membership' }] },
  { level: 5, title: 'Senior Engineer', xp: 700, unlocks: [{ kind: 'perk', id: 'swag_bag', label: 'Perk: Swag Bag' }] },
  { level: 6, title: 'Senior Engineer II', xp: 1000, unlocks: [{ kind: 'companion', id: 'office_dog', label: 'Companion: The Office Dog' }] },
  { level: 7, title: 'Staff Engineer', xp: 1400, unlocks: [{ kind: 'perk', id: 'code_cleanup', label: 'Perk: Code Cleanup' }] },
  { level: 8, title: 'Senior Staff Engineer', xp: 1900, unlocks: [{ kind: 'perk', id: 'onboarding_buddy', label: 'Perk: Onboarding Buddy' }] },
  { level: 9, title: 'Principal Engineer', xp: 2500, unlocks: [{ kind: 'companion', id: 'summer_student', label: 'Companion: The Summer Student' }] },
  { level: 10, title: 'Senior Principal Engineer', xp: 3200, unlocks: [{ kind: 'perk', id: 'insider_info', label: 'Perk: Insider Info' }] },
  { level: 11, title: 'Distinguished Engineer', xp: 4000, unlocks: [{ kind: 'perk', id: 'head_start', label: 'Perk: Head Start' }] },
  { level: 12, title: 'Fellow', xp: 5000, unlocks: [{ kind: 'perk', id: 'sabbatical', label: 'Perk: Sabbatical' }] },
  { level: 13, title: 'VP of Getting Things Done', xp: 6200, unlocks: [{ kind: 'cosmetic', label: 'Golden name badge on the title screen' }] },
  { level: 14, title: 'Chief Cold Chain Officer', xp: 7600, unlocks: [{ kind: 'cosmetic', label: 'The corner office (and eternal glory)' }] },
]

export const levelForXp = (xp: number) => CAREER.filter((l) => xp >= l.xp).at(-1)!.level
export const careerLevel = () => levelForXp(loadMeta().xp)
export const careerTitle = (level = careerLevel()) => CAREER[level - 1].title

/** Progress within the current level, 0..1 (1 at max level). */
export function levelProgress(xp: number) {
  const lvl = levelForXp(xp)
  const cur = CAREER[lvl - 1]
  const next = CAREER[lvl]
  if (!next) return { level: lvl, into: xp - cur.xp, needed: 0, pct: 1 }
  return { level: lvl, into: xp - cur.xp, needed: next.xp - cur.xp, pct: (xp - cur.xp) / (next.xp - cur.xp) }
}

/** Unlocks gained going from one level to another. */
export const unlocksBetween = (from: number, to: number): Unlock[] => CAREER.filter((l) => l.level > from && l.level <= to).flatMap((l) => l.unlocks)

// ---------- companions ----------

const COMPANION_LEVEL: Record<string, number> = { intern: 1, rubber_duck: 1, qa_ally: 1, it_guy: 3, office_dog: 6, summer_student: 9 }

export const companionUnlockLevel = (id: string) => COMPANION_LEVEL[id] ?? 1
export const companionUnlocked = (id: string) => careerLevel() >= companionUnlockLevel(id)

// ---------- Performance Review availability ----------

/** Highest review level the player may pick. Unlocked at career level 3 (level 1 only) or by winning a run; each win at level N unlocks N+1. */
export function reviewAvailable(): number {
  const m = loadMeta()
  const base = careerLevel() >= 3 ? 1 : 0
  return Math.min(10, Math.max(base, m.reviewUnlocked))
}

// ---------- onboarding perks ----------

export interface PerkDef {
  id: string
  name: string
  icon: string
  desc: string
}

export const PERKS: PerkDef[] = [
  { id: 'seed_funding', name: 'Seed Funding', icon: '💸', desc: 'Start with 20k extra tokens.' },
  { id: 'gym_membership', name: 'Gym Membership', icon: '🏋️', desc: 'Start with 6 extra Max HP.' },
  { id: 'swag_bag', name: 'Swag Bag', icon: '🎒', desc: 'Start with a random common relic.' },
  { id: 'code_cleanup', name: 'Code Cleanup', icon: '🧹', desc: 'Remove one Ping from your starting deck.' },
  { id: 'onboarding_buddy', name: 'Onboarding Buddy', icon: '🤝', desc: 'Upgrade 2 random starting cards.' },
  { id: 'insider_info', name: 'Insider Info', icon: '🕵️', desc: 'Start with a random uncommon card for your class.' },
  { id: 'head_start', name: 'Head Start', icon: '🚀', desc: 'Start with a random rare card for your class.' },
  { id: 'sabbatical', name: 'Sabbatical', icon: '🏝️', desc: 'Start with 10 extra Max HP and 10k extra tokens.' },
]

export const PERK: Record<string, PerkDef> = Object.fromEntries(PERKS.map((p) => [p.id, p]))

export function unlockedPerks(level = careerLevel()): PerkDef[] {
  const ids = unlocksBetween(0, level).flatMap((u) => (u.kind === 'perk' ? [u.id] : []))
  return PERKS.filter((p) => ids.includes(p.id))
}

/** Apply an onboarding perk to a freshly created run. */
export function applyPerk(run: Run, perkId: string | null): Run {
  const r = { ...run, deck: [...run.deck], relics: [...run.relics] }
  switch (perkId) {
    case 'seed_funding':
      r.gold += 20000
      break
    case 'gym_membership':
      r.maxHp += 6
      r.hp += 6
      break
    case 'swag_bag': {
      const pool = COMMON_RELICS.filter((id) => !r.relics.includes(id) && id !== 'kanelsnudur')
      const id = pick(pool)
      r.relics.push(id)
      if (id === 'lanyard') {
        r.maxHp += 10
        r.hp += 10
      }
      break
    }
    case 'code_cleanup': {
      const i = r.deck.findIndex((c) => c.id === 'ping')
      if (i >= 0) r.deck.splice(i, 1)
      break
    }
    case 'onboarding_buddy': {
      const idx = r.deck.map((c, i) => (c.upgraded ? -1 : i)).filter((i) => i >= 0)
      for (let n = 0; n < 2 && idx.length; n++) {
        const i = idx.splice(Math.floor(Math.random() * idx.length), 1)[0]
        r.deck[i] = { ...r.deck[i], upgraded: true }
      }
      break
    }
    case 'insider_info':
    case 'head_start': {
      const rarity = perkId === 'insider_info' ? 'uncommon' : 'rare'
      const pool = poolFor(r.character).filter((d) => d.rarity === rarity && d.cls === r.character)
      if (pool.length) r.deck.push(mkCard(pick(pool).id))
      break
    }
    case 'sabbatical':
      r.maxHp += 10
      r.hp += 10
      r.gold += 10000
      break
  }
  return r
}

// ---------- XP ----------

export const TIER_XP = { bronze: 25, silver: 50, gold: 100, platinum: 250 } as const

export interface XpLine {
  label: string
  xp: number
}

/** XP earned from a run (achievement XP is added separately when unlocked). */
export function runXp(run: Run, won: boolean): XpLine[] {
  const s = run.stats
  const normal = Math.max(0, s.enemiesDefeated - s.elitesDefeated - s.bossesDefeated)
  const lines: XpLine[] = [
    { label: `Floors climbed (${run.floor})`, xp: run.floor * 5 },
    { label: `Enemies defeated (${normal})`, xp: normal * 2 },
    { label: `Elites defeated (${s.elitesDefeated})`, xp: s.elitesDefeated * 15 },
    { label: `Bosses defeated (${s.bossesDefeated})`, xp: s.bossesDefeated * 50 },
  ]
  if (won) lines.push({ label: 'Run completed!', xp: 150 })
  const lvl = run.reviewLevel ?? 0
  const base = lines.reduce((a, l) => a + l.xp, 0)
  if (lvl > 0) lines.push({ label: `Performance Review ${lvl} bonus (+${lvl * 10}%)`, xp: Math.round((base * lvl) / 10) })
  return lines.filter((l) => l.xp > 0)
}
