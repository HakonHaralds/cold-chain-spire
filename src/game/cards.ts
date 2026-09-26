import {
  addCards,
  addStatus,
  attack,
  charge,
  consumeCharge,
  countBugs,
  drawCards,
  exhaustBugs,
  gainBlock,
  gainCharge,
  heal,
  livingEnemies,
  loseHp,
  randomEnemy,
  st,
} from './core'
import type { CardType, CharId, Combat, Rarity, Target } from './types'

export type CardClass = 'neutral' | CharId | 'special'

export interface CardDef {
  id: string
  name: string
  type: CardType
  rarity: Rarity
  cls: CardClass
  cost: number
  costUp?: number
  icon: string
  target: Target
  text: (up: boolean) => string
  flavor?: string
  exhaust?: (up: boolean) => boolean
  unplayable?: boolean
  ethereal?: boolean
  /** Consumes Charge (used by the sim bot and UI hints). */
  discharge?: boolean
  play?: (c: Combat, target: string | null, up: boolean) => void
}

const u = <T,>(up: boolean, a: T, b: T) => (up ? b : a)

const hit = (c: Combat, t: string | null, n: number, times = 1) => {
  for (let i = 0; i < times; i++) if (t) attack(c, 'player', t, n)
}
const hitAll = (c: Combat, n: number) => {
  for (const e of livingEnemies(c)) attack(c, 'player', e.uid, n)
}
const enemy = (c: Combat, t: string | null) => c.enemies.find((e) => e.uid === t && !e.dead)
const exc = (c: Combat, t: string | null) => {
  const e = enemy(c, t)
  return e ? st(e, 'excursion') : 0
}

