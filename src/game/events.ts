import { DEF, poolFor } from './cards'
import { mkCard, pick } from './core'
import { COMMON_RELICS, RELIC } from './relics'
import { tokensText } from './tokens'
import type { Run } from './types'

export interface EventOption {
  label: string
  detail: string
  enabled?: (run: Run) => boolean
  apply: (run: Run) => { run: Run; text: string }
}

export interface GameEvent {
  id: string
  title: string
  icon: string
  body: string
  options: EventOption[]
  /** Only appears when the current act's setting id is listed (see map.ts SETTINGS). Omit for "anywhere". */
  settings?: string[]
}

// ---------- helpers (they also keep run stats up to date for OKRs and achievements) ----------

const JUNK = ['bug', 'pip', 'sugar_crash', 'malware', 'meeting', 'hangover', 'deviation']

const hurt = (r: Run, n: number): Run => ({ ...r, hp: Math.max(1, r.hp - n) })
const healR = (r: Run, n: number): Run => ({ ...r, hp: Math.min(r.maxHp, r.hp + n) })
const maxHp = (r: Run, n: number): Run => ({ ...r, maxHp: r.maxHp + n, hp: r.hp + n })
const earn = (r: Run, n: number): Run => ({ ...r, gold: r.gold + n, stats: { ...r.stats, tokensEarned: r.stats.tokensEarned + n } })
const spend = (r: Run, n: number): Run => ({ ...r, gold: Math.max(0, r.gold - n), stats: { ...r.stats, tokensSpent: r.stats.tokensSpent + Math.min(n, r.gold) } })
const addCard = (r: Run, id: string): Run => ({ ...r, deck: [...r.deck, mkCard(id)], stats: JUNK.includes(id) ? r.stats : { ...r.stats, cardsAdded: r.stats.cardsAdded + 1 } })

const upgradeRandom = (run: Run, n = 1): Run => {
  let r = run
  for (let i = 0; i < n; i++) {
    const cands = r.deck.filter((c) => !c.upgraded && !JUNK.includes(c.id) && !['status', 'curse'].includes(DEF[c.id]?.type))
    if (!cands.length) break
    const target = pick(cands)
    r = { ...r, deck: r.deck.map((c) => (c.uid === target.uid ? { ...c, upgraded: true } : c)) }
  }
  return r
}

const rare = (r: Run) => pick(poolFor(r.character).filter((d) => d.rarity === 'rare')).id
const uncommon = (r: Run) => pick(poolFor(r.character).filter((d) => d.rarity === 'uncommon')).id

/** A random relic you don't own (with pickup effects); falls back to tokens if you own them all. */
function randomRelic(r: Run): { run: Run; name: string } {
  const options = COMMON_RELICS.filter((id) => !r.relics.includes(id))
  if (!options.length) return { run: earn(r, 100000), name: tokensText(100000) }
  const id = pick(options)
  let out: Run = { ...r, relics: [...r.relics, id], stats: { ...r.stats, relicsGained: r.stats.relicsGained + 1 } }
  if (id === 'lanyard') out = maxHp(out, 10)
  if (id === 'kanelsnudur') out = healR(out, 20)
  return { run: out, name: RELIC[id].name }
}

/** Remove the first curse or status card from the deck. */
function cleanse(r: Run): { run: Run; removed: string | null } {
  const bad = r.deck.find((c) => JUNK.includes(c.id))
  if (!bad) return { run: r, removed: null }
  return { run: { ...r, deck: r.deck.filter((c) => c.uid !== bad.uid), stats: { ...r.stats, removals: r.stats.removals + 1 } }, removed: DEF[bad.id].name }
}

function transformRandom(r: Run): { run: Run; to: string | null } {
  const cands = r.deck.filter((c) => !JUNK.includes(c.id))
  if (!cands.length) return { run: r, to: null }
  const t = pick(cands)
  const n = pick(poolFor(r.character)).id
  return { run: { ...r, deck: r.deck.map((c) => (c.uid === t.uid ? mkCard(n) : c)) }, to: DEF[n].name }
}

const coin = () => Math.random() < 0.5

