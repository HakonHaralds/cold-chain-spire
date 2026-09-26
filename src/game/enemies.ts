import { setIncomingDamage } from './cards'
import {
  addCards,
  addStatus,
  attack,
  attackValue,
  gainBlock,
  heal,
  livingEnemies,
  pick,
  say,
  st,
  uid,
} from './core'
import type { Combat, EnemyInst, Intent } from './types'

export interface Move {
  intent: (e: EnemyInst, c: Combat) => Intent
  act: (c: Combat, e: EnemyInst) => void
  lines?: string[]
}

export interface EnemyDef {
  id: string
  name: string
  title?: string
  hp: [number, number]
  tier: 'normal' | 'elite' | 'boss' | 'minion'
  start?: (e: EnemyInst, c: Combat) => void
  moves: Record<string, Move>
  choose: (e: EnemyInst, c: Combat) => string
  bio?: string
}

const hits = (c: Combat, e: EnemyInst, n: number, times = 1) => {
  for (let i = 0; i < times; i++) if (c.player.hp > 0 && !e.dead) attack(c, e.uid, 'player', n)
}
const A = (label: string, damage: number, times = 1): Intent => ({ kind: 'attack', label, damage, hits: times })

/** Pick a move, avoiding using the same move more than `maxRepeat` times in a row. */
function weighted(e: EnemyInst, options: [string, number][], maxRepeat = 1): string {
  const last = e.history.slice(-maxRepeat)
  const allowed = options.filter(([m]) => !(last.length === maxRepeat && last.every((h) => h === m)))
  const total = allowed.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [m, w] of allowed) {
    if ((r -= w) <= 0) return m
  }
  return allowed[0][0]
}
const cycle = (e: EnemyInst, order: string[]) => order[e.turn % order.length]