const defs: CardDef[] = [
  // =====================================================================
  // Shared basics
  // =====================================================================
  {
    id: 'ping', name: 'Ping', type: 'attack', rarity: 'basic', cls: 'neutral', cost: 1, icon: '📶', target: 'enemy',
    text: (up) => `Deal ${u(up, 6, 9)} damage.`,
    flavor: 'Are you there? Hello?',
    play: (c, t, up) => hit(c, t, u(up, 6, 9)),
  },
  {
    id: 'insulate', name: 'Insulate', type: 'skill', rarity: 'basic', cls: 'neutral', cost: 1, icon: '🧊', target: 'none',
    text: (up) => `Gain ${u(up, 5, 8)} Block.`,
    flavor: 'Keep it between 2 and 8 °C.',
    play: (c, _t, up) => gainBlock(c, 'player', u(up, 5, 8)),
  },

  // =====================================================================
  // Neutral office cards
  // =====================================================================
  {
    id: 'alert', name: 'Real-Time Alert', type: 'attack', rarity: 'common', cls: 'neutral', cost: 2, icon: '🚨', target: 'enemy',
    text: (up) => `Deal ${u(up, 8, 10)} damage. Apply ${u(up, 2, 3)} Vulnerable.`,
    flavor: 'Your shipment is getting warm. Right now.',
    play: (c, t, up) => {
      hit(c, t, u(up, 8, 10))
      if (t) addStatus(c, t, 'vulnerable', u(up, 2, 3))
    },
  },
  {
    id: 'reply_all', name: 'Reply All', type: 'attack', rarity: 'common', cls: 'neutral', cost: 1, icon: '📧', target: 'none',
    text: (up) => `Deal ${u(up, 6, 9)} damage to ALL enemies.`,
    flavor: 'Please remove me from this list.',
    play: (c, _t, up) => hitAll(c, u(up, 6, 9)),
  },
  {
    id: 'standup', name: 'Daily Stand-up', type: 'skill', rarity: 'common', cls: 'neutral', cost: 1, icon: '🧍', target: 'none',
    text: (up) => `Gain ${u(up, 4, 6)} Block. Draw 2 cards.`,
    flavor: 'Yesterday I… today I… no blockers.',
    play: (c, _t, up) => {
      gainBlock(c, 'player', u(up, 4, 6))
      drawCards(c, 2)
    },
  },
  {
    id: 'dashboard', name: 'Dashboard Glance', type: 'skill', rarity: 'common', cls: 'neutral', cost: 0, icon: '📈', target: 'none',
    text: (up) => `Gain ${u(up, 3, 5)} Block. Draw 1 card.`,
    flavor: 'All green. Probably.',
    play: (c, _t, up) => {
      gainBlock(c, 'player', u(up, 3, 5))
      drawCards(c, 1)
    },
  },
  {
    id: 'quick_win', name: 'Quick Win', type: 'attack', rarity: 'common', cls: 'neutral', cost: 0, icon: '✅', target: 'enemy',
    text: (up) => `Deal ${u(up, 3, 5)} damage. Draw 1 card.`,
    flavor: 'Low-hanging fruit, harvested.',
    play: (c, t, up) => {
      hit(c, t, u(up, 3, 5))
      drawCards(c, 1)
    },
  },
  {
    id: 'escalate', name: 'Escalate', type: 'attack', rarity: 'common', cls: 'neutral', cost: 1, costUp: 0, icon: '📞', target: 'enemy',
    text: () => 'Deal damage equal to your Block.',
    flavor: 'I would like to speak to your manager.',
    play: (c, t) => hit(c, t, c.player.block),
  },
  {
    id: 'gdp', name: 'GDP Compliance', type: 'skill', rarity: 'common', cls: 'neutral', cost: 1, icon: '📜', target: 'enemy',
    text: (up) => `Gain ${u(up, 7, 10)} Block. Apply ${u(up, 1, 2)} Weak.`,
    flavor: 'Good Distribution Practice, great distribution defense.',
    play: (c, t, up) => {
      gainBlock(c, 'player', u(up, 7, 10))
      if (t) addStatus(c, t, 'weak', u(up, 1, 2))
    },
  },
  {
    id: 'coffee_break', name: 'Coffee Break', type: 'skill', rarity: 'uncommon', cls: 'neutral', cost: 0, icon: '☕', target: 'none',
    text: (up) => `Gain ${u(up, 2, 3)} Energy. Exhaust.`,
    flavor: 'The fourth one is for focus.',
    exhaust: () => true,
    play: (c, _t, up) => {
      c.energy += u(up, 2, 3)
    },
  },
  {
    id: 'ooo', name: 'Out of Office', type: 'skill', rarity: 'uncommon', cls: 'neutral', cost: 2, icon: '🏝️', target: 'none',
    text: (up) => `Gain ${u(up, 25, 32)} Block. Exhaust.`,
    flavor: 'I am currently out of the office with limited access to email.',
    exhaust: () => true,
    play: (c, _t, up) => gainBlock(c, 'player', u(up, 25, 32)),
  },
  {
    id: 'sprint_planning', name: 'Sprint Planning', type: 'power', rarity: 'uncommon', cls: 'neutral', cost: 1, costUp: 0, icon: '🗂️', target: 'none',
    text: () => 'At the start of your turn, draw 1 additional card.',
    flavor: 'Two weeks. Forty story points. Sure.',
    play: (c) => addStatus(c, 'player', 'sprint', 1),
  },
  {
    id: 'cloud_sync', name: 'Cloud Sync', type: 'skill', rarity: 'uncommon', cls: 'neutral', cost: 1, icon: '☁️', target: 'none',
    text: (up) => `Draw ${u(up, 3, 4)} cards.`,
    flavor: 'Last seen: 2 minutes ago.',
    play: (c, _t, up) => drawCards(c, u(up, 3, 4)),
  },
  {
    id: 'retro', name: 'Retrospective', type: 'skill', rarity: 'uncommon', cls: 'neutral', cost: 1, icon: '🔁', target: 'none',
    text: (up) => `Gain ${u(up, 2, 3)} Block for each card in your discard pile.`,
    flavor: 'What went well? What went… less well?',
    play: (c, _t, up) => gainBlock(c, 'player', c.discard.length * u(up, 2, 3)),
  },
  {
    id: 'kaizen', name: 'Continuous Improvement', type: 'skill', rarity: 'uncommon', cls: 'neutral', cost: 1, icon: '🧗', target: 'none',
    text: (up) => `Upgrade ALL cards in your hand for this combat.${up ? '' : ' Exhaust.'}`,
    flavor: '1% better every day. Today: 100%.',
    exhaust: (up) => !up,
    play: (c) => {
      for (const card of c.hand) if (DEF[card.id]?.type !== 'status' && DEF[card.id]?.type !== 'curse') card.upgraded = true
    },
  },
  {
    id: 'humblebrag', name: 'LinkedIn Humblebrag', type: 'skill', rarity: 'uncommon', cls: 'neutral', cost: 0, icon: '📣', target: 'none',
    text: (up) => `Gain ${u(up, 3, 5)} Strength this turn.`,
    flavor: 'Humbled and honored to announce…',
    play: (c, _t, up) => addStatus(c, 'player', 'tempStrength', u(up, 3, 5)),
  },
  {
    id: 'all_hands', name: 'Town Hall', type: 'attack', rarity: 'rare', cls: 'neutral', cost: 3, icon: '🏛️', target: 'none',
    text: (up) => `Deal ${u(up, 18, 24)} damage to ALL enemies. Apply 2 Weak to ALL enemies.`,
    flavor: 'Mandatory. Cameras on.',
    play: (c, _t, up) => {
      hitAll(c, u(up, 18, 24))
      for (const e of livingEnemies(c)) addStatus(c, e.uid, 'weak', 2)
    },
  },
  {
    id: 'series_d', name: 'Series D Funding', type: 'skill', rarity: 'rare', cls: 'neutral', cost: 1, icon: '💰', target: 'none',
    text: (up) => `Gain ${u(up, 2, 3)} Energy. Draw 3 cards. Exhaust.`,
    flavor: 'Runway extended. Morale extended.',
    exhaust: () => true,
    play: (c, _t, up) => {
      c.energy += u(up, 2, 3)
      drawCards(c, 3)
    },
  },
  {
    id: 'vaccine_rollout', name: 'Global Vaccine Rollout', type: 'power', rarity: 'rare', cls: 'neutral', cost: 3, icon: '💉', target: 'none',
    text: (up) => `Gain ${u(up, 3, 4)} Strength and ${u(up, 3, 4)} Dexterity.`,
    flavor: 'Billions of doses. Every one tracked.',
    play: (c, _t, up) => {
      addStatus(c, 'player', 'strength', u(up, 3, 4))
      addStatus(c, 'player', 'dexterity', u(up, 3, 4))
    },
  },
  {
    id: 'predictive', name: 'Predictive Analytics', type: 'skill', rarity: 'rare', cls: 'neutral', cost: 2, costUp: 1, icon: '🔮', target: 'none',
    text: () => 'Gain Block equal to all incoming attack damage this turn.',
    flavor: 'The model says you will be punched. Duck.',
    play: (c) => gainBlock(c, 'player', incomingDamage(c), true),
  },
  {
    id: 'blue_lagoon', name: 'Blue Lagoon Dip', type: 'skill', rarity: 'rare', cls: 'neutral', cost: 1, icon: '♨️', target: 'none',
    text: (up) => `Heal ${u(up, 8, 12)} HP. Exhaust.`,
    flavor: 'Silica mud mask not included.',
    exhaust: () => true,
    play: (c, _t, up) => heal(c, 'player', u(up, 8, 12)),
  },

  // =====================================================================
  // Firmware Developer — Bugs are a resource
  // =====================================================================
  {
    id: 'printf', name: 'printf Debugging', type: 'attack', rarity: 'basic', cls: 'fw', cost: 1, icon: '🖨️', target: 'enemy',
    text: (up) => `Deal ${u(up, 9, 12)} damage. Add a Bug to your discard pile.`,
    flavor: 'printf("here 3\\n");',
    play: (c, t, up) => {
      hit(c, t, u(up, 9, 12))
      addCards(c, 'bug', 'discard', 1)
    },
  },
  {
    id: 'breakpoint', name: 'Breakpoint', type: 'skill', rarity: 'basic', cls: 'fw', cost: 1, icon: '⏸️', target: 'none',
    text: (up) => `Gain ${u(up, 7, 10)} Block. Exhaust a Bug from your hand or discard pile.`,
    flavor: 'Execution halted. So did your afternoon.',
    play: (c, _t, up) => {
      gainBlock(c, 'player', u(up, 7, 10))
      exhaustBugs(c, ['hand', 'discard'], 1)
    },
  },
  {
    id: 'hotfix', name: 'Hotfix', type: 'attack', rarity: 'common', cls: 'fw', cost: 1, icon: '🩹', target: 'enemy',
    text: (up) => `Deal ${u(up, 13, 17)} damage. Add a Bug to your discard pile.`,
    flavor: 'Tested in production.',
    play: (c, t, up) => {
      hit(c, t, u(up, 13, 17))
      addCards(c, 'bug', 'discard', 1)
    },
  },
  {
    id: 'git_blame', name: 'Git Blame', type: 'attack', rarity: 'common', cls: 'fw', cost: 1, icon: '🔍', target: 'enemy',
    text: (up) => `Deal ${u(up, 8, 10)} damage. If the target is Vulnerable, deal it again.`,
    flavor: 'Oh. It was me.',
    play: (c, t, up) => {
      const e = enemy(c, t)
      const vuln = e ? st(e, 'vulnerable') > 0 : false
      hit(c, t, u(up, 8, 10))
      if (vuln) hit(c, t, u(up, 8, 10))
    },
  },
  {
    id: 'code_review', name: 'Code Review', type: 'attack', rarity: 'common', cls: 'fw', cost: 1, icon: '🧐', target: 'enemy',
    text: (up) => `Deal ${u(up, 6, 8)} damage. Apply ${u(up, 1, 2)} Weak and 1 Vulnerable.`,
    flavor: 'nit: this whole file.',
    play: (c, t, up) => {
      hit(c, t, u(up, 6, 8))
      if (t) {
        addStatus(c, t, 'weak', u(up, 1, 2))
        addStatus(c, t, 'vulnerable', 1)
      }
    },
  },
  {
    id: 'segfault', name: 'Segfault', type: 'attack', rarity: 'common', cls: 'fw', cost: 1, icon: '💥', target: 'enemy',
    text: (up) => `Deal ${u(up, 7, 9)} damage, plus 5 for each Bug in your hand.`,
    flavor: 'Core dumped. Also your weekend.',
    play: (c, t, up) => hit(c, t, u(up, 7, 9) + countBugs(c, ['hand']) * 5),
  },
  {
    id: 'unit_tests', name: 'Unit Tests', type: 'skill', rarity: 'common', cls: 'fw', cost: 1, icon: '🧪', target: 'none',
    text: (up) => `Gain ${u(up, 9, 12)} Block. Exhaust a Bug from your hand or discard pile.`,
    flavor: '100% coverage of the code that never runs.',
    play: (c, _t, up) => {
      gainBlock(c, 'player', u(up, 9, 12))
      exhaustBugs(c, ['hand', 'discard'], 1)
    },
  },
  {
    id: 'heisenbug', name: 'Heisenbug', type: 'attack', rarity: 'common', cls: 'fw', cost: 0, icon: '👻', target: 'enemy',
    text: (up) => `Deal ${u(up, 5, 7)} damage. Shuffle a Bug into your draw pile.`,
    flavor: 'Disappears whenever you attach the debugger.',
    play: (c, t, up) => {
      hit(c, t, u(up, 5, 7))
      addCards(c, 'bug', 'draw', 1)
    },
  },
  {
    id: 'west_build', name: 'west build', type: 'skill', rarity: 'common', cls: 'fw', cost: 1, icon: '🔨', target: 'none',
    text: (up) => `Draw ${u(up, 2, 3)} cards. Add a Bug to your discard pile.`,
    flavor: 'warning: 412 warnings generated.',
    play: (c, _t, up) => {
      drawCards(c, u(up, 2, 3))
      addCards(c, 'bug', 'discard', 1)
    },
  },
  {
    id: 'merge_request', name: 'Merge Request', type: 'attack', rarity: 'common', cls: 'fw', cost: 2, icon: '🔀', target: 'enemy',
    text: (up) => `Deal ${u(up, 11, 14)} damage. Gain ${u(up, 7, 9)} Block.`,
    flavor: 'LGTM 👍',
    play: (c, t, up) => {
      hit(c, t, u(up, 11, 14))
      gainBlock(c, 'player', u(up, 7, 9))
    },
  },
  {
    id: 'firmware_flash', name: 'Firmware Flash', type: 'attack', rarity: 'uncommon', cls: 'fw', cost: 1, icon: '⚡', target: 'enemy',
    text: (up) => `Deal ${u(up, 4, 5)} damage 3 times.`,
    flavor: 'west flash --runner jlink',
    play: (c, t, up) => hit(c, t, u(up, 4, 5), 3),
  },
  {
    id: 'ota', name: 'OTA Update', type: 'power', rarity: 'uncommon', cls: 'fw', cost: 2, costUp: 1, icon: '📡', target: 'none',
    text: () => 'At the start of your turn, gain 1 Strength.',
    flavor: 'Updating 40,000 devices. What could go wrong?',
    play: (c) => addStatus(c, 'player', 'ota', 1),
  },
  {
    id: 'race_condition', name: 'Race Condition', type: 'attack', rarity: 'uncommon', cls: 'fw', cost: 1, icon: '🏎️', target: 'none',
    text: (up) => `Deal ${u(up, 5, 6)} damage to a random enemy 3 times.`,
    flavor: 'Works 99 times out of 100. Ships on the 100th.',
    play: (c, _t, up) => {
      for (let i = 0; i < 3; i++) {
        const e = randomEnemy(c)
        if (e) attack(c, 'player', e.uid, u(up, 5, 6))
      }
    },
  },
  {
    id: 'watchdog', name: 'Watchdog Timer', type: 'power', rarity: 'uncommon', cls: 'fw', cost: 1, icon: '🐕', target: 'none',
    text: (up) => `At the end of your turn, exhaust all Bugs in your hand and gain ${u(up, 4, 6)} Block for each.`,
    flavor: 'Kicked every 500 ms. Still bites.',
    play: (c, _t, up) => addStatus(c, 'player', 'watchdog', u(up, 4, 6)),
  },
  {
    id: 'debug_session', name: 'Debug Session', type: 'skill', rarity: 'uncommon', cls: 'fw', cost: 1, costUp: 0, icon: '🪲', target: 'none',
    text: () => 'Exhaust ALL Bugs in your hand and discard pile. Draw 1 card and gain 3 Block for each (max 4 cards).',
    flavor: 'Found it. It was a missing semicolon. In the linker script.',
    play: (c) => {
      const n = exhaustBugs(c, ['hand', 'discard'])
      gainBlock(c, 'player', 3 * n)
      drawCards(c, Math.min(4, n))
    },
  },
  {
    id: 'kconfig', name: 'Kconfig Tweak', type: 'skill', rarity: 'uncommon', cls: 'fw', cost: 0, icon: '⚙️', target: 'none',
    text: (up) => `Gain 1 Energy. Add a Bug to your ${u(up, 'hand', 'discard pile')}.`,
    flavor: 'CONFIG_EVERYTHING=y',
    play: (c, _t, up) => {
      c.energy += 1
      addCards(c, 'bug', up ? 'discard' : 'hand', 1)
    },
  },
  {
    id: 'stack_overflow', name: 'Stack Overflow', type: 'attack', rarity: 'uncommon', cls: 'fw', cost: 2, icon: '📚', target: 'enemy',
    text: (up) => `Deal ${u(up, 3, 4)} damage for each card in your hand (Bugs count double).`,
    flavor: 'Marked as duplicate.',
    play: (c, t, up) => hit(c, t, (c.hand.length + countBugs(c, ['hand'])) * u(up, 3, 4)),
  },
  {
    id: 'code_freeze', name: 'Code Freeze', type: 'skill', rarity: 'uncommon', cls: 'fw', cost: 2, icon: '🥶', target: 'none',
    text: (up) => `Gain ${u(up, 12, 16)} Block. Exhaust all Bugs in your hand.`,
    flavor: 'Nobody touches anything. Especially not main.',
    play: (c, _t, up) => {
      gainBlock(c, 'player', u(up, 12, 16))
      exhaustBugs(c, ['hand'])
    },
  },
  {
    id: 'pair_programming', name: 'Pair Programming', type: 'skill', rarity: 'uncommon', cls: 'fw', cost: 1, costUp: 0, icon: '👯', target: 'none',
    text: () => 'Your next Attack this turn is played twice.',
    flavor: 'You type, I judge.',
    play: (c) => addStatus(c, 'player', 'doubleTap', 1),
  },
  {
    id: 'tech_debt', name: 'Technical Debt', type: 'attack', rarity: 'rare', cls: 'fw', cost: 1, icon: '💸', target: 'enemy',
    text: (up) => `Deal ${u(up, 20, 26)} damage. Shuffle 2 Bugs into your draw pile.`,
    flavor: 'Future you will handle it.',
    play: (c, t, up) => {
      hit(c, t, u(up, 20, 26))
      addCards(c, 'bug', 'draw', 2)
    },
  },
  {
    id: 'git_rebase', name: 'git rebase -i', type: 'skill', rarity: 'rare', cls: 'fw', cost: 1, icon: '🌳', target: 'none',
    text: (up) => `Exhaust ALL Bugs in your hand, draw and discard piles. Gain ${u(up, 4, 6)} Block for each. Exhaust.`,
    flavor: 'History is written by the ones who force-push.',
    exhaust: () => true,
    play: (c, _t, up) => {
      const n = exhaustBugs(c, ['hand', 'draw', 'discard'])
      gainBlock(c, 'player', n * u(up, 4, 6))
    },
  },
  {
    id: 'memsafe', name: 'Rewrite in Rust', type: 'power', rarity: 'rare', cls: 'fw', cost: 1, icon: '🦀', target: 'none',
    text: (up) => `Whenever you exhaust a Bug, draw 1 card and gain ${u(up, 2, 4)} Block.`,
    flavor: 'The borrow checker has rejected your apology.',
    play: (c, _t, up) => addStatus(c, 'player', 'memsafe', u(up, 2, 4)),
  },
  {
    id: 'ship_it', name: 'Ship It', type: 'attack', rarity: 'rare', cls: 'fw', cost: 2, icon: '🚢', target: 'enemy',
    text: (up) => `Deal ${u(up, 12, 16)} damage, plus 4 for each Bug in your hand, draw and discard piles.`,
    flavor: 'Known issues: yes.',
    play: (c, t, up) => hit(c, t, u(up, 12, 16) + 4 * countBugs(c)),
  },
  {
    id: 'friday_deploy', name: 'Deploy on Friday', type: 'attack', rarity: 'rare', cls: 'fw', cost: 2, icon: '🔥', target: 'enemy',
    text: (up) => `Deal ${u(up, 30, 40)} damage. Lose 5 HP.`,
    flavor: 'See you Monday. Maybe.',
    play: (c, t, up) => {
      hit(c, t, u(up, 30, 40))
      loseHp(c, 'player', 5)
    },
  },

  // =====================================================================
  // Hardware Engineer — build and discharge Charge
  // =====================================================================
  {
    id: 'solder_joint', name: 'Solder Joint', type: 'attack', rarity: 'basic', cls: 'hw', cost: 1, icon: '🔥', target: 'enemy',
    text: (up) => `Deal ${u(up, 7, 9)} damage. Gain ${u(up, 1, 2)} Charge.`,
    flavor: 'Shiny, concave, and only slightly cold.',
    play: (c, t, up) => {
      hit(c, t, u(up, 7, 9))
      gainCharge(c, u(up, 1, 2))
    },
  },
  {
    id: 'discharge', name: 'Discharge', type: 'attack', rarity: 'basic', cls: 'hw', cost: 1, icon: '⚡', target: 'enemy', discharge: true,
    text: (up) => `Consume all Charge. Deal ${u(up, 5, 6)} damage for each Charge consumed.`,
    flavor: 'Always discharge the cap. Always.',
    play: (c, t, up) => hit(c, t, consumeCharge(c) * u(up, 5, 6)),
  },
  {
    id: 'multimeter', name: 'Multimeter Probe', type: 'attack', rarity: 'common', cls: 'hw', cost: 1, icon: '🔌', target: 'enemy',
    text: (up) => `Deal ${u(up, 7, 9)} damage. Gain ${u(up, 1, 2)} Charge.`,
    flavor: 'Beep means good. Silence means very bad.',
    play: (c, t, up) => {
      hit(c, t, u(up, 7, 9))
      gainCharge(c, u(up, 1, 2))
    },
  },
  {
    id: 'ground_plane', name: 'Ground Plane', type: 'skill', rarity: 'common', cls: 'hw', cost: 1, icon: '🟫', target: 'none',
    text: (up) => `Gain ${u(up, 8, 11)} Block. Gain 1 Charge.`,
    flavor: 'Pour copper on it. Pour copper on everything.',
    play: (c, _t, up) => {
      gainBlock(c, 'player', u(up, 8, 11))
      gainCharge(c, 1)
    },
  },
  {
    id: 'buck_converter', name: 'Buck Converter', type: 'skill', rarity: 'common', cls: 'hw', cost: 1, icon: '🔋', target: 'none',
    text: (up) => `Gain ${u(up, 3, 4)} Charge. Draw 1 card.`,
    flavor: '94% efficient. The other 6% is warming your fingers.',
    play: (c, _t, up) => {
      gainCharge(c, u(up, 3, 4))
      drawCards(c, 1)
    },
  },
  {
    id: 'oscilloscope', name: 'Oscilloscope', type: 'skill', rarity: 'common', cls: 'hw', cost: 0, icon: '📉', target: 'none',
    text: (up) => `Draw ${u(up, 1, 2)} card${up ? 's' : ''}. Gain 1 Charge.`,
    flavor: 'The ringing was the probe ground all along.',
    play: (c, _t, up) => {
      drawCards(c, u(up, 1, 2))
      gainCharge(c, 1)
    },
  },
  {
    id: 'short_circuit', name: 'Short Circuit', type: 'attack', rarity: 'common', cls: 'hw', cost: 1, icon: '⚠️', target: 'none',
    text: (up) => `Deal ${u(up, 6, 8)} damage to ALL enemies. Gain 1 Charge.`,
    flavor: 'Found the short. With my nose.',
    play: (c, _t, up) => {
      hitAll(c, u(up, 6, 8))
      gainCharge(c, 1)
    },
  },
  {
    id: 'drop_test', name: 'Drop Test', type: 'attack', rarity: 'common', cls: 'hw', cost: 2, icon: '🪂', target: 'enemy',
    text: (up) => `Deal ${u(up, 16, 21)} damage. Apply 1 Weak.`,
    flavor: '1.2 metres onto concrete. 26 times. For science.',
    play: (c, t, up) => {
      hit(c, t, u(up, 16, 21))
      if (t) addStatus(c, t, 'weak', 1)
    },
  },
  {
    id: 'conformal', name: 'Conformal Coating', type: 'skill', rarity: 'common', cls: 'hw', cost: 1, icon: '🫧', target: 'none',
    text: (up) => `Gain ${u(up, 5, 7)} Block, plus 2 for each Charge.`,
    flavor: 'Waterproof. Probe-proof. Rework-proof.',
    play: (c, _t, up) => gainBlock(c, 'player', u(up, 5, 7) + 2 * charge(c)),
  },
  {
    id: 'cold_storage', name: 'Cold Storage', type: 'skill', rarity: 'common', cls: 'hw', cost: 2, icon: '🏭', target: 'none',
    text: (up) => `Gain ${u(up, 14, 19)} Block.`,
    flavor: 'Minus twenty. Bring a jacket.',
    play: (c, _t, up) => gainBlock(c, 'player', u(up, 14, 19)),
  },
  {
    id: 'recharge', name: 'Recharge', type: 'skill', rarity: 'common', cls: 'hw', cost: 0, icon: '🔌', target: 'none',
    text: (up) => `Gain ${u(up, 1, 2)} Energy. Gain 1 Charge. Exhaust.`,
    flavor: 'Battery life: 3 years. You: 3 hours.',
    exhaust: () => true,
    play: (c, _t, up) => {
      c.energy += u(up, 1, 2)
      gainCharge(c, 1)
    },
  },
  {
    id: 'faraday', name: 'Faraday Cage', type: 'skill', rarity: 'uncommon', cls: 'hw', cost: 1, icon: '🥅', target: 'none', discharge: true,
    text: (up) => `Consume all Charge. Gain ${u(up, 6, 9)} Block, plus 5 for each Charge consumed.`,
    flavor: 'No signal gets in. Including Teams notifications.',
    play: (c, _t, up) => gainBlock(c, 'player', u(up, 6, 9) + 5 * consumeCharge(c)),
  },
  {
    id: 'magic_smoke', name: 'Magic Smoke', type: 'attack', rarity: 'uncommon', cls: 'hw', cost: 1, icon: '💨', target: 'none', discharge: true,
    text: (up) => `Consume all Charge. Deal ${u(up, 4, 5)} damage to ALL enemies for each Charge consumed.`,
    flavor: 'Electronics run on smoke. Once it escapes, they stop.',
    play: (c, _t, up) => hitAll(c, consumeCharge(c) * u(up, 4, 5)),
  },
  {
    id: 'hot_air', name: 'Hot-Air Rework', type: 'attack', rarity: 'uncommon', cls: 'hw', cost: 1, icon: '🌬️', target: 'enemy',
    text: (up) => `Deal ${u(up, 4, 5)} damage twice. Gain 2 Charge.`,
    flavor: '400 °C, 45 seconds, and a small prayer for the neighbouring caps.',
    play: (c, t, up) => {
      hit(c, t, u(up, 4, 5), 2)
      gainCharge(c, 2)
    },
  },
  {
    id: 'emc_test', name: 'EMC Test', type: 'skill', rarity: 'uncommon', cls: 'hw', cost: 1, icon: '📻', target: 'none',
    text: (up) => `Apply ${u(up, 2, 3)} Weak to ALL enemies. Gain 1 Charge.`,
    flavor: 'Failed at 868 MHz. Of course it did.',
    play: (c, _t, up) => {
      for (const e of livingEnemies(c)) addStatus(c, e.uid, 'weak', u(up, 2, 3))
      gainCharge(c, 1)
    },
  },
  {
    id: 'capacitor_bank', name: 'Capacitor Bank', type: 'power', rarity: 'uncommon', cls: 'hw', cost: 1, icon: '🔋', target: 'none',
    text: (up) => `At the start of your turn, gain ${u(up, 2, 3)} Charge.`,
    flavor: '10,000 µF of pure confidence.',
    play: (c, _t, up) => addStatus(c, 'player', 'capbank', u(up, 2, 3)),
  },
  {
    id: 'antenna', name: 'Antenna Tuning', type: 'skill', rarity: 'uncommon', cls: 'hw', cost: 1, costUp: 0, icon: '📶', target: 'none',
    text: () => 'Double your Charge.',
    flavor: 'Moved it 2 mm. RSSI up 6 dB. Nobody knows why.',
    play: (c) => gainCharge(c, charge(c)),
  },
  {
    id: 'pcb_respin', name: 'PCB Respin', type: 'skill', rarity: 'uncommon', cls: 'hw', cost: 1, icon: '♻️', target: 'none',
    text: (up) => `Discard your hand. Draw that many cards${up ? ' +1' : ''}. Gain 1 Charge for each card discarded.`,
    flavor: 'Rev C. Definitely the last one. (Rev F incoming.)',
    play: (c, _t, up) => {
      const n = c.hand.length
      c.discard.push(...c.hand)
      c.hand = []
      drawCards(c, n + (up ? 1 : 0))
      gainCharge(c, n)
    },
  },
  {
    id: 'thermal_pad', name: 'Thermal Pad', type: 'power', rarity: 'uncommon', cls: 'hw', cost: 1, costUp: 0, icon: '🟦', target: 'none',
    text: () => 'At the end of your turn, gain Block equal to your Charge.',
    flavor: 'Squishy, blue, and surprisingly protective.',
    play: (c) => addStatus(c, 'player', 'thermalpad', 1),
  },
  {
    id: 'double_insulation', name: 'Double Insulation', type: 'skill', rarity: 'uncommon', cls: 'hw', cost: 1, costUp: 0, icon: '🧥', target: 'none',
    text: () => 'Double your Block.',
    flavor: 'Class II appliance. Class I attitude.',
    play: (c) => gainBlock(c, 'player', c.player.block, true),
  },
  {
    id: 'hv_arc', name: 'High-Voltage Arc', type: 'attack', rarity: 'rare', cls: 'hw', cost: 2, icon: '🌩️', target: 'enemy', discharge: true,
    text: (up) => `Consume all Charge. Deal ${u(up, 8, 10)} damage for each Charge consumed.`,
    flavor: 'Creepage distance: insufficient.',
    play: (c, t, up) => hit(c, t, consumeCharge(c) * u(up, 8, 10)),
  },
  {
    id: 'tesla', name: 'Tesla Coil', type: 'power', rarity: 'rare', cls: 'hw', cost: 2, costUp: 1, icon: '🗼', target: 'none',
    text: () => 'At the end of your turn, deal damage equal to your Charge to ALL enemies.',
    flavor: 'Technically also a lamp.',
    play: (c) => addStatus(c, 'player', 'tesla', 1),
  },
  {
    id: 'supercap', name: 'Supercapacitor', type: 'skill', rarity: 'rare', cls: 'hw', cost: 1, icon: '🔆', target: 'none',
    text: (up) => `Gain ${u(up, 6, 9)} Charge. Exhaust.`,
    flavor: 'One farad. Handle with oven mitts.',
    exhaust: () => true,
    play: (c, _t, up) => gainCharge(c, u(up, 6, 9)),
  },
  {
    id: 'overvoltage', name: 'Overvoltage', type: 'skill', rarity: 'rare', cls: 'hw', cost: 0, icon: '📈', target: 'none',
    text: (up) => `Gain 1 Strength for every ${u(up, 3, 2)} Charge you have. Exhaust.`,
    flavor: 'The TVS diode has left the chat.',
    exhaust: () => true,
    play: (c, _t, up) => addStatus(c, 'player', 'strength', Math.floor(charge(c) / u(up, 3, 2))),
  },

  // =====================================================================
  // Calibration Specialist — Excursion and its payoffs
  // =====================================================================
  {
    id: 'thermocouple_jab', name: 'Thermocouple Jab', type: 'attack', rarity: 'basic', cls: 'cal', cost: 1, icon: '🌡️', target: 'enemy',
    text: (up) => `Deal ${u(up, 4, 6)} damage. Apply ${u(up, 2, 3)} Excursion.`,
    flavor: 'Type K. For "Kindly hold still".',
    play: (c, t, up) => {
      hit(c, t, u(up, 4, 6))
      if (t) addStatus(c, t, 'excursion', u(up, 2, 3))
    },
  },
  {
    id: 'ice_bath', name: 'Ice Bath', type: 'skill', rarity: 'basic', cls: 'cal', cost: 1, icon: '🧊', target: 'enemy',
    text: (up) => `Gain ${u(up, 5, 7)} Block. Apply ${u(up, 1, 2)} Excursion.`,
    flavor: '0.00 °C. Crushed, not cubed. Obviously.',
    play: (c, t, up) => {
      gainBlock(c, 'player', u(up, 5, 7))
      if (t) addStatus(c, t, 'excursion', u(up, 1, 2))
    },
  },
  {
    id: 'excursion_report', name: 'Excursion Report', type: 'skill', rarity: 'common', cls: 'cal', cost: 1, icon: '📋', target: 'enemy',
    text: (up) => `Apply ${u(up, 5, 7)} Excursion.`,
    flavor: 'Peak: 31.4 °C. Duration: all weekend.',
    play: (c, t, up) => t && addStatus(c, t, 'excursion', u(up, 5, 7)),
  },
  {
    id: 'reference_probe', name: 'Reference Probe', type: 'attack', rarity: 'common', cls: 'cal', cost: 1, icon: '🎯', target: 'enemy',
    text: (up) => `Deal ${u(up, 6, 8)} damage. If the target has Excursion, deal ${u(up, 4, 6)} more.`,
    flavor: 'Traceable to a national standard. And to your ribs.',
    play: (c, t, up) => hit(c, t, u(up, 6, 8) + (exc(c, t) > 0 ? u(up, 4, 6) : 0)),
  },
  {
    id: 'dry_block', name: 'Dry-Block Calibrator', type: 'skill', rarity: 'common', cls: 'cal', cost: 1, icon: '🔲', target: 'none',
    text: (up) => `Apply ${u(up, 2, 3)} Excursion to ALL enemies.`,
    flavor: 'Set to 40 °C. Pointed at everyone.',
    play: (c, _t, up) => {
      for (const e of livingEnemies(c)) addStatus(c, e.uid, 'excursion', u(up, 2, 3))
    },
  },
  {
    id: 'tolerance_check', name: 'Tolerance Check', type: 'skill', rarity: 'common', cls: 'cal', cost: 1, icon: '📏', target: 'enemy',
    text: (up) => `Gain ${u(up, 7, 10)} Block. If the target has Excursion, draw 1 card.`,
    flavor: '±0.5 °C. You are ±4.',
    play: (c, t, up) => {
      gainBlock(c, 'player', u(up, 7, 10))
      if (exc(c, t) > 0) drawCards(c, 1)
    },
  },
  {
    id: 'drift_correction', name: 'Drift Correction', type: 'attack', rarity: 'common', cls: 'cal', cost: 0, icon: '🧭', target: 'enemy',
    text: (up) => `Deal ${u(up, 3, 4)} damage. Apply ${u(up, 2, 3)} Excursion.`,
    flavor: 'Offset: −0.3. Attitude: +3.',
    play: (c, t, up) => {
      hit(c, t, u(up, 3, 4))
      if (t) addStatus(c, t, 'excursion', u(up, 2, 3))
    },
  },
  {
    id: 'stabilization', name: 'Stabilization Period', type: 'skill', rarity: 'common', cls: 'cal', cost: 1, icon: '⏳', target: 'none',
    text: (up) => `Gain ${u(up, 5, 7)} Block, plus 3 for each enemy with Excursion.`,
    flavor: 'Wait 30 minutes. Do not touch. Do not breathe.',
    play: (c, _t, up) => gainBlock(c, 'player', u(up, 5, 7) + 3 * livingEnemies(c).filter((e) => st(e, 'excursion') > 0).length),
  },
  {
    id: 'two_point', name: 'Two-Point Calibration', type: 'attack', rarity: 'common', cls: 'cal', cost: 1, icon: '✌️', target: 'enemy',
    text: (up) => `Twice: deal ${u(up, 4, 6)} damage and apply 1 Excursion.`,
    flavor: 'Zero and span. Left and right.',
    play: (c, t, up) => {
      for (let i = 0; i < 2; i++) {
        hit(c, t, u(up, 4, 6))
        if (t) addStatus(c, t, 'excursion', 1)
      }
    },
  },
  {
    id: 'rca', name: 'Root Cause Analysis', type: 'skill', rarity: 'common', cls: 'cal', cost: 1, icon: '🦴', target: 'enemy',
    text: (up) => `Apply ${u(up, 2, 3)} Weak and ${u(up, 2, 3)} Vulnerable.`,
    flavor: 'Five whys. The fifth was "Friday".',
    play: (c, t, up) => {
      if (!t) return
      addStatus(c, t, 'weak', u(up, 2, 3))
      addStatus(c, t, 'vulnerable', u(up, 2, 3))
    },
  },
  {
    id: 'pivot_table', name: 'Pivot Table', type: 'skill', rarity: 'uncommon', cls: 'cal', cost: 1, icon: '🧮', target: 'enemy',
    text: (up) => `${up ? 'Triple' : 'Double'} the target's Excursion. Exhaust.`,
    flavor: 'Excel was the real cold chain all along.',
    exhaust: () => true,
    play: (c, t, up) => {
      const e = enemy(c, t)
      if (e) addStatus(c, e.uid, 'excursion', st(e, 'excursion') * u(up, 1, 2))
    },
  },
  {
    id: 'saga_fleet', name: 'Deploy Saga Fleet', type: 'power', rarity: 'uncommon', cls: 'cal', cost: 2, icon: '🛰️', target: 'none',
    text: (up) => `At the start of your turn, apply ${u(up, 1, 2)} Excursion to ALL enemies.`,
    flavor: 'Real-time visibility. For everyone. Forever.',
    play: (c, _t, up) => addStatus(c, 'player', 'fleet', u(up, 1, 2)),
  },
  {
    id: 'whistleblower', name: 'Whistleblower', type: 'attack', rarity: 'uncommon', cls: 'cal', cost: 1, icon: '📢', target: 'enemy',
    text: (up) => `Deal ${u(up, 9, 12)} damage. Apply ${u(up, 3, 4)} Excursion.`,
    flavor: 'The logger saw everything.',
    play: (c, t, up) => {
      hit(c, t, u(up, 9, 12))
      if (t) addStatus(c, t, 'excursion', u(up, 3, 4))
    },
  },
  {
    id: 'mapping_study', name: 'Mapping Study', type: 'skill', rarity: 'uncommon', cls: 'cal', cost: 2, icon: '🗺️', target: 'enemy',
    text: (up) => `The target loses HP equal to its Excursion${up ? ' twice' : ''}. Excursion is not reduced.`,
    flavor: '48 probes, 72 hours, one very warm corner.',
    play: (c, t, up) => {
      for (let i = 0; i < u(up, 1, 2); i++) {
        const n = exc(c, t)
        if (t && n > 0) loseHp(c, t, n)
      }
    },
  },
  {
    id: 'liquid_n2', name: 'Liquid Nitrogen', type: 'attack', rarity: 'uncommon', cls: 'cal', cost: 2, icon: '🫙', target: 'enemy',
    text: (up) => `Deal ${u(up, 10, 13)} damage. Apply 2 Vulnerable and ${u(up, 3, 4)} Excursion.`,
    flavor: '−196 °C. Excursion in the other direction.',
    play: (c, t, up) => {
      hit(c, t, u(up, 10, 13))
      if (t) {
        addStatus(c, t, 'vulnerable', 2)
        addStatus(c, t, 'excursion', u(up, 3, 4))
      }
    },
  },
  {
    id: 'traceable_cert', name: 'Traceable Certificate', type: 'power', rarity: 'uncommon', cls: 'cal', cost: 1, icon: '📑', target: 'none',
    text: (up) => `At the start of your turn, gain Block equal to ${up ? 'the' : 'half the'} total Excursion on ALL enemies (max 15).`,
    flavor: 'Signed, stamped, laminated.',
    play: (c, _t, up) => addStatus(c, 'player', 'certificate', u(up, 1, 2)),
  },
  {
    id: 'iso17025', name: 'ISO 17025 Audit', type: 'skill', rarity: 'uncommon', cls: 'cal', cost: 1, icon: '🏅', target: 'none',
    text: (up) => `Apply ${u(up, 1, 2)} Weak and ${u(up, 1, 2)} Vulnerable to ALL enemies with Excursion.`,
    flavor: 'Your uncertainty budget is… uncertain.',
    play: (c, _t, up) => {
      for (const e of livingEnemies(c)) {
        if (st(e, 'excursion') <= 0) continue
        addStatus(c, e.uid, 'weak', u(up, 1, 2))
        addStatus(c, e.uid, 'vulnerable', u(up, 1, 2))
      }
    },
  },
  {
    id: 'thermal_shock', name: 'Thermal Shock', type: 'attack', rarity: 'uncommon', cls: 'cal', cost: 2, costUp: 1, icon: '🌋', target: 'enemy',
    text: () => `Deal damage equal to twice the target's Excursion.`,
    flavor: 'Oven to freezer in 0.4 seconds.',
    play: (c, t) => hit(c, t, exc(c, t) * 2),
  },
  {
    id: 'zero_excursions', name: 'Zero Excursions', type: 'power', rarity: 'uncommon', cls: 'cal', cost: 1, icon: '🛡️', target: 'none',
    text: (up) => `At the end of your turn, gain ${u(up, 3, 4)} Block.`,
    flavor: 'The KPI we put on the slide.',
    play: (c, _t, up) => addStatus(c, 'player', 'metallicize', u(up, 3, 4)),
  },
  {
    id: 'deep_freeze', name: 'Deep Freeze', type: 'skill', rarity: 'rare', cls: 'cal', cost: 2, icon: '❄️', target: 'none',
    text: (up) => `Apply ${u(up, 6, 8)} Excursion to ALL enemies.`,
    flavor: 'Somebody left the ULT freezer open. On purpose.',
    play: (c, _t, up) => {
      for (const e of livingEnemies(c)) addStatus(c, e.uid, 'excursion', u(up, 6, 8))
    },
  },
  {
    id: 'cascade', name: 'Cascade Failure', type: 'skill', rarity: 'rare', cls: 'cal', cost: 2, costUp: 1, icon: '🌊', target: 'none',
    text: () => 'Double the Excursion on ALL enemies. Exhaust.',
    flavor: 'One warm pallet. Then the whole truck.',
    exhaust: () => true,
    play: (c) => {
      for (const e of livingEnemies(c)) addStatus(c, e.uid, 'excursion', st(e, 'excursion'))
    },
  },
  {
    id: 'hysteresis', name: 'Hysteresis', type: 'power', rarity: 'rare', cls: 'cal', cost: 3, costUp: 2, icon: '➰', target: 'none',
    text: () => 'Excursion on enemies no longer decreases.',
    flavor: 'It remembers every degree. It forgives none.',
    play: (c) => addStatus(c, 'player', 'hysteresis', 1),
  },
  {
    id: 'primary_standard', name: 'Primary Standard', type: 'attack', rarity: 'rare', cls: 'cal', cost: 1, icon: '⚖️', target: 'none',
    text: (up) => `Deal 6 damage to ALL enemies. Enemies with Excursion take ${u(up, 6, 9)} more.`,
    flavor: 'The triple point of water does not negotiate.',
    play: (c, _t, up) => {
      for (const e of livingEnemies(c)) attack(c, 'player', e.uid, 6 + (st(e, 'excursion') > 0 ? u(up, 6, 9) : 0))
    },
  },
  {
    id: 'audit_trail', name: 'Audit Trail', type: 'power', rarity: 'rare', cls: 'cal', cost: 1, icon: '🧾', target: 'none',
    text: (up) => `Whenever you gain Block, deal ${u(up, 3, 5)} damage to a random enemy.`,
    flavor: '21 CFR Part 11 compliant revenge.',
    play: (c, _t, up) => addStatus(c, 'player', 'auditTrail', u(up, 3, 5)),
  },

  // =====================================================================
  // Status & curses
  // =====================================================================
  {
    id: 'bug', name: 'Bug', type: 'status', rarity: 'special', cls: 'special', cost: -1, icon: '🐛', target: 'none', unplayable: true,
    text: () => 'Unplayable. Works on my machine.',
  },
  {
    id: 'meeting', name: 'Meeting Invite', type: 'status', rarity: 'special', cls: 'special', cost: -1, icon: '📅', target: 'none', unplayable: true, ethereal: true,
    text: () => 'Unplayable. Ethereal. At end of turn, lose 2 HP. (This could have been an email.)',
  },
  {
    id: 'deviation', name: 'Deviation Report', type: 'status', rarity: 'special', cls: 'special', cost: 1, icon: '📝', target: 'none',
    text: () => 'Fill it out. Exhaust.',
    exhaust: () => true,
    play: () => {},
  },
  {
    id: 'hangover', name: 'Hangover', type: 'status', rarity: 'special', cls: 'special', cost: -1, icon: '🥴', target: 'none', unplayable: true, ethereal: true,
    text: () => 'Unplayable. Ethereal. When drawn, lose 1 Energy.',
  },
  {
    id: 'pip', name: 'Performance Improvement Plan', type: 'curse', rarity: 'special', cls: 'special', cost: -1, icon: '📉', target: 'none', unplayable: true,
    text: () => 'Unplayable. At end of turn, lose 3 HP.',
  },
  {
    id: 'sugar_crash', name: 'Sugar Crash', type: 'curse', rarity: 'special', cls: 'special', cost: -1, icon: '🍰', target: 'none', unplayable: true,
    text: () => 'Unplayable. That third slice was a mistake.',
  },
  {
    id: 'malware', name: 'Malware', type: 'curse', rarity: 'special', cls: 'special', cost: -1, icon: '💾', target: 'none', unplayable: true,
    text: () => 'Unplayable. At end of turn, lose 1 HP.',
  },
]