export const EVENTS: GameEvent[] = [
  // ================= Anywhere =================
  {
    id: 'slack',
    title: 'The @channel Ping',
    icon: '💬',
    body: 'Somebody just @channel\'d the entire company to ask whether the fridge on floor 3 is "running". 412 people are typing…',
    options: [
      { label: 'Reply thoughtfully', detail: 'Lose 6 HP. Upgrade a random card.', apply: (r) => ({ run: upgradeRandom(hurt(r, 6)), text: 'Your reply gets 3 👀 reactions and one "+1". You learned something, though.' }) },
      { label: 'React with 🎉', detail: `Gain ${tokensText(25000)}.`, apply: (r) => ({ run: earn(r, 25000), text: 'Somehow your emoji gets you nominated for Employee of the Month. It comes with a gift card.' }) },
      { label: 'Mute the channel', detail: 'Heal 8 HP.', apply: (r) => ({ run: healR(r, 8), text: 'Silence. Beautiful, productive silence. Your blood pressure thanks you.' }) },
    ],
  },
  {
    id: 'cake',
    title: 'Free Cake in the Kitchen',
    icon: '🎂',
    body: 'Someone had a birthday. Or a baby. Or quit. Nobody knows, but there is cake, and it is going fast.',
    options: [
      { label: 'Have a slice', detail: 'Heal 15 HP.', apply: (r) => ({ run: healR(r, 15), text: 'Carrot cake. Surprisingly excellent.' }) },
      { label: 'Take three slices', detail: 'Heal 30 HP. Add a Sugar Crash curse to your deck.', apply: (r) => ({ run: addCard(healR(r, 30), 'sugar_crash'), text: 'Worth it. Probably. Your pancreas files a deviation report.' }) },
      { label: 'Bring it to QA', detail: 'Upgrade a random card.', apply: (r) => ({ run: upgradeRandom(r), text: 'Cake: the only bribe QA accepts. Your change request is approved in record time.' }) },
    ],
  },
  {
    id: 'usb',
    title: 'A Mysterious USB Stick',
    icon: '💾',
    body: 'In the parking lot you find a USB stick labeled "SENSITECH — Q4 PRICING — CONFIDENTIAL". It is warm. Very warm.',
    options: [
      { label: 'Plug it in', detail: '50%: gain a Rare card. 50%: gain Malware.', apply: (r) => (coin() ? { run: addCard(r, rare(r)), text: 'Jackpot. Their entire playbook. You learn a new trick.' } : { run: addCard(r, 'malware'), text: 'Your screen fills with pop-ups for 2009-era datalogger software. Uh oh.' }) },
      { label: 'Hand it to IT Security', detail: `Gain ${tokensText(40000)} (bug bounty).`, apply: (r) => ({ run: earn(r, 40000), text: 'IT gives you a sticker, a lecture and a bounty.' }) },
    ],
  },
  {
    id: 'hackathon',
    title: 'The Hackathon',
    icon: '🧑‍💻',
    body: '24 hours. Unlimited pizza. The theme is "AI for the cold chain", which nobody can define.',
    options: [
      { label: 'Pull an all-nighter', detail: 'Lose 10 HP. Gain a random Rare card.', apply: (r) => ({ run: addCard(hurt(r, 10), rare(r)), text: 'You win "Most Likely to Be Put Into Production Without Review". A dubious but powerful honor.' }) },
      { label: 'Just eat the pizza', detail: 'Heal 10 HP.', apply: (r) => ({ run: healR(r, 10), text: 'Pepperoni. Pineapple. Both on one slice. No regrets.' }) },
    ],
  },
  {
    id: 'lagoon',
    title: 'Company Offsite in Iceland',
    icon: '🌋',
    body: 'The bus stops between a steaming lagoon and a volcano trail. The guide says the weather will change in five minutes. It always does.',
    options: [
      { label: 'Soak in the lagoon', detail: `Lose ${tokensText(50000)}. Heal to full.`, enabled: (r) => r.gold >= 50000, apply: (r) => ({ run: { ...spend(r, 50000), hp: r.maxHp }, text: 'Silica mud mask. Zero stress. Mild sulfur smell.' }) },
      { label: 'Hike the volcano', detail: 'Lose 8 HP. Raise Max HP by 6.', apply: (r) => ({ run: maxHp(hurt(r, 8), 6), text: 'Horizontal rain. Glorious views. You feel sturdier.' }) },
      { label: 'Draft slides on the bus', detail: `Gain ${tokensText(35000)}.`, apply: (r) => ({ run: earn(r, 35000), text: 'Your offsite recap deck impresses leadership. Spot bonus! The bus smells of dried fish.' }) },
    ],
  },
  {
    id: 'coldroom',
    title: 'Locked in the Cold Room',
    icon: '🥶',
    body: 'The door clicked shut behind you. It is −20 °C. While waiting for rescue, you have time to reflect on your habits.',
    options: [
      { label: 'Reflect deeply', detail: 'Lose 6 HP. Remove a card from your deck.', enabled: (r) => r.deck.length > 5, apply: (r) => ({ run: hurt(r, 6), text: 'REMOVE' }) },
      { label: 'Do jumping jacks', detail: 'Raise Max HP by 2.', apply: (r) => ({ run: maxHp(r, 2), text: 'Cardio at −20 °C. Facilities lets you out after 20 minutes, logged as an excursion but noticeably fitter.' }) },
    ],
  },
  {
    id: 'reorg',
    title: 'The Reorg',
    icon: '🔀',
    body: 'A new org chart is announced. You now report to someone who reports to you. Your old team has become a "tribe".',
    options: [
      {
        label: 'Embrace the change',
        detail: 'Transform a random card into a random card.',
        apply: (r) => {
          const t = transformRandom(r)
          return { run: t.run, text: t.to ? `Your role has been reimagined. You now do "${t.to}", allegedly.` : 'Nothing changes. Truly a reorg.' }
        },
      },
      { label: 'Update your LinkedIn', detail: `Gain ${tokensText(20000)}.`, apply: (r) => ({ run: earn(r, 20000), text: 'Three recruiters message you within the hour. One offers a referral bonus.' }) },
    ],
  },
  {
    id: 'fire_drill',
    title: 'Fire Drill',
    icon: '🚨',
    body: 'The alarm goes off mid-sprint. Facilities insists it is "just a drill". Facilities said that last time, too.',
    options: [
      { label: 'Evacuate properly', detail: 'Heal 10 HP.', apply: (r) => ({ run: healR(r, 10), text: 'Twenty minutes in the fresh air at the assembly point. You feel like a new person. A cold new person.' }) },
      { label: 'Keep coding with headphones on', detail: 'Lose 7 HP. Upgrade a random card.', apply: (r) => ({ run: upgradeRandom(hurt(r, 7)), text: 'The floor is empty and quiet. Best focus time of the year. Facilities is not amused.' }) },
      { label: 'Carry the office plant out heroically', detail: 'Raise Max HP by 3.', apply: (r) => ({ run: maxHp(r, 3), text: 'The ficus survives. You are thanked in the all-hands. You have never felt stronger.' }) },
    ],
  },
  {
    id: 'printer',
    title: 'PC LOAD LETTER',
    icon: '🖨️',
    body: 'The printer wants letter paper. We are in Europe. We have never owned letter paper. Your 40-page validation protocol is stuck at page 3.',
    options: [
      { label: 'Fix it properly', detail: 'Lose 6 HP. Remove a card from your deck.', enabled: (r) => r.deck.length > 5, apply: (r) => ({ run: hurt(r, 6), text: 'REMOVE' }) },
      {
        label: 'Kick it',
        detail: '50%: gain a random Uncommon card. 50%: add a Bug to your deck.',
        apply: (r) => (coin() ? { run: addCard(r, uncommon(r)), text: 'Out comes your document… and someone else\'s brilliant idea. Finders keepers.' } : { run: addCard(r, 'bug'), text: 'It prints 400 blank pages and a new bug report. Yours, apparently.' }),
      },
    ],
  },
  {
    id: 'secret_santa',
    title: 'Secret Santa',
    icon: '🎅',
    body: 'You drew the CTO. Budget: "reasonable". Nobody has ever defined reasonable.',
    options: [
      {
        label: 'Buy a thoughtful gift',
        detail: `Lose ${tokensText(45000)}. Gain a random relic.`,
        enabled: (r) => r.gold >= 45000,
        apply: (r) => {
          const g = randomRelic(spend(r, 45000))
          return { run: g.run, text: `A mechanical keyboard with Cherry Blues. The CTO is moved. In return, someone gifts you: ${g.name}.` }
        },
      },
      { label: 'Regift the company mug', detail: `Gain ${tokensText(20000)}.`, apply: (r) => ({ run: earn(r, 20000), text: 'It goes unnoticed. Meanwhile your own gift is a gift card. Win-win.' }) },
    ],
  },
  {
    id: 'mute',
    title: "You're on Mute",
    icon: '🔇',
    body: 'You just delivered the best five minutes of your career on the customer call. Muted. Twelve faces stare at you.',
    options: [
      { label: 'Unmute and do it again', detail: 'Lose 5 HP. Upgrade a random card.', apply: (r) => ({ run: upgradeRandom(hurt(r, 5)), text: 'The second take is even better. You have now rehearsed it. Twice.' }) },
      { label: 'Carry on as if nothing happened', detail: 'Gain a random Rare card. Add a Meeting Invite to your deck.', apply: (r) => ({ run: addCard(addCard(r, rare(r)), 'meeting'), text: 'Somehow they loved it. They want a follow-up. Every week. Forever.' }) },
    ],
  },
  {
    id: 'expense',
    title: 'Expense Report Rejected',
    icon: '🧾',
    body: 'Finance rejected your conference trip: "Receipt for 1 × coffee illegible". The coffee was 900 ISK. The hotel was not.',
    options: [
      { label: 'Resubmit with every receipt', detail: `Lose 8 HP. Gain ${tokensText(60000)}.`, apply: (r) => ({ run: earn(hurt(r, 8), 60000), text: 'Three hours of scanning later, you are reimbursed in full. Plus interest. Probably by accident.' }) },
      {
        label: 'Escalate to the CFO',
        detail: `50%: gain ${tokensText(100000)}. 50%: lose ${tokensText(30000)}.`,
        enabled: (r) => r.gold >= 30000,
        apply: (r) => (coin() ? { run: earn(r, 100000), text: 'The CFO approves it personally and apologises. Finance will remember this.' } : { run: spend(r, 30000), text: 'The CFO finds the minibar charge. You are now paying for the coffee AND a fine.' }),
      },
    ],
  },
  {
    id: 'phishing',
    title: 'The Phishing Test',
    icon: '🎣',
    body: '"URGENT: Your Saga Card bonus is ready. Click here to claim 1,000,000 tokens." The sender is ceo@contro1ant.biz.',
    options: [
      { label: 'Report it to IT', detail: 'Upgrade a random card.', apply: (r) => ({ run: upgradeRandom(r), text: 'IT sends you a gold star emoji. You feel unreasonably proud.' }) },
      { label: 'Click it. What could go wrong?', detail: `Gain ${tokensText(70000)}. Add Malware to your deck.`, apply: (r) => ({ run: addCard(earn(r, 70000), 'malware'), text: 'The tokens are real. So is the malware. IT enrolls you in "Security Awareness 101" for the fourth time.' }) },
    ],
  },

  // ================= Setting-specific =================
  {
    id: 'lov_keynote',
    settings: ['lov'],
    title: 'LOV Week: Slide 1 of 214',
    icon: '🎤',
    body: 'The banquet hall lights dim. A C-suite executive walks on stage: "I\'ll keep this brief." The clicker is already warm.',
    options: [
      { label: 'Sit in the front row and nod', detail: 'Lose 8 HP. Upgrade 2 random cards.', apply: (r) => ({ run: upgradeRandom(hurt(r, 8), 2), text: 'Your neck will never be the same. But slide 147 actually had a good idea.' }) },
      { label: 'Live-post it on LinkedIn', detail: `Gain ${tokensText(45000)}. Add a Meeting Invite to your deck.`, apply: (r) => ({ run: addCard(earn(r, 45000), 'meeting'), text: '"Humbled to hear our leadership\'s vision…" Brand ambassador bonus unlocked. So is a recurring sync.' }) },
      { label: 'Doze off at a round table', detail: 'Heal 15 HP.', apply: (r) => ({ run: healR(r, 15), text: 'You wake up during the Q&A to applause. You clap too. Nobody noticed.' }) },
    ],
  },
  {
    id: 'lov_quiz',
    settings: ['lov'],
    title: 'LOV Week: Company Quiz Night',
    icon: '🏆',
    body: 'Final question, winner takes the bar tab: "In what year was the first Saga Card shipped?" Your team looks at you.',
    options: [
      {
        label: 'Bet the bar tab on your answer',
        detail: `50%: gain ${tokensText(80000)}. 50%: lose ${tokensText(40000)}.`,
        enabled: (r) => r.gold >= 40000,
        apply: (r) => (coin() ? { run: earn(r, 80000), text: 'Correct! The table erupts. Drinks are on the other teams.' } : { run: spend(r, 40000), text: 'Wrong by one year. The bar tab is yours. Your team orders the expensive gin.' }),
      },
      { label: 'Let the CTO answer', detail: 'Lose 6 HP. Gain a random Uncommon card.', apply: (r) => ({ run: addCard(hurt(r, 6), uncommon(r)), text: 'He gets it right and drags you to the afterparty to celebrate. You learned things. You regret some of them.' }) },
    ],
  },
  {
    id: 'logipharma_booth',
    settings: ['logipharma'],
    title: 'LogiPharma: Booth Duty',
    icon: '🎪',
    body: 'Six hours at the booth. Your badge scanner is charged. Your feet are not ready.',
    options: [
      { label: 'Scan every badge in the hall', detail: `Lose 10 HP. Gain ${tokensText(70000)}.`, apply: (r) => ({ run: earn(hurt(r, 10), 70000), text: '312 leads, 4 real ones and blisters shaped like tote bags. Sales is thrilled.' }) },
      { label: 'Run the live demo station', detail: `Upgrade a random card. Gain ${tokensText(25000)}.`, apply: (r) => ({ run: earn(upgradeRandom(r), 25000), text: 'The demo logger reads 4.2 °C every single time. A pharma VP asks for your card.' }) },
      { label: 'Hide behind the roll-up banner', detail: 'Heal 12 HP.', apply: (r) => ({ run: healR(r, 12), text: 'Nobody finds you for two hours. You eat six free pretzels.' }) },
    ],
  },
  {
    id: 'logipharma_panel',
    settings: ['logipharma'],
    title: 'LogiPharma: The Panel Discussion',
    icon: '🎙️',
    body: 'A panelist cancelled. The moderator scans the audience… and points at your lanyard.',
    options: [
      { label: 'Talk about real-time visibility', detail: 'Lose 12 HP. Gain a random Rare card.', apply: (r) => ({ run: addCard(hurt(r, 12), rare(r)), text: 'Stage fright, then flow. Someone from a top-10 pharma company wants to "take this offline".' }) },
      { label: 'Plug the product shamelessly', detail: `Gain ${tokensText(55000)}. Add a Meeting Invite to your deck.`, apply: (r) => ({ run: addCard(earn(r, 55000), 'meeting'), text: 'Marketing sends you a heart emoji. Fourteen follow-up meetings appear in your calendar.' }) },
    ],
  },
  {
    id: 'wroclaw_pierogi',
    settings: ['wroclaw'],
    title: 'Pierogi Friday in Wrocław',
    icon: '🥟',
    body: 'The Wrocław office has ordered pierogi for everyone. There are 400. There are 30 of you.',
    options: [
      { label: 'Eat a dozen', detail: 'Heal 25 HP. Add a Sugar Crash curse to your deck.', apply: (r) => ({ run: addCard(healR(r, 25), 'sugar_crash'), text: 'Ruskie, then meat, then the sweet ones with cherries. You regret nothing until about 3 pm.' }) },
      { label: 'Share them around the team', detail: 'Raise Max HP by 4. Heal 6 HP.', apply: (r) => ({ run: healR(maxHp(r, 4), 6), text: 'You learn the Polish word for "one more". It is used a lot.' }) },
    ],
  },
  {
    id: 'wroclaw_dwarves',
    settings: ['wroclaw'],
    title: 'The Dwarves of Wrocław',
    icon: '🧙',
    body: 'Wrocław has hundreds of tiny bronze dwarf statues. Legend says finding five near the office before stand-up brings luck.',
    options: [
      {
        label: 'Hunt all five in the rain',
        detail: 'Lose 10 HP. Gain a random relic.',
        apply: (r) => {
          const g = randomRelic(hurt(r, 10))
          return { run: g.run, text: `Soaked, but you found the IT Dwarf, the Sleepy Dwarf and three more. Luck granted: ${g.name}.` }
        },
      },
      { label: 'Buy a lucky dwarf keychain', detail: `Lose ${tokensText(35000)}. Heal 12 HP and upgrade a random card.`, enabled: (r) => r.gold >= 35000, apply: (r) => ({ run: upgradeRandom(healR(spend(r, 35000), 12)), text: 'Is it luck? Is it placebo? Your code compiles on the first try.' }) },
    ],
  },
  {
    id: 's3_elevator',
    settings: ['s3'],
    title: 'The S3 Elevators',
    icon: '🛗',
    body: 'Every elevator in S3 is full. Your meeting on the 8th floor starts in two minutes. One door opens: it is just you and the CFO.',
    options: [
      { label: 'Take the stairs, all eight floors', detail: 'Lose 6 HP. Raise Max HP by 5.', apply: (r) => ({ run: maxHp(hurt(r, 6), 5), text: 'You arrive sweaty but on time, with a stunning view of Esja from the stairwell.' }) },
      { label: 'Ride up with the CFO', detail: `Gain ${tokensText(45000)}.`, apply: (r) => ({ run: earn(r, 45000), text: 'The best elevator pitch of your life, literally. Your budget is approved by the 6th floor.' }) },
    ],
  },
  {
    id: 'm4_esd',
    settings: ['m4'],
    title: 'M4: ESD Violation',
    icon: '⚡',
    body: 'You just touched a Saga Card board on the M4 line without your wrist strap. The line lead is walking over. Slowly.',
    options: [
      {
        label: 'Confess to the line lead',
        detail: `Lose ${tokensText(30000)}. Remove a curse or status card from your deck (or upgrade a random card if you have none).`,
        enabled: (r) => r.gold >= 30000,
        apply: (r) => {
          const paid = spend(r, 30000)
          const c = cleanse(paid)
          return c.removed ? { run: c.run, text: `A fine, a lecture and a clean slate. ${c.removed} removed from your deck.` } : { run: upgradeRandom(paid), text: 'A fine, a lecture and a surprisingly useful refresher course.' }
        },
      },
      { label: 'Blame static from the carpet', detail: 'Lose 8 HP. Upgrade a random card.', apply: (r) => ({ run: upgradeRandom(hurt(r, 8)), text: 'You are sent to redo ESD training. You actually learn how the boards are built.' }) },
      { label: 'Pretend nothing happened', detail: 'Gain a random Uncommon card. Add a Bug to your deck.', apply: (r) => ({ run: addCard(addCard(r, uncommon(r)), 'bug'), text: 'The board passes test. Mostly. You pocket a clever idea from the schematic.' }) },
    ],
  },
  {
    id: 'm2_pallets',
    settings: ['m2'],
    title: 'M2: Pallet Tetris',
    icon: '📦',
    body: 'A truck leaves M2 in one hour. Forty thousand loggers are still on the floor. The warehouse crew is on lunch.',
    options: [
      { label: 'Stack them yourself', detail: `Lose 12 HP. Gain ${tokensText(60000)} in overtime.`, apply: (r) => ({ run: earn(hurt(r, 12), 60000), text: 'Perfect pallet Tetris. The truck leaves on time. Your back files a complaint.' }) },
      {
        label: 'Borrow the forklift (no licence)',
        detail: '60%: gain a random Rare card. 40%: lose 15 HP.',
        apply: (r) => (Math.random() < 0.6 ? { run: addCard(r, rare(r)), text: 'Smooth as butter. The crew is impressed and teaches you a trick.' } : { run: hurt(r, 15), text: 'You take out a rack of empty boxes and your dignity. At least nobody filmed it. Someone filmed it.' }),
      },
      { label: 'Order pizza for the crew', detail: `Lose ${tokensText(30000)}. Upgrade 2 random cards.`, enabled: (r) => r.gold >= 30000, apply: (r) => ({ run: upgradeRandom(spend(r, 30000), 2), text: 'The crew finishes in 40 minutes and shows you how the pros stack. Pizza diplomacy works.' }) },
    ],
  },
]

export const EVENT: Record<string, GameEvent> = Object.fromEntries(EVENTS.map((e) => [e.id, e]))

/** Events that can appear in the given setting (unscoped events appear everywhere). */
export const eventsFor = (setting: string | undefined) => EVENTS.filter((e) => !e.settings || (setting !== undefined && e.settings.includes(setting)))
