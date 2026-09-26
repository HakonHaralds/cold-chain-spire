import { poolFor } from '../game/cards'
import { mkCard, pick } from '../game/core'
import { COMMON_RELICS, grantRelic } from '../game/relics'
import type { CharId, Run } from '../game/types'
import { loadMeta } from './profile'

/** Career ladder (M21): XP from runs and achievements raises your title and unlocks perks and companions. */

export type Unlock =
  | { kind: 'perk'; id: string; label: string }
  | { kind: 'companion'; id: string; label: string }
  | { kind: 'review'; label: string }
  | { kind: 'cosmetic'; label: string }
  | { kind: 'benefit'; id: string; label: string }
  | { kind: 'slot'; label: string }
  | { kind: 'character'; id: CharId; label: string }

export interface CareerLevel {
  level: number
  title: string
  xp: number // cumulative XP needed
  unlocks: Unlock[]
}

export const CAREER: CareerLevel[] = [
  { level: 1, title: 'Summer Intern', xp: 0, unlocks: [{ kind: 'companion', id: 'intern', label: 'Companions: The Intern, Rubber Duck, QA Ally' }] },
  { level: 2, title: 'Junior Engineer', xp: 100, unlocks: [{ kind: 'benefit', id: 'signing_bonus', label: 'Benefit: Signing Bonus (+10k starting tokens, every run)' }] },
  { level: 3, title: 'Engineer', xp: 250, unlocks: [{ kind: 'review', label: 'Performance Reviews (difficulty levels)' }, { kind: 'companion', id: 'it_guy', label: 'Companion: The IT Guy' }] },
  { level: 4, title: 'Engineer II', xp: 450, unlocks: [{ kind: 'benefit', id: 'health_insurance', label: 'Benefit: Health Insurance (+4 Max HP, every run)' }] },
  { level: 5, title: 'Senior Engineer', xp: 700, unlocks: [{ kind: 'slot', label: 'Second onboarding perk slot' }] },
  { level: 6, title: 'Senior Engineer II', xp: 1000, unlocks: [{ kind: 'companion', id: 'office_dog', label: 'Companion: The Office Dog' }] },
  { level: 7, title: 'Staff Engineer', xp: 1400, unlocks: [{ kind: 'benefit', id: 'expense_account', label: 'Benefit: Expense Account (shops 10% cheaper)' }] },
  { level: 8, title: 'Senior Staff Engineer', xp: 1900, unlocks: [{ kind: 'benefit', id: 'headhunter', label: 'Benefit: Headhunter (elite and boss rewards offer 1 extra card)' }] },
  { level: 9, title: 'Principal Engineer', xp: 2500, unlocks: [{ kind: 'companion', id: 'summer_student', label: 'Companion: The Summer Student' }] },
  { level: 10, title: 'Senior Principal Engineer', xp: 3200, unlocks: [{ kind: 'slot', label: 'Third onboarding perk slot' }] },
  { level: 11, title: 'Distinguished Engineer', xp: 4000, unlocks: [{ kind: 'benefit', id: 'stock_grant', label: 'Benefit: Stock Grant (+20k starting tokens, every run)' }] },
  { level: 12, title: 'Fellow', xp: 5000, unlocks: [{ kind: 'benefit', id: 'wellness_budget', label: 'Benefit: Wellness Budget (coffee machine heals 10% more)' }] },
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
  { id: 'fw_dotfiles', name: 'Dotfiles', icon: '⌨️', desc: 'Your setup travels with you: start with printf Debugging and Breakpoint upgraded, and one Ping removed.' },
  { id: 'hw_solder_tip', name: 'Fresh Solder Tip', icon: '🔥', desc: 'Start with Solder Joint and Discharge upgraded.' },
  { id: 'cal_certificate', name: 'Fresh Certificate', icon: '📜', desc: 'Start with Thermocouple Jab and Ice Bath upgraded.' },
  { id: 'desk_duck', name: 'Desk Duck', icon: '🦆', desc: 'Start with the Rubber Duck relic.' },
  { id: 'dry_ice_start', name: 'Cooler Box', icon: '🧊', desc: 'Start with the Phase-Change Packs relic.' },
  { id: 'hoodie_start', name: 'Day-One Hoodie', icon: '🧥', desc: 'Start with the Company Hoodie relic.' },
  { id: 'seed_funding', name: 'Seed Funding', icon: '💸', desc: 'Start with 25k extra tokens.' },
  { id: 'gym_membership', name: 'Gym Membership', icon: '🏋️', desc: 'Start with 6 extra Max HP.' },
  { id: 'swag_bag', name: 'Swag Bag', icon: '🎒', desc: 'Start with a random common relic.' },
  { id: 'code_cleanup', name: 'Code Cleanup', icon: '🧹', desc: 'Remove one Ping from your starting deck.' },
  { id: 'onboarding_buddy', name: 'Onboarding Buddy', icon: '🤝', desc: 'Upgrade 2 random starting cards.' },
  { id: 'insider_info', name: 'Insider Info', icon: '🕵️', desc: 'Start with a random uncommon card for your class.' },
  { id: 'head_start', name: 'Head Start', icon: '🚀', desc: 'Start with a random rare card for your class.' },
  { id: 'sabbatical', name: 'Sabbatical', icon: '🏝️', desc: 'Start with 10 extra Max HP and 10k extra tokens.' },
]

