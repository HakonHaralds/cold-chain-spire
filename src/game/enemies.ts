import {
  addCards,
  addFloat,
  addStatus,
  attack,
  attackValue,
  banner,
  drawCards,
  enemyEvents,
  freezeRandomCard,
  fx,
  gainBlock,
  heal,
  livingEnemies,
  pick,
  say,
  st,
  uid,
} from './core'
import { DEF, setIncomingDamage } from './cards'
import type { CardInst, Combat, EnemyInst, Intent, Run, StatusId } from './types'

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
  /** Multiplier on Excursion damage this enemy takes (default 1). */
  excursionTaken?: number
  /** How much its Excursion drops each turn (default 1). */
  excursionDecay?: number
  start?: (e: EnemyInst, c: Combat) => void
  moves: Record<string, Move>
  choose: (e: EnemyInst, c: Combat) => string
  bio?: string
  // ---- optional mechanic hooks ----
  /** After the player's start-of-turn draw. */
  onPlayerTurnStart?: (e: EnemyInst, c: Combat) => void
  /** After the player plays a card. */
  onPlayerCardPlayed?: (e: EnemyInst, c: Combat, card: CardInst, type: string) => void
  /** Player-sourced damage to this enemy (HP + Block removed); `blockBroken` when its Block just hit 0. */
  onDamaged?: (e: EnemyInst, c: Combat, amount: number, blockBroken: boolean) => void
  /** At the start of its own turn, before its move (after Excursion ticks). */
  beforeAct?: (e: EnemyInst, c: Combat) => void
  /** Right after its move. */
  afterAct?: (e: EnemyInst, c: Combat) => void
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
// ---- The Global Audit: three phases with rule changes ----
const AUDIT_MOVES: Record<number, string[]> = { 1: ['checklist', 'evidence', 'minor'], 2: ['trace', 'capa', 'major'], 3: ['mapping', 'probe', 'warning', 'probe'] }
const AUDIT_GATE: Record<number, number> = { 1: 35, 2: 45 }
const AUDIT_STATUS: Record<number, StatusId> = { 1: 'docReview', 2: 'traceability' }
const AUDIT_TURNS = 5
const AUDIT_PHASE_INFO: Record<number, [string, string]> = {
  1: ['Phase 1 · Documentation Review', 'Your Block gains are halved. Deal 35 damage in one turn to move on.'],
  2: ['Phase 2 · Traceability Check', 'Playing the same card twice in a turn costs 3 HP. Deal 45 damage in one turn to move on.'],
  3: ['Phase 3 · Temperature Mapping', 'Excursion damage on you is doubled. Final phase!'],
}
function setAuditPhase(e: EnemyInst, c: Combat, phase: number, quiet = false) {
  e.flags.phase = phase
  e.flags.phaseTurns = 0
  e.flags.turnDmg = 0
  for (const k of ['docReview', 'traceability', 'tempMapping', 'auditGate'] as const) delete e.statuses[k]
  if (phase === 1) {
    c.rules = { blockMul: 0.5 }
    e.statuses.docReview = AUDIT_TURNS
  } else if (phase === 2) {
    c.rules = { repeatPenalty: 3 }
    e.statuses.traceability = AUDIT_TURNS
  } else {
    c.rules = { excursionMul: 2 }
    e.statuses.tempMapping = 1
  }
  const gate = AUDIT_GATE[phase]
  // Mid-turn advances only reveal the next gate at the start of the next turn.
  if (gate && quiet) e.statuses.auditGate = gate
  if (!quiet) {
    fx(c, e.uid, 'buff', true)
    e.move = AUDIT_MOVES[phase][0]
  }
  banner(c, ...AUDIT_PHASE_INFO[phase])
}