export const DEF: Record<string, CardDef> = Object.fromEntries(defs.map((d) => [d.id, d]))
export const ALL_CARDS = defs

export const cardCost = (id: string, up: boolean, rewrite = false) => {
  const d = DEF[id]
  const base = up && d.costUp !== undefined ? d.costUp : d.cost
  return rewrite && base > 0 ? base - 1 : base
}

/** Branching upgrade (M8): a Rewrite costs 1 less but shuffles a Bug into your draw pile. Only for playable cards that still cost something. */
export const canRewrite = (id: string) => {
  const d = DEF[id]
  if (!d || d.unplayable || d.type === 'status' || d.type === 'curse') return false
  return cardCost(id, true) > 0
}

const REWARDABLE: Rarity[] = ['common', 'uncommon', 'rare']

/** Every card that can appear as a reward for anyone (all classes + neutral). */
export const REWARD_POOL = defs.filter((d) => REWARDABLE.includes(d.rarity))

/** Reward cards for a character: its class pool plus neutral office cards. */
export function poolFor(cls: CharId): CardDef[] {
  return REWARD_POOL.filter((d) => d.cls === cls || d.cls === 'neutral')
}

export function rollCardRewards(n: number, elite = false, cls: CharId = 'fw'): string[] {
  const out: string[] = []
  let guard = 0
  while (out.length < n && guard++ < 200) {
    const r = Math.random()
    const rarity: Rarity = r < (elite ? 0.12 : 0.05) ? 'rare' : r < (elite ? 0.5 : 0.38) ? 'uncommon' : 'common'
    const want: CardClass = Math.random() < 0.75 ? cls : 'neutral'
    let pool = REWARD_POOL.filter((d) => d.rarity === rarity && d.cls === want && !out.includes(d.id))
    if (!pool.length) pool = poolFor(cls).filter((d) => !out.includes(d.id))
    out.push(pool[Math.floor(Math.random() * pool.length)].id)
  }
  return out
}

