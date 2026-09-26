import { addCards, addFloat, addStatus, applyDamage, drawCards, exhaustBugs, fx, gainBlock, gainCharge, heal, livingEnemies, pick, randomEnemy, say } from './core'
import { intentOf, shownDamage } from './enemies'
import type { Combat, CompanionState, Run } from './types'

/** Speech/float/fx target for the companion. */
export const COMPANION = 'companion'

export interface CompanionDef {
  id: string
  name: string
  role: string
  bio: string
  portrait: string
  when: 'start' | 'end'
  /** Effect text per level (index 0 = level 1). */
  levels: [string, string, string]
  act: (c: Combat, level: number) => void
  quips: string[]
}

const MAX_LEVEL = 3
const lv = <T,>(level: number, a: T, b: T, c: T) => (level >= 3 ? c : level === 2 ? b : a)

/** Deal companion damage (not modified by the player's Strength). */
function bite(c: Combat, n: number) {
  const e = randomEnemy(c)
  if (e) applyDamage(c, e.uid, n, 'player')
}

/** Starter relics identify the class without adding a field to Combat. */
const classOf = (c: Combat): 'fw' | 'hw' | 'cal' => (c.relics.includes('soldering_station') ? 'hw' : c.relics.includes('ref_thermometer') ? 'cal' : 'fw')

const STATUS_JUNK = ['bug', 'meeting', 'deviation', 'hangover']