export const PERK: Record<string, PerkDef> = Object.fromEntries(PERKS.map((p) => [p.id, p]))

/** Each character's perk ladder: win #1 unlocks the first perk, every further win the next one. */
export const PERK_LADDER: Record<CharId, string[]> = {
  fw: ['fw_dotfiles', 'seed_funding', 'desk_duck', 'code_cleanup', 'insider_info', 'gym_membership', 'head_start', 'sabbatical'],
  hw: ['hw_solder_tip', 'gym_membership', 'hoodie_start', 'code_cleanup', 'insider_info', 'seed_funding', 'head_start', 'sabbatical'],
  cal: ['cal_certificate', 'dry_ice_start', 'seed_funding', 'onboarding_buddy', 'insider_info', 'gym_membership', 'head_start', 'sabbatical'],
}

export const perksFor = (ch: CharId): PerkDef[] => PERK_LADDER[ch].slice(0, loadMeta().charWins[ch] ?? 0).map((id) => PERK[id])
export const nextPerk = (ch: CharId): PerkDef | null => {
  const id = PERK_LADDER[ch][loadMeta().charWins[ch] ?? 0]
  return id ? PERK[id] : null
}
/** How many perks you may bring into a run (career levels 5 and 10 add a slot). */
export const perkSlots = (level = careerLevel()) => 1 + (level >= 5 ? 1 : 0) + (level >= 10 ? 1 : 0)

// ---------- characters ----------

export const CHAR_ORDER: CharId[] = ['fw', 'hw', 'cal']
const CHAR_NAME: Record<CharId, string> = { fw: 'Firmware Developer', hw: 'Hardware Engineer', cal: 'Calibration Specialist' }
const RUNS_TO_UNLOCK = 3

/** Firmware is available from the start; each next character unlocks by beating the Act 1 boss with the previous one (or playing 3 runs with it). */
export function characterUnlocked(ch: CharId, m = loadMeta()): boolean {
  const i = CHAR_ORDER.indexOf(ch)
  if (i <= 0) return true
  const prev = CHAR_ORDER[i - 1]
  return characterUnlocked(prev, m) && (!!m.charAct1[prev] || (m.charRuns[prev] ?? 0) >= RUNS_TO_UNLOCK || (m.charWins[prev] ?? 0) > 0)
}
export function characterUnlockHint(ch: CharId): string {
  const i = CHAR_ORDER.indexOf(ch)
  const prev = CHAR_ORDER[i - 1]
  const runs = loadMeta().charRuns[prev] ?? 0
  return `Beat the Act 1 boss as the ${CHAR_NAME[prev]} to unlock (or play ${RUNS_TO_UNLOCK} runs with them: ${Math.min(runs, RUNS_TO_UNLOCK)}/${RUNS_TO_UNLOCK}).`
}
export const characterName = (ch: CharId) => CHAR_NAME[ch]

// ---------- career benefits (permanent, automatic) ----------

const hasBenefit = (id: string, level = careerLevel()) => unlocksBetween(0, level).some((u) => u.kind === 'benefit' && u.id === id)
export const benefitShopMul = () => (hasBenefit('expense_account') ? 0.9 : 1)
export const benefitExtraEliteCard = () => (hasBenefit('headhunter') ? 1 : 0)
export const benefitRestBonus = () => (hasBenefit('wellness_budget') ? 0.1 : 0)
export function applyBenefits(run: Run): Run {
  const r = { ...run }
  if (hasBenefit('signing_bonus')) r.gold += 10000
  if (hasBenefit('stock_grant')) r.gold += 20000
  if (hasBenefit('health_insurance')) {
    r.maxHp += 4
    r.hp += 4
  }
  return r
}

/** Apply an onboarding perk to a freshly created run. */
export function applyPerk(run: Run, perkId: string | null): Run {
  const r = { ...run, deck: [...run.deck], relics: [...run.relics] }
  switch (perkId) {
    case 'seed_funding':
      r.gold += 25000
      break
    case 'fw_dotfiles':
    case 'hw_solder_tip':
    case 'cal_certificate': {
      const sig = { fw_dotfiles: ['printf', 'breakpoint'], hw_solder_tip: ['solder_joint', 'discharge'], cal_certificate: ['thermocouple_jab', 'ice_bath'] }[perkId]
      r.deck = r.deck.map((c) => (sig.includes(c.id) ? { ...c, upgraded: true } : c))
      if (perkId === 'fw_dotfiles') {
        const i = r.deck.findIndex((c) => c.id === 'ping')
        if (i >= 0) r.deck.splice(i, 1)
      }
      break
    }
    case 'desk_duck':
    case 'dry_ice_start':
    case 'hoodie_start': {
      const id = { desk_duck: 'rubber_duck', dry_ice_start: 'phase_change', hoodie_start: 'hoodie' }[perkId]
      if (!r.relics.includes(id)) return grantRelic(r, id)
      break
    }
    case 'gym_membership':
      r.maxHp += 6
      r.hp += 6
      break
    case 'swag_bag': {
      const pool = COMMON_RELICS.filter((id) => !r.relics.includes(id) && id !== 'kanelsnudur')
      if (pool.length) return grantRelic(r, pick(pool))
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