const defs: EnemyDef[] = [
  // ===================== ACT 1: The Warehouse =====================
  {
    id: 'sensitech_minion', name: 'Sensitech Minion', hp: [18, 22], tier: 'normal',
    bio: 'Still downloading data over USB. Proudly.',
    moves: {
      usb: { intent: () => A('USB Download', 6), act: (c, e) => hits(c, e, 6), lines: ['Have you tried a cable?', 'Data? Next week, after I plug it in.'] },
      paper: { intent: () => ({ kind: 'attack_defend', label: 'Paper Trail', damage: 3, hits: 1 }), act: (c, e) => { hits(c, e, 3); gainBlock(c, e.uid, 5) } },
    },
    choose: (e) => weighted(e, [['usb', 60], ['paper', 40]]),
  },
  {
    id: 'temptale', name: 'Rogue Data Logger', hp: [12, 15], tier: 'normal',
    bio: 'A single-use logger that refuses to be single-use.',
    moves: {
      beep: { intent: () => A('Beep Beep', 3, 2), act: (c, e) => hits(c, e, 3, 2) },
      drift: { intent: () => ({ kind: 'debuff', label: 'Calibration Drift' }), act: (c) => addStatus(c, 'player', 'weak', 1) },
    },
    choose: (e) => weighted(e, [['beep', 65], ['drift', 35]]),
  },
  {
    id: 'qa_employee', name: 'Quality Department Employee', hp: [36, 42], tier: 'normal',
    bio: 'Has opinions about your font size in the SOP.',
    moves: {
      capa: { intent: () => ({ kind: 'debuff', label: 'CAPA Request' }), act: (c) => addCards(c, 'deviation', 'discard', 2), lines: ['I will need a CAPA for that.', 'Was this change controlled?'] },
      sop: { intent: () => ({ kind: 'defend', label: 'SOP Review' }), act: (c, e) => gainBlock(c, e.uid, 9) },
      nc: { intent: () => A('Nonconformance', 9), act: (c, e) => hits(c, e, 9), lines: ['That is a nonconformance.'] },
    },
    choose: (e) => (e.turn === 0 ? 'capa' : weighted(e, [['nc', 55], ['sop', 25], ['capa', 20]])),
  },
  {
    id: 'sensitech_rep', name: 'Sensitech Sales Rep', hp: [28, 32], tier: 'normal',
    bio: 'Knows a guy in your procurement team.',
    moves: {
      discount: { intent: () => ({ kind: 'buff', label: 'Discount Offer' }), act: (c, e) => addStatus(c, e.uid, 'strength', 2), lines: ['For you? Ten percent off.', 'Our loggers are cheaper. Per unit. Initially.'] },
      demo: { intent: () => A('Product Demo', 8), act: (c, e) => hits(c, e, 8) },
    },
    choose: (e) => (e.turn === 0 ? 'discount' : weighted(e, [['demo', 70], ['discount', 30]])),
  },
  {
    id: 'lead_auditor', name: 'Lead Auditor', title: 'Elite', hp: [80, 86], tier: 'elite',
    bio: 'Has never, in 22 years, said "looks good".',
    moves: {
      finding: { intent: () => ({ kind: 'attack_debuff', label: 'Major Finding', damage: 12, hits: 1 }), act: (c, e) => { hits(c, e, 12); addStatus(c, 'player', 'vulnerable', 2) }, lines: ['This is a major finding.'] },
      checklist: { intent: () => A('The Checklist', 4, 3), act: (c, e) => hits(c, e, 4, 3), lines: ['Item 47 of 312.'] },
      qp: { intent: () => ({ kind: 'defend_buff', label: 'Escalate to QP' }), act: (c, e) => { addStatus(c, e.uid, 'strength', 3); gainBlock(c, e.uid, 10) }, lines: ['I am escalating this to the Qualified Person.'] },
    },
    choose: (e) => cycle(e, ['checklist', 'finding', 'qp', 'checklist', 'finding']),
  },
  {
    id: 'boss_pc', name: 'Director of People & Culture', title: 'Boss', hp: [140, 140], tier: 'boss',
    bio: 'Runs a sub-3:30 marathon and your 1:1s. Loves you like family. Mandatory family.',
    moves: {
      survey: { intent: () => ({ kind: 'debuff', label: 'Engagement Survey' }), act: (c) => { addStatus(c, 'player', 'weak', 2); addStatus(c, 'player', 'frail', 2) }, lines: ['Quick pulse survey! Only 94 questions.', 'On a scale of 1–10, how aligned do you feel?', 'Habit 5: Seek first to understand… your survey answers.', 'Have you signed up for the 7 Habits workshop yet? It is voluntary. Mandatorily voluntary.'] },
      fun: { intent: () => A('Mandatory Fun', 4, 4), act: (c, e) => hits(c, e, 4, 4), lines: ['Trust fall! Everyone! Now!', 'This is a safe space. Mandatory, but safe.', 'Habit 6: Synergize! That means you, too.', 'Day two of the 7 Habits workshop starts with icebreakers!'] },
      pip: { intent: () => ({ kind: 'attack_debuff', label: 'Performance Improvement Plan', damage: 10, hits: 1 }), act: (c, e) => { hits(c, e, 10); addCards(c, 'pip', 'discard', 2) }, lines: ["Let's circle back to your development goals.", 'I have booked 30 minutes. With your manager.', 'Habit 2: Begin with the end in mind. Your end.', 'Your 7 Habits workshop certificate appears to be… missing.'] },
      crossfit: { intent: () => ({ kind: 'defend_buff', label: 'Morning CrossFit' }), act: (c, e) => { addStatus(c, e.uid, 'strength', 2); gainBlock(c, e.uid, 12) }, lines: ['I did 150 burpees before our 8am.', 'Wellness is a core value!', 'Habit 7: Sharpen the saw. I sharpened mine at 5am.', 'Habit 1: Be proactive. I already was. Twice.'] },
      offsite: { intent: () => ({ kind: 'heal', label: 'Team-Building Offsite' }), act: (c, e) => { heal(c, e.uid, 30); gainBlock(c, e.uid, 10); e.flags.offsite = 1 }, lines: ['Offsite in the Westfjords! Bring your feelings.', 'Offsite agenda: the 7 Habits workshop. All seven. Back to back.'] },
    },
    choose: (e) => {
      if (!e.flags.offsite && e.hp < e.maxHp * 0.5) return 'offsite'
      return cycle(e, ['survey', 'fun', 'pip', 'crossfit'])
    },
  },

  // ===================== ACT 2: The Open Office =====================
  {
    id: 'roche_manager', name: 'Roche Manager', hp: [42, 48], tier: 'normal',
    bio: 'Would like a quick sync about the quick sync.',
    moves: {
      requirements: { intent: () => ({ kind: 'defend_buff', label: 'Requirements Change' }), act: (c, e) => { addCards(c, 'meeting', 'draw', 2); gainBlock(c, e.uid, 7) }, lines: ['Small change: everything.', 'Let\'s set up a recurring sync.'] },
      escalation: { intent: () => A('Escalation', 12), act: (c, e) => hits(c, e, 12), lines: ['I have looped in my director.'] },
      audit: { intent: () => ({ kind: 'attack_debuff', label: 'Supplier Audit', damage: 7, hits: 1 }), act: (c, e) => { hits(c, e, 7); addStatus(c, 'player', 'vulnerable', 1) } },
    },
    choose: (e) => (e.turn === 0 ? 'requirements' : weighted(e, [['escalation', 45], ['audit', 35], ['requirements', 20]])),
  },
  {
    id: 'consultant', name: 'Big Four Consultant', hp: [34, 38], tier: 'normal',
    bio: 'Bills by the hour. Thinks by the slide.',
    moves: {
      deck: { intent: () => ({ kind: 'buff', label: '200-Slide Deck' }), act: (c, e) => addStatus(c, e.uid, 'ritual', 2), lines: ['Let me walk you through the framework.'] },
      invoice: { intent: () => A('Invoice', 6), act: (c, e) => hits(c, e, 6), lines: ['That will be 40 hours.', 'Synergy is billable.'] },
    },
    choose: (e) => (e.turn === 0 ? 'deck' : 'invoice'),
  },
  {
    id: 'procurement', name: 'Procurement Officer', hp: [30, 35], tier: 'normal',
    bio: 'Has a spreadsheet that proves you are overpriced.',
    moves: {
      haggle: { intent: () => A('Aggressive Haggling', 8), act: (c, e) => { hits(c, e, 8); c.goldStolen += 12000 }, lines: ['We need 40% off. Minimum.', 'Your competitor is cheaper.'] },
      budget: { intent: () => ({ kind: 'debuff', label: 'Budget Cut' }), act: (c) => { addStatus(c, 'player', 'weak', 2) } },
    },
    choose: (e) => weighted(e, [['haggle', 65], ['budget', 35]]),
  },
  {
    id: 'roche_vp', name: 'Roche VP of Supply Chain', title: 'Elite', hp: [125, 132], tier: 'elite',
    bio: 'Controls 11,000 lanes and one very long Teams call.',
    moves: {
      rollout: { intent: () => A('Global Rollout', 7, 3), act: (c, e) => hits(c, e, 7, 3), lines: ['142 countries by Q3.'] },
      penalty: { intent: () => A('Contractual Penalty', 20), act: (c, e) => hits(c, e, 20), lines: ['Section 14.2(b). Look it up.'] },
      sla: { intent: () => ({ kind: 'defend_buff', label: 'Renegotiate SLA' }), act: (c, e) => { addStatus(c, e.uid, 'strength', 3); gainBlock(c, e.uid, 15); addStatus(c, 'player', 'weak', 2) }, lines: ['99.99% uptime. Or else.'] },
    },
    choose: (e) => cycle(e, ['sla', 'rollout', 'penalty', 'rollout']),
  },
  {
    id: 'boss_cto', name: 'The CTO', title: 'Boss · After the Launch Party', hp: [230, 230], tier: 'boss',
    bio: 'Brilliant. Visionary. Currently seeing two of you.',
    start: (e) => {
      e.statuses.tipsy = 25
    },
    moves: {
      rant: { intent: () => A('Architecture Rant', 6, 3), act: (c, e) => hits(c, e, 6, 3), lines: ['I drew the architecture on this napkin. *hic*', 'Microservices! Macroservices! ALL the services!'] },
      rust: { intent: () => ({ kind: 'attack_debuff', label: 'Rewrite It All in Rust', damage: 12, hits: 1 }), act: (c, e) => { hits(c, e, 12); addCards(c, 'bug', 'draw', 3) }, lines: ['We rewrite everything. In Rust. Tonight.', 'Memory safe! Unlike me!'] },
      round: { intent: () => ({ kind: 'buff', label: 'Another Round!' }), act: (c, e) => { heal(c, e.uid, 18); addStatus(c, e.uid, 'strength', 3); e.statuses.tipsy = Math.min(60, st(e, 'tipsy') + 10); e.flags.rounds = (e.flags.rounds ?? 0) + 1 }, lines: ['Bartender! Put it on the R&D budget!', 'One more. For team morale.'] },
      k8s: { intent: () => A('Kubernetes for Everything', 26), act: (c, e) => hits(c, e, 26), lines: ['The coffee machine gets its own cluster!', 'Helm chart. For the fridge.'] },
      hangover: { intent: () => ({ kind: 'defend_buff', label: "Tomorrow's Problem" }), act: (c, e) => { addCards(c, 'hangover', 'draw', 2); gainBlock(c, e.uid, 14) }, lines: ['Who approved Java? …I did?'] },
      passout: { intent: () => ({ kind: 'sleep', label: 'Passed Out' }), act: (c, e) => { e.flags.slept = (e.flags.slept ?? 0) + 1; say(c, e.uid, 'Zzz… blockchain… zzz…') } },
    },
    choose: (e) => {
      const opener = ['rant', 'rust', 'round', 'k8s']
      if (e.turn < opener.length) return opener[e.turn]
      if ((e.flags.rounds ?? 0) >= 2 && (e.flags.slept ?? 0) < 1) return 'passout'
      return weighted(e, [['rant', 30], ['rust', 20], ['round', 15], ['k8s', 20], ['hangover', 15]])
    },
  },

  // ===================== ACT 3: The Boardroom =====================
  {
    id: 'board_member', name: 'Board Member', hp: [52, 58], tier: 'normal',
    bio: 'Attends one meeting a quarter. Changes everything.',
    moves: {
      governance: { intent: () => ({ kind: 'attack_debuff', label: 'Governance Review', damage: 9, hits: 1 }), act: (c, e) => { hits(c, e, 9); addStatus(c, 'player', 'vulnerable', 2) }, lines: ['In my day we used thermometers.'] },
      capital: { intent: () => A('Capital Call', 15), act: (c, e) => hits(c, e, 15) },
    },
    choose: (e) => weighted(e, [['governance', 45], ['capital', 55]]),
  },
  {
    id: 'vc', name: 'Venture Capitalist', hp: [44, 48], tier: 'normal',
    bio: 'Wants 10x. Offers a Patagonia vest.',
    moves: {
      dilution: { intent: () => ({ kind: 'attack_debuff', label: 'Dilution', damage: 6, hits: 1 }), act: (c, e) => { hits(c, e, 6); addStatus(c, 'player', 'strength', -1) }, lines: ['Just a small down round.'] },
      term: { intent: () => ({ kind: 'attack_defend', label: 'Term Sheet', damage: 5, hits: 2 }), act: (c, e) => { hits(c, e, 5, 2); gainBlock(c, e.uid, 8) }, lines: ['Liquidation preference: 3x. Standard.'] },
    },
    choose: (e) => weighted(e, [['dilution', 40], ['term', 60]]),
  },
  {
    id: 'sensitech_director', name: 'Sensitech Regional Director', hp: [60, 66], tier: 'normal',
    bio: 'Has a PowerPoint about your weaknesses. It is 4:3.',
    moves: {
      rfp: { intent: () => A('Undercut the RFP', 14), act: (c, e) => hits(c, e, 14), lines: ['We bid one euro less.'] },
      legacy: { intent: () => ({ kind: 'defend', label: 'Legacy Contract' }), act: (c, e) => gainBlock(c, e.uid, 14), lines: ['They signed with us in 2004. Auto-renewal.'] },
    },
    choose: (e) => weighted(e, [['rfp', 60], ['legacy', 40]]),
  },
  {
    id: 'fda_inspector', name: 'The Regulatory Inspector', title: 'Elite', hp: [165, 172], tier: 'elite',
    bio: 'Arrived unannounced. Will leave with a binder.',
    moves: {
      form483: { intent: () => ({ kind: 'attack_debuff', label: 'Observation Form', damage: 14, hits: 1 }), act: (c, e) => { hits(c, e, 14); addCards(c, 'deviation', 'draw', 2) }, lines: ['Observation number one…'] },
      warning: { intent: () => ({ kind: 'debuff', label: 'Warning Letter' }), act: (c) => { addStatus(c, 'player', 'vulnerable', 3); addStatus(c, 'player', 'weak', 3) }, lines: ['You will be hearing from us.'] },
      shutdown: { intent: () => A('Plant Shutdown', 30), act: (c, e) => hits(c, e, 30), lines: ['Close the line.'] },
    },
    choose: (e) => cycle(e, ['form483', 'warning', 'shutdown']),
  },
  {
    id: 'yes_man', name: 'Yes-Man', hp: [14, 17], tier: 'minion',
    bio: 'Agrees. Loudly.',
    moves: {
      nod: { intent: () => ({ kind: 'buff', label: 'Enthusiastic Nodding' }), act: (c) => { for (const x of livingEnemies(c)) addStatus(c, x.uid, 'strength', 1) }, lines: ['Absolutely!', 'Great point!', '100%!'] },
      jab: { intent: () => A('Agreeable Jab', 5), act: (c, e) => hits(c, e, 5) },
    },
    choose: (e) => weighted(e, [['nod', 45], ['jab', 55]]),
  },
  {
    id: 'boss_ceo', name: 'The CEO', title: 'Boss · Chief Everything Officer', hp: [235, 235], tier: 'boss',
    bio: 'Bald by choice. Vest by conviction. Insulated against all feedback.',
    start: (e) => {
      e.statuses.metallicize = 5
    },
    moves: {
      allhands: { intent: () => ({ kind: 'summon', label: 'Quarterly All-Hands' }), act: (c, e) => { summon(c, 'yes_man', 2); gainBlock(c, e.uid, 10) }, lines: ["We're not a logistics company. We're a data company.", 'Growth mindset, people!'] },
      synergy: { intent: () => A('Synergy!', 7, 3), act: (c, e) => hits(c, e, 7, 3), lines: ['Synergy! Alignment! Leverage!', 'Let\'s double-click on that.'] },
      pivot: { intent: () => ({ kind: 'defend_buff', label: 'Pivot to AI' }), act: (c, e) => { gainBlock(c, e.uid, 20); addStatus(c, 'player', 'weak', 2); addStatus(c, 'player', 'vulnerable', 2) }, lines: ['New strategy: AI. Details to follow.', 'We are pivoting. Again.'] },
      restructure: { intent: () => A('Restructuring', 25), act: (c, e) => hits(c, e, 25), lines: ["Let's take this offline. Permanently.", 'Your role has been… right-sized.'] },
      vision: { intent: () => ({ kind: 'buff', label: 'Vision 2030' }), act: (c, e) => { addStatus(c, e.uid, 'strength', 4) }, lines: ['By 2030, every banana on Earth, tracked.'] },
    },
    choose: (e, c) => {
      const minions = livingEnemies(c).filter((x) => x.defId === 'yes_man').length
      if (e.turn > 0 && minions === 0 && e.history.slice(-3).indexOf('allhands') === -1) return 'allhands'
      return cycle(e, ['allhands', 'synergy', 'pivot', 'restructure', 'vision', 'synergy', 'restructure'])
    },
  },

  // ===================== ACT 4: The Saltpeter Mine =====================
  {
    id: 'boss_peter', name: 'Peter', title: 'The Saltpeter Guardian', hp: [420, 420], tier: 'boss',
    bio: 'Has guarded the potassium nitrate for 400 years. Preserved by it, too.',
    start: (e) => {
      e.statuses.thorns = 2
    },
    moves: {
      grind: { intent: () => ({ kind: 'defend_buff', label: 'Grind the Nitrate (cures Excursion)' }), act: (c, e) => { addStatus(c, e.uid, 'charge', 1); gainBlock(c, e.uid, 18); const x = st(e, 'excursion'); if (x > 1) addStatus(c, e.uid, 'excursion', -Math.ceil(x / 2)) }, lines: ['Potassium. Nitrogen. Oxygen. Three.', 'The powder… is almost… ready.'] },
      salt: { intent: () => ({ kind: 'attack_debuff', label: 'Salt in the Wound', damage: 11, hits: 1 }), act: (c, e) => { hits(c, e, 11); addStatus(c, 'player', 'vulnerable', 2) }, lines: ['A little salt. For flavor.'] },
      spikes: { intent: () => A('Crystal Spikes', 5, 4), act: (c, e) => hits(c, e, 5, 4), lines: ['None shall pass the Saltpeter!'] },
      preserve: { intent: () => ({ kind: 'heal', label: 'Preserve Forever (cleanses Excursion)' }), act: (c, e) => { heal(c, e.uid, 40); delete e.statuses.excursion; addStatus(c, 'player', 'frail', 3); e.flags.preserved = 1 }, lines: ['Saltpeter preserves. Saltpeter endures.'] },
      boom: { intent: () => A('KNO₃ DETONATION', 40), act: (c, e) => { hits(c, e, 40); delete e.statuses.charge; addStatus(c, e.uid, 'strength', 2) }, lines: ['FIRE IN THE HOLE!'] },
    },
    choose: (e) => {
      if (st(e, 'charge') >= 3) return 'boom'
      if (!e.flags.preserved && e.hp < e.maxHp * 0.4) return 'preserve'
      return cycle(e, ['grind', 'salt', 'spikes', 'grind', 'spikes', 'grind', 'salt'])
    },
  },
]