/** The CFO's forecast grows every turn he's alive (capped). */
const forecastDamage = (e: EnemyInst) => Math.min(26, 7 + 2 * e.turn)
const RARITY_RANK: Record<string, number> = { rare: 4, uncommon: 3, common: 2, basic: 1 }
/** The Recruiter headhunts your best card: highest rarity, then cost, then upgraded. */
function bestCard(c: Combat): CardInst | undefined {
  const pool = [...c.draw, ...c.hand, ...c.discard].filter((x) => RARITY_RANK[DEF[x.id]?.rarity] !== undefined)
  const score = (x: CardInst) => RARITY_RANK[DEF[x.id].rarity] * 100 + Math.max(0, DEF[x.id].cost) * 10 + (x.upgraded ? 5 : 0)
  return pool.sort((a, b) => score(b) - score(a))[0]
}
/** Countdown shown under Frank's name: his RAM comes every 3rd move. */
const ramNote = (e: EnemyInst) => {
  const k = (2 - (e.turn % 3) + 3) % 3
  return k === 0 ? '🚜 RAM next turn! Block up to slow him' : `🚜 RAM in ${k + 1} turns`
}
/** Forklift Frank's RAM: the number shown already counts the Speed your current Block will knock off. */
const ramDamage = (e: EnemyInst, c: Combat) => 12 + 3 * Math.max(0, st(e, 'speed') - Math.floor(c.player.block / 6))

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

  // ---------- Act 1 additions ----------
  {
    id: 'boss_forklift', name: 'Forklift Frank', title: 'Boss · Welded to the Forklift', hp: [190, 190], tier: 'boss',
    bio: 'Nobody has seen Frank without his forklift since the 2011 Christmas party. HR has stopped asking.',
    start: (e) => {
      e.statuses.speed = 2
      e.flags.maxSpeed = 2
      e.note = ramNote(e)
    },
    moves: {
      ram: {
        intent: (e, c) => A('RAM! (12 + 3×Speed)', ramDamage(e, c)),
        act: (c, e) => {
          hits(c, e, 12 + 3 * st(e, 'speed'))
          e.statuses.speed = Math.ceil(st(e, 'speed') / 2)
          addFloat(c, e.uid, 'Momentum spent', 'status')
        },
        lines: ['OUT OF THE AISLE!', 'Pallets have right of way. I AM the pallets.', 'BEEP BEEP BEEP — oh, that was you.'],
      },
      reverse: { intent: () => A('Beep-Beep-Reverse', 5, 3), act: (c, e) => hits(c, e, 5, 3), lines: ['Reversing. Reversing. Still reversing.', 'Mind the forks!'] },
      honk: { intent: () => ({ kind: 'debuff', label: 'HONK!' }), act: (c) => { addStatus(c, 'player', 'weak', 1); addStatus(c, 'player', 'frail', 1) }, lines: ['HOOOONK!', 'That horn is load-bearing.'] },
      load: { intent: () => ({ kind: 'defend', label: 'Load the Pallets' }), act: (c, e) => gainBlock(c, e.uid, 14), lines: ['Forty loggers per pallet. Stack them high.', 'Two more pallets. For stability.'] },
    },
    choose: (e) => {
      const t = e.turn % 3
      if (t === 2) return 'ram'
      return t === 0 ? weighted(e, [['reverse', 60], ['honk', 40]]) : weighted(e, [['load', 55], ['reverse', 45]])
    },
    beforeAct: (e, c) => {
      // Block you hold when he acts is pallets in his way: every 6 Block knocks off 1 Speed.
      const knock = Math.min(st(e, 'speed'), Math.floor(c.player.block / 6))
      if (knock > 0) {
        e.statuses.speed = st(e, 'speed') - knock
        if (!e.statuses.speed) delete e.statuses.speed
        addFloat(c, e.uid, `−${knock} Speed (blocked the aisle!)`, 'status')
      }
    },
    afterAct: (e) => {
      e.statuses.speed = st(e, 'speed') + 2
      e.flags.maxSpeed = Math.max(e.flags.maxSpeed ?? 0, e.statuses.speed)
      e.note = ramNote(e)
    },
  },
  {
    id: 'pallet_golem', name: 'The Pallet Golem', title: 'Elite', hp: [98, 104], tier: 'elite',
    bio: 'Somebody stacked the returns too high and it achieved sentience. Load rating: yes.',
    start: (e) => {
      e.statuses.layers = 4
      e.block = 12
    },
    moves: {
      restack: { intent: () => ({ kind: 'attack_defend', label: 'Restack', damage: 7, hits: 1 }), act: (c, e) => { hits(c, e, 7); if (st(e, 'layers')) gainBlock(c, e.uid, 16) }, lines: ['*creaks in wood*', 'Stack. Wrap. Stack. Wrap.'] },
      slam: { intent: () => A('Pallet Slam', 16), act: (c, e) => { hits(c, e, 16); if (st(e, 'layers')) gainBlock(c, e.uid, 9) }, lines: ['EURO PALLET, 1200 BY 800!'] },
      splinter: { intent: () => A('Splinter Storm', 5, 3), act: (c, e) => { hits(c, e, 5, 3); if (st(e, 'layers')) gainBlock(c, e.uid, 9) }, lines: ['Splinters. Everywhere. Forever.'] },
    },
    choose: (e) => (st(e, 'layers') ? cycle(e, ['restack', 'slam', 'restack', 'splinter']) : weighted(e, [['slam', 55], ['splinter', 45]])),
    onDamaged: (e, c, _n, broken) => {
      if (!broken || !st(e, 'layers') || c.phase !== 'player') return
      e.statuses.layers = st(e, 'layers') - 1
      addFloat(c, e.uid, 'Layer down!', 'status')
      fx(c, e.uid, 'blockhit', true)
      drawCards(c, 1)
      if (!e.statuses.layers) {
        delete e.statuses.layers
        e.statuses.vulnerable = 3
        say(c, e.uid, '*wobbles* …I was never up to code.')
      }
    },
    afterAct: (e) => {
      if (!st(e, 'layers')) e.statuses.vulnerable = Math.max(st(e, 'vulnerable'), 2)
    },
  },
  {
    id: 'office_printer', name: 'The Office Printer', title: 'Elite', hp: [70, 76], tier: 'elite',
    bio: 'Has jammed every day since 2009. IT says it is "working as designed".',
    moves: {
      print: { intent: () => ({ kind: 'summon', label: 'Print Job (x2)' }), act: (c) => summon(c, 'paper_minion', 2), lines: ['PRINTING 214 PAGES. DOUBLE-SIDED. IN COLOUR.', 'Your job is next in the queue. Behind 400 others.'] },
      jam: { intent: () => ({ kind: 'defend_buff', label: 'Paper Jam' }), act: (c, e) => { addCards(c, 'pc_load_letter', 'draw', 2); gainBlock(c, e.uid, 8) }, lines: ['PC LOAD LETTER.', 'Please remove paper from Tray 2. There is no Tray 2.'] },
      toner: { intent: () => ({ kind: 'attack_debuff', label: 'Toner Spill', damage: 9, hits: 1 }), act: (c, e) => { hits(c, e, 9); addStatus(c, 'player', 'weak', 2) }, lines: ['LOW TONER. HAVE SOME.', '*grinding noises*'] },
    },
    choose: (e, c) => {
      const minions = livingEnemies(c).filter((x) => x.defId === 'paper_minion').length
      if (e.turn === 0) return 'print'
      if (minions === 0 && e.history.at(-1) !== 'print') return 'print'
      return cycle(e, ['jam', 'toner', 'toner', 'jam', 'toner'])
    },
  },
  {
    id: 'paper_minion', name: 'Sheet of A4', hp: [7, 9], tier: 'minion',
    bio: 'Freshly printed. Still warm. Extremely sharp edges.',
    moves: {
      cut: { intent: () => A('Paper Cut', 3), act: (c, e) => hits(c, e, 3), lines: ['Fwip!'] },
      fold: { intent: () => ({ kind: 'attack_defend', label: 'Fold', damage: 2, hits: 1 }), act: (c, e) => { hits(c, e, 2); gainBlock(c, e.uid, 4) } },
    },
    choose: (e) => weighted(e, [['cut', 65], ['fold', 35]]),
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

  // ---------- Act 2 additions ----------
  {
    id: 'boss_cfo', name: 'The CFO', title: 'Boss · Budget Freeze', hp: [225, 225], tier: 'boss', excursionDecay: 2,
    bio: 'Keeps the thermostat at 16 °C to save money. Has never once been cold. Might be made of ice. (Cost controls: Excursion on the CFO wears off twice as fast.)',
    start: (e) => {
      e.statuses.costcut = 1
      e.block = 12
    },
    moves: {
      forecast: {
        intent: (e) => A('Quarterly Forecast', forecastDamage(e)),
        act: (c, e) => hits(c, e, forecastDamage(e)),
        lines: ['Q1 was bad. Q2 will be worse. Q3 is you.', 'According to my forecast, this will hurt.', 'The numbers are going up. That is not good.'],
      },
      freeze: {
        intent: () => ({ kind: 'defend_buff', label: 'Budget Freeze' }),
        act: (c, e) => { gainBlock(c, e.uid, 16); e.flags.extraFreeze = 1 },
        lines: ['All discretionary spending is frozen. Including you.', 'Every card over 1 Energy needs CFO approval now.', 'Brr. That is the sound of fiscal discipline.'],
      },
      audit: {
        intent: () => ({ kind: 'attack_debuff', label: 'Audit Expenses', damage: 7, hits: 1 }),
        act: (c, e) => {
          hits(c, e, 7)
          addStatus(c, 'player', 'weak', 2)
          c.goldStolen += 15000
          addFloat(c, 'player', '−15k tokens (disallowed expense)', 'status')
        },
        lines: ['A €14 lunch? With WHO?', 'This taxi receipt is in Icelandic. Rejected.', 'Your expense report has been… reclassified.'],
      },
      hiring: {
        intent: () => ({ kind: 'defend_buff', label: 'Hiring Freeze' }),
        act: (c, e) => { addCards(c, 'hiring_freeze', 'draw', 2); gainBlock(c, e.uid, 10) },
        lines: ['Hiring freeze. Effective immediately. Retroactively.', 'We will backfill that role in 2031.'],
      },
      bottom: { intent: () => A('The Bottom Line', 24), act: (c, e) => hits(c, e, 24), lines: ['Let me show you the bottom line.', 'This is what EBITDA looks like up close.'] },
    },
    choose: (e) => cycle(e, ['forecast', 'freeze', 'audit', 'hiring', 'forecast', 'bottom', 'freeze']),
    onPlayerTurnStart: (e, c) => {
      const n = 1 + (e.flags.extraFreeze ? 1 : 0)
      e.flags.extraFreeze = 0
      let frozen = 0
      for (let i = 0; i < n; i++) if (freezeRandomCard(c)) frozen++
      if (frozen && Math.random() < 0.35) say(c, e.uid, pick(['That card is on hold pending review.', 'Frozen. Try again next quarter.', 'Not in this budget cycle.']))
    },
  },
  {
    id: 'recruiter', name: "The Competitor's Recruiter", title: 'Elite', hp: [66, 70], tier: 'elite',
    bio: 'Has a headset, a ring light and a very exciting opportunity for you. Mostly for your best card.',
    start: (e, c) => {
      e.statuses.escape = 4
      const target = bestCard(c)
      if (target) {
        e.data = { target: target.uid, name: DEF[target.id].name + (target.upgraded ? '+' : '') }
        e.note = `🎯 After your ${e.data.name}`
      }
    },
    moves: {
      offer: { intent: () => ({ kind: 'defend_buff', label: 'Competitive Offer' }), act: (c, e) => { gainBlock(c, e.uid, 10); addStatus(c, 'player', 'weak', 1) }, lines: ['Unlimited PTO. Unlimited kombucha. Unlimited ambiguity.', 'We are like a family. A family that pays 20% more.'] },
      poach: { intent: () => A('Poach', 11), act: (c, e) => hits(c, e, 11), lines: ['Just a quick 15-minute call. Right now.', 'I saw your LinkedIn. Loved it. Anyway.'] },
      network: { intent: () => A('Networking', 5, 2), act: (c, e) => hits(c, e, 5, 2), lines: ['Let me connect you with… myself.'] },
    },
    choose: (e) => cycle(e, ['offer', 'poach', 'network', 'poach']),
    afterAct: (e, c) => {
      const left = st(e, 'escape') - 1
      if (left > 0) {
        e.statuses.escape = left
        if (left === 1) say(c, e.uid, `Last chance. Your ${e.data?.name ?? 'best card'} and I are leaving after this.`)
        return
      }
      // Escape: walks out with the card, permanently.
      delete e.statuses.escape
      e.escaped = true
      e.dead = true
      e.block = 0
      const uidT = e.data?.target
      if (uidT) {
        for (const pile of ['draw', 'hand', 'discard', 'exhaust'] as const) {
          const i = c[pile].findIndex((x) => x.uid === uidT)
          if (i >= 0) c[pile].splice(i, 1)
        }
        c.stolenCards = [...(c.stolenCards ?? []), uidT]
      }
      addFloat(c, e.uid, `Escaped with ${e.data?.name ?? 'your card'}!`, 'miss')
      say(c, e.uid, `Pleasure doing business. ${e.data?.name ?? 'Your card'} starts Monday.`)
      e.note = `🏃 Left with your ${e.data?.name ?? 'card'}`
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

  // ---------- Act 3 additions ----------
  {
    id: 'boss_audit', name: 'The Global Audit', title: 'Boss · Three-Phase Inspection', hp: [345, 345], tier: 'boss', excursionTaken: 0.5,
    bio: 'The customer’s quality board, fused into one towering binder. It has read every SOP. It has questions about all of them. (Verified temperature records: takes half damage from Excursion.)',
    start: (e, c) => setAuditPhase(e, c, 1, true),
    moves: {
      checklist: { intent: () => A('The Checklist', 7, 3), act: (c, e) => hits(c, e, 7, 3), lines: ['Item 1 of 1,204.', 'Is this signed? In ink? Blue ink?'] },
      evidence: { intent: () => ({ kind: 'defend_buff', label: 'Request Evidence' }), act: (c, e) => { gainBlock(c, e.uid, 14); addCards(c, 'deviation', 'discard', 1) }, lines: ['Please provide evidence. Of the evidence.', 'Where is the training record for this training record?'] },
      minor: { intent: () => ({ kind: 'attack_debuff', label: 'Minor Observation', damage: 15, hits: 1 }), act: (c, e) => { hits(c, e, 15); addStatus(c, 'player', 'frail', 2) }, lines: ['A minor observation. For now.'] },
      trace: { intent: () => A('Trace the Batch', 10, 2), act: (c, e) => hits(c, e, 10, 2), lines: ['Show me where this logger was on March 3rd at 02:14.', 'Traceability is not optional.'] },
      major: { intent: () => A('Major Observation', 26), act: (c, e) => hits(c, e, 26), lines: ['This is a major observation.', 'I am writing this one in capitals.'] },
      capa: { intent: () => ({ kind: 'defend_buff', label: 'CAPA Plan' }), act: (c, e) => { gainBlock(c, e.uid, 16); addStatus(c, 'player', 'weak', 2) }, lines: ['We expect a CAPA plan within 30 days. Or 30 seconds.'] },
      mapping: { intent: () => ({ kind: 'attack_debuff', label: 'Temperature Mapping', damage: 10, hits: 1 }), act: (c, e) => { hits(c, e, 10); addStatus(c, 'player', 'excursion', 4) }, lines: ['Hot spot detected. It is you.', 'Your warehouse is 2.1 °C. The spec says 2.0.'] },
      probe: { intent: () => A('Probe Every Corner', 8, 3), act: (c, e) => hits(c, e, 8, 3), lines: ['Every corner. Every shelf. Every pocket.'] },
      warning: { intent: () => A('Warning Letter', 36), act: (c, e) => hits(c, e, 36), lines: ['You will be receiving a Warning Letter.', 'Certified mail. Signature required.'] },
    },
    choose: (e) => {
      const order = AUDIT_MOVES[e.flags.phase ?? 1]
      return order[(e.flags.phaseTurns ?? 0) % order.length]
    },
    onPlayerTurnStart: (e) => {
      e.flags.turnDmg = 0
      e.flags.advanced = 0
      const gate = AUDIT_GATE[e.flags.phase ?? 1]
      if (gate) e.statuses.auditGate = gate
    },
    onDamaged: (e, c, n) => {
      const phase = e.flags.phase ?? 1
      const gate = AUDIT_GATE[phase]
      if (!gate || e.flags.advanced || c.phase !== 'player') return
      e.flags.turnDmg = (e.flags.turnDmg ?? 0) + n
      const left = gate - e.flags.turnDmg
      if (left > 0) {
        e.statuses.auditGate = left
        return
      }
      e.flags.advanced = 1
      say(c, e.uid, pick(['Fine. FINE. Moving on to the next section.', 'Acceptable. Next phase.', 'Noted. Turn to page 400.']))
      setAuditPhase(e, c, phase + 1)
    },
    afterAct: (e, c) => {
      const phase = e.flags.phase ?? 1
      e.flags.phaseTurns = (e.flags.phaseTurns ?? 0) + 1
      if (phase >= 3) return
      const key = AUDIT_STATUS[phase]
      const left = AUDIT_TURNS - e.flags.phaseTurns
      if (left > 0) {
        e.statuses[key] = left
        return
      }
      addCards(c, 'finding', 'discard', 2)
      e.flags.findings = (e.flags.findings ?? 0) + 2
      say(c, e.uid, 'Time is up. Two Findings. Next phase.')
      setAuditPhase(e, c, phase + 1)
    },
  },
  {
    id: 'influencer', name: 'The LinkedIn Influencer', title: 'Elite', hp: [172, 180], tier: 'elite',
    bio: 'Agree? 👇 Thought leader, keynote speaker, 3× "Top Voice". Has never shipped anything.',
    start: (e) => {
      e.statuses.clout = 1
      e.statuses.strength = 3
    },
    moves: {
      bait: { intent: () => A('Engagement Bait', 7, 3), act: (c, e) => hits(c, e, 7, 3), lines: ['Hot take: cold chains should be warm. Agree?', 'Like if you agree, repost if you REALLY agree.'] },
      post: { intent: () => ({ kind: 'attack_debuff', label: 'Thought Leadership', damage: 8, hits: 1 }), act: (c, e) => { hits(c, e, 8); addStatus(c, 'player', 'weak', 2); addStatus(c, 'player', 'frail', 1) }, lines: ['I asked my 4-year-old about supply chains. 🧵 1/47', 'Unpopular opinion: meetings are good.'] },
      viral: { intent: () => A('Goes Viral', 26), act: (c, e) => hits(c, e, 26), lines: ['This post is doing numbers.', '10k reactions and counting. Mostly you, hitting me.'] },
      humble: { intent: () => ({ kind: 'defend_buff', label: 'Humblebrag' }), act: (c, e) => { gainBlock(c, e.uid, 20); addStatus(c, e.uid, 'strength', 2) }, lines: ['Humbled and honoured to announce… me.', 'So grateful. So blessed. So much reach.'] },
    },
    choose: (e) => cycle(e, ['bait', 'post', 'viral', 'humble', 'bait', 'viral']),
    onPlayerCardPlayed: (e, c, _card, type) => {
      if (type === 'attack') {
        addStatus(c, e.uid, 'strength', 1)
        addFloat(c, e.uid, '+1 Follower', 'status')
      } else if (type === 'skill' && st(e, 'strength') > 0) {
        addStatus(c, e.uid, 'strength', -1)
      }
    },
  },
  {
    id: 'consulting_partner', name: 'The Consulting Partner', title: 'Elite', hp: [124, 130], tier: 'elite',
    bio: 'Leads a team of juniors billed at partner rates. Knows your business better than you. Allegedly.',
    start: (e) => {
      e.statuses.metallicize = 5
    },
    moves: {
      hire: { intent: () => ({ kind: 'summon', label: 'Staff the Project' }), act: (c, e) => { summon(c, 'junior_consultant', 1); gainBlock(c, e.uid, 12) }, lines: ['I am adding three more juniors to the engagement.', 'Scope creep is a growth opportunity.'] },
      leverage: { intent: () => ({ kind: 'buff', label: 'Leverage Synergies' }), act: (c) => { for (const j of livingEnemies(c).filter((x) => x.defId === 'junior_consultant')) addStatus(c, j.uid, 'strength', 3) }, lines: ['Team, let us leverage our synergies.', 'Circle back and double-click on the deliverables.'] },
      invoice: { intent: () => A('Final Invoice', 22), act: (c, e) => hits(c, e, 22), lines: ['Our fees are non-negotiable. And non-refundable.'] },
    },
    choose: (e, c) => {
      const juniors = livingEnemies(c).filter((x) => x.defId === 'junior_consultant').length
      if (juniors < 2 && livingEnemies(c).length < 4) return 'hire'
      if (juniors < 3 && e.history.at(-1) !== 'hire' && livingEnemies(c).length < 4) return 'hire'
      return weighted(e, [['leverage', 45], ['invoice', 55]])
    },
  },
  {
    id: 'junior_consultant', name: 'Junior Consultant', hp: [18, 22], tier: 'minion',
    bio: 'Graduated in June. Bills at €400 an hour. Has a framework for everything.',
    moves: {
      bill: {
        intent: () => A('Billable Hours', 7),
        act: (c, e) => {
          hits(c, e, 7)
          c.goldStolen += 5000
          addFloat(c, 'player', '−5k tokens (billed)', 'status')
        },
        lines: ['That was a 6-minute call. Billed as an hour.', 'Travel time is billable.'],
      },
      deck: { intent: () => ({ kind: 'defend', label: 'Slide Deck' }), act: (c, e) => gainBlock(c, e.uid, 5) },
    },
    choose: (e) => weighted(e, [['bill', 70], ['deck', 30]]),
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

export const ENCOUNTERS: Record<number, { easy: string[][]; hard: string[][]; elite: string[][]; bosses: string[] }> = {
  1: {
    easy: [['sensitech_minion', 'sensitech_minion'], ['qa_employee'], ['temptale', 'temptale', 'temptale'], ['sensitech_rep']],
    hard: [['sensitech_minion', 'sensitech_minion', 'temptale'], ['qa_employee', 'temptale'], ['sensitech_rep', 'sensitech_minion'], ['qa_employee', 'sensitech_minion']],
    elite: [['lead_auditor'], ['pallet_golem'], ['office_printer']],
    bosses: ['boss_pc', 'boss_forklift'],
  },
  2: {
    easy: [['roche_manager'], ['consultant', 'temptale'], ['procurement', 'sensitech_minion']],
    hard: [['roche_manager', 'consultant'], ['procurement', 'procurement'], ['qa_employee', 'roche_manager'], ['consultant', 'consultant']],
    elite: [['roche_vp'], ['lead_auditor', 'qa_employee'], ['recruiter']],
    bosses: ['boss_cto', 'boss_cfo'],
  },
  3: {
    easy: [['board_member'], ['vc', 'consultant'], ['sensitech_director']],
    hard: [['board_member', 'vc'], ['sensitech_director', 'sensitech_rep'], ['roche_manager', 'roche_manager'], ['vc', 'vc']],
    elite: [['fda_inspector'], ['roche_vp', 'procurement'], ['influencer'], ['junior_consultant', 'junior_consultant', 'consulting_partner']],
    bosses: ['boss_ceo', 'boss_audit'],
  },
  4: { easy: [], hard: [], elite: [], bosses: ['boss_peter'] },
}

/** Roll one boss per act for a new run (S1: each act has a pool). */
export const rollBosses = (): string[] => [1, 2, 3, 4].map((a) => pick(ENCOUNTERS[a].bosses))

/** The boss this run faces in its current (or given) act; older saves fall back to the original boss. */
export const bossFor = (run: Pick<Run, 'act' | 'bosses'>, act = run.act): string => run.bosses?.[act - 1] ?? ENCOUNTERS[act].bosses[0]

enemyEvents.damaged = (c, e, amount, blockBroken) => ENEMY[e.defId]?.onDamaged?.(e, c, amount, blockBroken)