const defs: CompanionDef[] = [
  {
    id: 'intern',
    name: 'The Intern',
    role: 'Eager. Unsupervised.',
    bio: 'Three weeks in, already has production access. Nobody knows who approved it.',
    portrait: 'comp_intern',
    when: 'start',
    levels: [
      'Start of turn: a random small effect (2 damage, 2 Block or draw 1). 30% chance to misfire and add a Bug.',
      'Start of turn: a random effect (3 damage, 3 Block or draw 1). 20% chance to misfire.',
      'Start of turn: a random effect (4 damage, 4 Block or draw 1). 10% chance to misfire.',
    ],
    act: (c, level) => {
      if (Math.random() < lv(level, 0.3, 0.2, 0.1)) {
        addCards(c, 'bug', 'discard', 1)
        addFloat(c, COMPANION, 'Oops! +1 Bug', 'status')
        say(c, COMPANION, pick(['I pushed to main. Is that bad?', 'Which one was prod again?', 'I renamed the variable to "thing2".']))
        return
      }
      const r = Math.floor(Math.random() * 3)
      if (r === 0) bite(c, lv(level, 2, 3, 4))
      else if (r === 1) gainBlock(c, 'player', lv(level, 2, 3, 4), true)
      else drawCards(c, 1)
      fx(c, COMPANION, 'buff')
    },
    quips: ['Can I shadow you?', 'I made a Jira for that!', 'Is it always like this?', 'I read the whole Confluence. All of it.'],
  },
  {
    id: 'rubber_duck',
    name: 'Rubber Duck',
    role: 'Silent debugger',
    bio: 'Has solved more production incidents than the entire on-call rota. Never says a word.',
    portrait: 'comp_duck',
    when: 'start',
    levels: ['Every 3rd turn: draw 1 card.', 'Every 2nd turn: draw 1 card.', 'Every 2nd turn: draw 1 card and gain 1 Energy.'],
    act: (c, level) => {
      if (c.turn % (level === 1 ? 3 : 2) !== 0) return
      drawCards(c, 1)
      if (level >= 3) {
        c.energy += 1
        addFloat(c, 'player', '+1 Energy', 'status')
      }
      addFloat(c, COMPANION, 'Squeak!', 'status')
      fx(c, COMPANION, 'buff')
    },
    quips: ['…', 'Squeak.', '(judgmental silence)', '(it knows)'],
  },
  {
    id: 'qa_ally',
    name: 'Friendly QA',
    role: 'The rare ally',
    bio: 'Signed off on your deviation without a single comment. You owe them a coffee. Forever.',
    portrait: 'comp_qa',
    when: 'start',
    levels: [
      'Every 3rd turn: apply 1 Weak to the enemy about to hit hardest.',
      'Every 2nd turn: apply 1 Weak to the enemy about to hit hardest.',
      'Every 2nd turn: apply 1 Weak to the two enemies about to hit hardest.',
    ],
    act: (c, level) => {
      const foes = livingEnemies(c)
      if (!foes.length) return
      const threat = (e: (typeof foes)[number]) => (shownDamage(e, c) ?? 0) * (intentOf(e, c).hits ?? 1)
      if (c.turn % (level === 1 ? 3 : 2) !== 0) return
      const ranked = [...foes].sort((a, b) => threat(b) - threat(a))
      for (const t of ranked.slice(0, level >= 3 ? 2 : 1)) addStatus(c, t.uid, 'weak', 1)
    },
    quips: ['That is a nonconformance. Theirs, not yours.', 'I have documented their weaknesses.', 'Per SOP-114, you may proceed.'],
  },
  {
    id: 'it_guy',
    name: 'IT Guy',
    role: 'Turns it off and on again',
    bio: 'Knows every password in the building. Chooses peace.',
    portrait: 'comp_it',
    when: 'end',
    levels: [
      'End of turn: gain 2 Block.',
      'End of turn: gain 3 Block.',
      'End of turn: gain 4 Block and exhaust a Bug, Meeting Invite, Deviation Report or Hangover from your hand.',
    ],
    act: (c, level) => {
      gainBlock(c, 'player', lv(level, 2, 3, 4), true)
      if (level >= 3) {
        const i = c.hand.findIndex((h) => STATUS_JUNK.includes(h.id))
        if (i >= 0) {
          const card = c.hand[i]
          if (card.id === 'bug') exhaustBugs(c, ['hand'], 1)
          else c.exhaust.push(c.hand.splice(i, 1)[0])
        }
      }
    },
    quips: ['Have you tried turning it off and on again?', 'It works on my machine.', 'Ticket closed: user error.', 'I have rebooted your problems.'],
  },
  {
    id: 'office_dog',
    name: 'Office Dog',
    role: 'Very good boy',
    bio: 'Officially "emotional support". Unofficially head of security. Bites Sensitech reps on sight.',
    portrait: 'comp_dog',
    when: 'start',
    levels: ['Every 2nd turn: bite a random enemy for 3.', 'Start of turn: bite a random enemy for 2.', 'Start of turn: bite for 3 and heal you 1 HP.'],
    act: (c, level) => {
      if (level === 1 && c.turn % 2 !== 0) return
      bite(c, lv(level, 3, 2, 3))
      if (level >= 3) heal(c, 'player', 1)
    },
    quips: ['Woof!', 'Grrr…', '(wags aggressively)', '(steals a sandwich)'],
  },
  {
    id: 'summer_student',
    name: 'Summer Student',
    role: 'Reads the manual',
    bio: 'Here for 10 weeks. Actually read every datasheet. Terrifyingly competent.',
    portrait: 'comp_student',
    when: 'end',
    levels: [
      'End of turn, every 3rd turn, by your class: Firmware exhausts 1 Bug; Hardware gains 1 Charge; Calibration applies 1 Excursion to a random enemy.',
      'End of turn, every 2nd turn: Firmware exhausts 1 Bug; Hardware gains 1 Charge; Calibration applies 1 Excursion to a random enemy. Also gain 2 Block.',
      'End of turn, every 2nd turn: Firmware exhausts 2 Bugs; Hardware gains 2 Charge; Calibration applies 2 Excursion to a random enemy. Also gain 3 Block.',
    ],
    act: (c, level) => {
      const cls = classOf(c)
      if (c.turn % (level === 1 ? 3 : 2) !== 0) return
      const n = level >= 3 ? 2 : 1
      if (cls === 'fw') exhaustBugs(c, ['hand', 'discard'], n)
      else if (cls === 'hw') gainCharge(c, n)
      else {
        const e = randomEnemy(c)
        if (e) addStatus(c, e.uid, 'excursion', n)
      }
      if (level >= 2) gainBlock(c, 'player', lv(level, 0, 2, 3), true)
    },

    quips: ['According to the datasheet…', 'I wrote a script for that.', 'Is this in the onboarding doc?', 'I fixed the test. It was the test.'],
  },
]

export const COMPANIONS: Record<string, CompanionDef> = Object.fromEntries(defs.map((d) => [d.id, d]))
export const COMPANION_IDS = defs.map((d) => d.id)
export const DEFAULT_COMPANIONS = ['intern', 'rubber_duck', 'qa_ally']

/** Run the companion's once-per-turn action at the given moment. */
export function companionAct(c: Combat, when: 'start' | 'end') {
  const comp = c.companion
  if (!comp) return
  const def = COMPANIONS[comp.id]
  if (!def || def.when !== when || c.phase !== 'player' || livingEnemies(c).length === 0) return
  def.act(c, comp.level)
  if (!c.speech && Math.random() < 0.3) say(c, COMPANION, pick(def.quips))
}

export const newCompanion = (id: string): CompanionState => ({ id, level: 1 })

/** Level the companion up (call after each boss). */
export function levelUpCompanion(run: Run): Run {
  if (!run.companion) return run
  return { ...run, companion: { ...run.companion, level: Math.min(MAX_LEVEL, run.companion.level + 1) } }
}

/** Up to n random choices from the ids that pass isUnlocked. */
export function rollCompanions(isUnlocked: (id: string) => boolean, n = 3): string[] {
  const pool = COMPANION_IDS.filter(isUnlocked)
  const out: string[] = []
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  return out
}