export const ENEMY: Record<string, EnemyDef> = Object.fromEntries(defs.map((d) => [d.id, d]))

export function mkEnemy(defId: string, act = 1): EnemyInst {
  const d = ENEMY[defId]
  const scale = d.tier === 'boss' ? 1 : 1 + (act - 1) * 0.05
  const hp = Math.round((d.hp[0] + Math.floor(Math.random() * (d.hp[1] - d.hp[0] + 1))) * scale)
  return { uid: uid(), defId, hp, maxHp: hp, block: 0, statuses: {}, move: '', history: [], turn: 0, flags: {}, dead: false }
}

export function summon(c: Combat, defId: string, n: number) {
  for (let i = 0; i < n; i++) {
    if (livingEnemies(c).length >= 4) return
    const m = mkEnemy(defId)
    m.move = ENEMY[defId].choose(m, c)
    c.enemies.unshift(m)
  }
}

export function intentOf(e: EnemyInst, c: Combat): Intent {
  return ENEMY[e.defId].moves[e.move].intent(e, c)
}

/** Display damage per hit after strength/weak/vulnerable. */
export function shownDamage(e: EnemyInst, c: Combat): number | null {
  const it = intentOf(e, c)
  if (it.damage === undefined) return null
  return attackValue(c, e.uid, 'player', it.damage)
}

