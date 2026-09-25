import { poolFor } from './cards'
import { mkCard, pick } from './core'
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
}

const upgradeRandom = (run: Run): Run => {
  const cands = run.deck.filter((c) => !c.upgraded && !['bug', 'pip', 'sugar_crash', 'malware'].includes(c.id))
  if (!cands.length) return run
  const target = pick(cands)
  return { ...run, deck: run.deck.map((c) => (c.uid === target.uid ? { ...c, upgraded: true } : c)) }
}

const rare = (r: Run) => pick(poolFor(r.character).filter((d) => d.rarity === 'rare')).id

export const EVENTS: GameEvent[] = [
  {
    id: 'slack',
    title: 'The @channel Ping',
    icon: '💬',
    body: 'Somebody just @channel\'d the entire company to ask whether the fridge on floor 3 is "running". 412 people are typing…',
    options: [
      { label: 'Reply thoughtfully', detail: 'Lose 6 HP. Upgrade a random card.', apply: (r) => ({ run: upgradeRandom({ ...r, hp: Math.max(1, r.hp - 6) }), text: 'Your reply gets 3 👀 reactions and one "+1". You learned something, though.' }) },
      { label: 'React with 🎉', detail: 'Gain 25 gold.', apply: (r) => ({ run: { ...r, gold: r.gold + 25 }, text: 'Somehow your emoji gets you nominated for Employee of the Month. It comes with a gift card.' }) },
      { label: 'Mute the channel', detail: 'Nothing happens. Blissfully.', apply: (r) => ({ run: r, text: 'Silence. Beautiful, productive silence.' }) },
    ],
  },
  {
    id: 'cake',
    title: 'Free Cake in the Kitchen',
    icon: '🎂',
    body: 'Someone had a birthday. Or a baby. Or quit. Nobody knows, but there is cake, and it is going fast.',
    options: [
      { label: 'Have a slice', detail: 'Heal 15 HP.', apply: (r) => ({ run: { ...r, hp: Math.min(r.maxHp, r.hp + 15) }, text: 'Carrot cake. Surprisingly excellent.' }) },
      { label: 'Take three slices', detail: 'Heal 30 HP. Add a Sugar Crash curse to your deck.', apply: (r) => ({ run: { ...r, hp: Math.min(r.maxHp, r.hp + 30), deck: [...r.deck, mkCard('sugar_crash')] }, text: 'Worth it. Probably. Your pancreas files a deviation report.' }) },
      { label: 'Leave it', detail: 'Nothing happens.', apply: (r) => ({ run: r, text: 'Discipline. The QA department nods approvingly.' }) },
    ],
  },
  {
    id: 'usb',
    title: 'A Mysterious USB Stick',
    icon: '💾',
    body: 'In the parking lot you find a USB stick labeled "SENSITECH — Q4 PRICING — CONFIDENTIAL". It is warm. Very warm.',
    options: [
      { label: 'Plug it in', detail: '50%: gain a Rare card. 50%: gain Malware.', apply: (r) => (Math.random() < 0.5 ? { run: { ...r, deck: [...r.deck, mkCard(rare(r))] }, text: 'Jackpot. Their entire playbook. You learn a new trick.' } : { run: { ...r, deck: [...r.deck, mkCard('malware')] }, text: 'Your screen fills with pop-ups for 2009-era datalogger software. Uh oh.' }) },
      { label: 'Hand it to IT Security', detail: 'Gain 40 gold (bug bounty).', apply: (r) => ({ run: { ...r, gold: r.gold + 40 }, text: 'IT gives you a sticker, a lecture and a bounty.' }) },
    ],
  },
  {
    id: 'hackathon',
    title: 'The Hackathon',
    icon: '🧑‍💻',
    body: '24 hours. Unlimited pizza. The theme is "AI for the cold chain", which nobody can define.',
    options: [
      { label: 'Pull an all-nighter', detail: 'Lose 10 HP. Gain a random Rare card.', apply: (r) => ({ run: { ...r, hp: Math.max(1, r.hp - 10), deck: [...r.deck, mkCard(rare(r))] }, text: 'You win "Most Likely to Be Put Into Production Without Review". A dubious but powerful honor.' }) },
      { label: 'Just eat the pizza', detail: 'Heal 10 HP.', apply: (r) => ({ run: { ...r, hp: Math.min(r.maxHp, r.hp + 10) }, text: 'Pepperoni. Pineapple. Both on one slice. No regrets.' }) },
    ],
  },
  {
    id: 'lagoon',
    title: 'Company Offsite in Iceland',
    icon: '🌋',
    body: 'The bus stops between a steaming lagoon and a volcano trail. The guide says the weather will change in five minutes. It always does.',
    options: [
      { label: 'Soak in the lagoon', detail: 'Lose 50 gold. Heal to full.', enabled: (r) => r.gold >= 50, apply: (r) => ({ run: { ...r, gold: r.gold - 50, hp: r.maxHp }, text: 'Silica mud mask. Zero stress. Mild sulfur smell.' }) },
      { label: 'Hike the volcano', detail: 'Lose 8 HP. Raise Max HP by 8.', apply: (r) => ({ run: { ...r, hp: Math.max(1, r.hp - 8), maxHp: r.maxHp + 8 }, text: 'Horizontal rain. Glorious views. You feel sturdier.' }) },
      { label: 'Stay on the bus', detail: 'Nothing happens.', apply: (r) => ({ run: r, text: 'You answer emails. The bus smells of dried fish.' }) },
    ],
  },
  {
    id: 'coldroom',
    title: 'Locked in the Cold Room',
    icon: '🥶',
    body: 'The door clicked shut behind you. It is −20 °C. While waiting for rescue, you have time to reflect on your habits.',
    options: [
      { label: 'Reflect deeply', detail: 'Lose 6 HP. Remove a card from your deck.', enabled: (r) => r.deck.length > 5, apply: (r) => ({ run: { ...r, hp: Math.max(1, r.hp - 6) }, text: 'REMOVE' }) },
      { label: 'Do jumping jacks', detail: 'Nothing happens, but you stay warm.', apply: (r) => ({ run: r, text: 'Facilities lets you out after 20 minutes. You are logged as an excursion.' }) },
    ],
  },
  {
    id: 'reorg',
    title: 'The Reorg',
    icon: '🔀',
    body: 'A new org chart is announced. You now report to someone who reports to you. Your old team has become a "tribe".',
    options: [
      { label: 'Embrace the change', detail: 'Transform a random card into a random card.', apply: (r) => {
        const cands = r.deck.filter((c) => DEF_SAFE(c.id))
        if (!cands.length) return { run: r, text: 'Nothing changes. Truly a reorg.' }
        const t = pick(cands)
        const n = pick(poolFor(r.character)).id
        return { run: { ...r, deck: r.deck.map((c) => (c.uid === t.uid ? mkCard(n) : c)) }, text: 'Your role has been reimagined. You have a new skill, allegedly.' }
      } },
      { label: 'Update your LinkedIn', detail: 'Gain 20 gold.', apply: (r) => ({ run: { ...r, gold: r.gold + 20 }, text: 'Three recruiters message you within the hour. One offers a referral bonus.' }) },
    ],
  },
]

const DEF_SAFE = (id: string) => !['bug', 'pip', 'sugar_crash', 'malware', 'meeting', 'hangover', 'deviation'].includes(id)

export const EVENT: Record<string, GameEvent> = Object.fromEntries(EVENTS.map((e) => [e.id, e]))