/** Glossary for card tooltips; keys match the capitalized word used in card text. */
export const KEYWORDS: Record<string, string> = {
  Block: 'Prevents damage. Removed at the start of your next turn.',
  Vulnerable: 'Takes 50% more damage from attacks.',
  Weak: 'Deals 25% less damage with attacks.',
  Frail: 'Gains 25% less Block from cards.',
  Excursion: 'Loses HP equal to Excursion at the start of its turn, then Excursion goes down by 1.',
  Strength: 'Adds damage to every hit of your attacks.',
  Dexterity: 'Adds Block to every card that grants Block.',
  Energy: 'Spent to play cards. Refills each turn.',
  Exhaust: 'Removed from play until the end of combat.',
  Ethereal: 'If it is still in your hand at end of turn, it is Exhausted.',
  Unplayable: 'Cannot be played.',
  Bug: 'An Unplayable status card that clogs your hand. Firmware cards exhaust Bugs for rewards.',
  Charge: 'Stored energy that persists between turns. Discharge cards consume it.',
  Consume: 'Removes all of your Charge to power the effect.',
  Upgrade: 'Improves a card. Upgraded cards show a + after their name.',
}

export function keywordsIn(text: string): string[] {
  return Object.keys(KEYWORDS).filter((k) => new RegExp(`\\b${k}s?\\b`).test(text))
}

/** Filled in by the enemy module to avoid a circular import. */
export let incomingDamage: (c: Combat) => number = () => 0
export const setIncomingDamage = (fn: (c: Combat) => number) => {
  incomingDamage = fn
}