setIncomingDamage((c) =>
  livingEnemies(c).reduce((sum, e) => {
    const it = intentOf(e, c)
    const d = shownDamage(e, c)
    return sum + (d ?? 0) * (it.hits ?? 1)
  }, 0),
)

export function speak(c: Combat, e: EnemyInst, moveId: string) {
  const lines = ENEMY[e.defId].moves[moveId].lines
  const chance = ENEMY[e.defId].tier === 'boss' ? 0.9 : 0.4
  if (lines?.length && Math.random() < chance) say(c, e.uid, pick(lines))
}

export const ENCOUNTERS: Record<number, { easy: string[][]; hard: string[][]; elite: string[][]; boss: string }> = {
  1: {
    easy: [['sensitech_minion', 'sensitech_minion'], ['qa_employee'], ['temptale', 'temptale', 'temptale'], ['sensitech_rep']],
    hard: [['sensitech_minion', 'sensitech_minion', 'temptale'], ['qa_employee', 'temptale'], ['sensitech_rep', 'sensitech_minion'], ['qa_employee', 'sensitech_minion']],
    elite: [['lead_auditor']],
    boss: 'boss_pc',
  },
  2: {
    easy: [['roche_manager'], ['consultant', 'temptale'], ['procurement', 'sensitech_minion']],
    hard: [['roche_manager', 'consultant'], ['procurement', 'procurement'], ['qa_employee', 'roche_manager'], ['consultant', 'consultant']],
    elite: [['roche_vp'], ['lead_auditor', 'qa_employee']],
    boss: 'boss_cto',
  },
  3: {
    easy: [['board_member'], ['vc', 'consultant'], ['sensitech_director']],
    hard: [['board_member', 'vc'], ['sensitech_director', 'sensitech_rep'], ['roche_manager', 'roche_manager'], ['vc', 'vc']],
    elite: [['fda_inspector'], ['roche_vp', 'procurement']],
    boss: 'boss_ceo',
  },
  4: { easy: [], hard: [], elite: [], boss: 'boss_peter' },
}
