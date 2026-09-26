import { ALL_CARDS } from '../game/cards'
import { countBugs } from '../game/core'
import { ENEMY } from '../game/enemies'
import { EVENTS } from '../game/events'
import { RELIC } from '../game/relics'
import type { Combat, Run } from '../game/types'
import { levelForXp, TIER_XP } from './career'
import { loadMeta, updateMeta, type MetaProfile } from './profile'

/** Achievements (M26). */

export type Tier = keyof typeof TIER_XP
export type Trigger = 'combatEnd' | 'cardPlayed' | 'runEnd' | 'event' | 'relic' | 'meta'

/**
 * Context shapes per trigger:
 * - combatEnd: { run (after applyCombatResult), combat (final state), won }
 * - cardPlayed: { run, combat (after the card resolved), cardId }
 * - runEnd:    { run (final), won }
 * - event:     { run (after the choice), eventId, option (0-based index) }
 * - relic:     { run (after the relic was added), relicId }
 * - meta:      {} (profile-only checks: career level, collection, wins; also run after every other trigger)
 */
export interface AchCtx {
  run?: Run
  combat?: Combat
  won?: boolean
  cardId?: string
  eventId?: string
  option?: number
  relicId?: string
}

export interface AchievementDef {
  id: string
  name: string
  desc: string
  icon: string
  tier: Tier
  category: 'Combat' | 'Firmware' | 'Hardware' | 'Calibration' | 'Bosses' | 'Runs' | 'Economy' | 'Events' | 'Collection' | 'Career'
  hidden?: boolean
  on: Trigger[]
  test: (ctx: AchCtx, meta: MetaProfile) => boolean
}

const won = (x: AchCtx) => !!x.won
const cs = (x: AchCtx) => x.combat!.stats
const hasEnemy = (x: AchCtx, id: string) => !!x.combat?.enemies.some((e) => e.defId === id)
const bossWin = (x: AchCtx, id: string) => won(x) && hasEnemy(x, id)
const isChar = (x: AchCtx, id: string) => x.run?.character === id
const W: Trigger[] = ['combatEnd']
const R: Trigger[] = ['runEnd']
const M: Trigger[] = ['meta']
const ANY_RUN: Trigger[] = ['combatEnd', 'event', 'relic', 'runEnd']

export const ACHIEVEMENTS: AchievementDef[] = [
  // ---------- Combat ----------
  { id: 'first_blood', name: 'Hello, World', desc: 'Win your first fight.', icon: '👋', tier: 'bronze', category: 'Combat', on: W, test: won },
  { id: 'flawless', name: 'Zero Defects', desc: 'Win a fight without losing any HP.', icon: '✨', tier: 'bronze', category: 'Combat', on: W, test: (x) => won(x) && cs(x).damageTaken === 0 },
  { id: 'flawless_elite', name: 'Audit Passed', desc: 'Defeat an elite without losing any HP.', icon: '📋', tier: 'silver', category: 'Combat', on: W, test: (x) => won(x) && x.combat!.kind === 'elite' && cs(x).damageTaken === 0 },
  { id: 'big_hit', name: 'Critical Path', desc: 'Deal 40 or more damage with a single hit.', icon: '💥', tier: 'silver', category: 'Combat', on: W, test: (x) => cs(x).maxHit >= 40 },
  { id: 'huge_hit', name: 'Load-Bearing Hotfix', desc: 'Deal 80 or more damage with a single hit.', icon: '☄️', tier: 'gold', category: 'Combat', hidden: true, on: W, test: (x) => cs(x).maxHit >= 80 },
  { id: 'wall', name: 'Double-Walled Styrofoam', desc: 'Have 50 or more Block at once.', icon: '🧱', tier: 'silver', category: 'Combat', on: W, test: (x) => cs(x).maxBlock >= 50 },
  { id: 'wall2', name: 'Faraday Cage Match', desc: 'Have 100 or more Block at once.', icon: '🏰', tier: 'gold', category: 'Combat', hidden: true, on: W, test: (x) => cs(x).maxBlock >= 100 },
  { id: 'combo', name: 'Deep Work', desc: 'Play 10 cards in a single turn.', icon: '🎧', tier: 'silver', category: 'Combat', on: W, test: (x) => cs(x).maxCardsInTurn >= 10 },
  { id: 'speedrun', name: 'Ship It', desc: 'Win an elite or boss fight on your first turn.', icon: '🏎️', tier: 'gold', category: 'Combat', on: W, test: (x) => won(x) && x.combat!.turn === 1 && x.combat!.kind !== 'normal' },
  { id: 'quick', name: 'Stand-up Done in 15', desc: 'Win a fight in 3 turns or fewer.', icon: '⏱️', tier: 'bronze', category: 'Combat', on: W, test: (x) => won(x) && x.combat!.turn <= 3 },
  { id: 'marathon', name: 'Could Have Been an Email', desc: 'Survive a fight that lasts 15 turns or more.', icon: '📧', tier: 'silver', category: 'Combat', on: W, test: (x) => x.combat!.turn >= 15 },
  { id: 'clutch', name: 'Hotfix in Prod', desc: 'Win a fight with 5 HP or less remaining.', icon: '😅', tier: 'silver', category: 'Combat', on: W, test: (x) => won(x) && x.combat!.player.hp <= 5 },
  { id: 'crowd', name: 'Reply All', desc: 'Win a fight against 3 or more enemies.', icon: '👥', tier: 'bronze', category: 'Combat', on: W, test: (x) => won(x) && x.combat!.enemies.length >= 3 },
  { id: 'no_block', name: 'Move Fast and Break Things', desc: 'Win a fight without gaining any Block.', icon: '🔨', tier: 'silver', category: 'Combat', on: W, test: (x) => won(x) && cs(x).blockGained === 0 && x.combat!.turn >= 2 },
  { id: 'pacifist', name: 'Pacifist Compliance', desc: 'Win a fight without playing a single Attack.', icon: '🕊️', tier: 'gold', category: 'Combat', hidden: true, on: W, test: (x) => won(x) && cs(x).attacks === 0 },
  { id: 'wasted', name: 'Underutilized Resource', desc: 'Leave 20 or more Energy unspent over a single fight.', icon: '🪫', tier: 'bronze', category: 'Combat', hidden: true, on: W, test: (x) => cs(x).energyWasted >= 20 },
  { id: 'powers4', name: 'Roadmap Enthusiast', desc: 'Play 4 Powers in one fight.', icon: '🗺️', tier: 'silver', category: 'Combat', on: W, test: (x) => cs(x).powers >= 4 },
  { id: 'bugs_hold', name: 'It Works on My Machine', desc: 'Win a fight while holding 3 or more Bugs.', icon: '🐞', tier: 'bronze', category: 'Combat', hidden: true, on: W, test: (x) => won(x) && x.combat!.hand.filter((c) => c.id === 'bug').length >= 3 },
  { id: 'heal30', name: 'Wellness Program', desc: 'Heal 30 or more HP in a single fight.', icon: '🧘', tier: 'silver', category: 'Combat', on: W, test: (x) => cs(x).healed >= 30 },
  { id: 'exhaust8', name: 'Burnout Culture', desc: 'Exhaust 8 or more cards in one fight.', icon: '🔥', tier: 'silver', category: 'Combat', on: W, test: (x) => cs(x).cardsExhausted >= 8 },
  {
    id: 'per_my_last', name: 'Per My Last Email', desc: 'Play Ping three times in a row.', icon: '📨', tier: 'bronze', category: 'Combat', hidden: true, on: ['cardPlayed'],
    test: (x) => x.combat!.log.slice(-3).length === 3 && x.combat!.log.slice(-3).every((l) => l.startsWith('You played Ping')),
  },
  {
    id: 'friday', name: 'Read-Only Friday', desc: 'Play Deploy on Friday… on an actual Friday.', icon: '📆', tier: 'silver', category: 'Combat', hidden: true, on: ['cardPlayed'],
    test: (x) => x.cardId === 'friday_deploy' && new Date().getDay() === 5,
  },

  // ---------- Firmware Developer ----------
  { id: 'fw_bugs10', name: 'Squash Committee', desc: 'As the Firmware Developer, exhaust 10 Bugs in one fight.', icon: '🪲', tier: 'silver', category: 'Firmware', on: W, test: (x) => isChar(x, 'fw') && cs(x).bugsExhausted >= 10 },
  { id: 'fw_bugs100', name: 'Debugger of the Year', desc: 'Exhaust 100 Bugs in a single run.', icon: '🏆', tier: 'gold', category: 'Firmware', on: ANY_RUN, test: (x) => isChar(x, 'fw') && (x.run!.stats.bugsExhausted ?? 0) >= 100 },
  { id: 'fw_debt', name: 'Technical Bankruptcy', desc: 'Win a fight with 8 or more Bugs across your piles.', icon: '💸', tier: 'silver', category: 'Firmware', hidden: true, on: W, test: (x) => won(x) && countBugs(x.combat!) >= 8 },
  { id: 'fw_boss_flawless', name: 'All Unit Tests Pass', desc: 'As the Firmware Developer, defeat a boss without losing HP.', icon: '✅', tier: 'gold', category: 'Firmware', on: W, test: (x) => isChar(x, 'fw') && won(x) && x.combat!.kind === 'boss' && cs(x).damageTaken === 0 },
  { id: 'fw_win', name: 'Shipped on Friday', desc: 'Win a run as the Firmware Developer.', icon: '💾', tier: 'gold', category: 'Firmware', on: R, test: (x) => won(x) && isChar(x, 'fw') },

  // ---------- Hardware Engineer ----------
  { id: 'hw_charge10', name: 'Fully Charged', desc: 'Reach 10 Charge.', icon: '🔋', tier: 'silver', category: 'Hardware', on: W, test: (x) => cs(x).maxCharge >= 10 },
  { id: 'hw_charge25', name: 'Magic Smoke', desc: 'Reach 25 Charge.', icon: '💨', tier: 'gold', category: 'Hardware', hidden: true, on: W, test: (x) => cs(x).maxCharge >= 25 },
  { id: 'hw_tank', name: 'Conformal Coating', desc: 'As the Hardware Engineer, have 60 or more Block at once.', icon: '🛡️', tier: 'silver', category: 'Hardware', on: W, test: (x) => isChar(x, 'hw') && cs(x).maxBlock >= 60 },
  { id: 'hw_zap', name: 'Short Circuit', desc: 'As the Hardware Engineer, deal 50 or more damage with a single hit.', icon: '⚡', tier: 'silver', category: 'Hardware', on: W, test: (x) => isChar(x, 'hw') && cs(x).maxHit >= 50 },
  { id: 'hw_win', name: 'Hardware Is Hard', desc: 'Win a run as the Hardware Engineer.', icon: '🔧', tier: 'gold', category: 'Hardware', on: R, test: (x) => won(x) && isChar(x, 'hw') },

  // ---------- Calibration Specialist ----------
  { id: 'cal_kills3', name: 'Out of Spec', desc: 'Kill 3 enemies with Excursion in one fight.', icon: '🌡️', tier: 'silver', category: 'Calibration', on: W, test: (x) => cs(x).excursionKills >= 3 },
  { id: 'cal_apply50', name: 'Heat Map', desc: 'Apply 50 Excursion in one fight.', icon: '🗺️', tier: 'silver', category: 'Calibration', on: W, test: (x) => cs(x).excursionApplied >= 50 },
  { id: 'cal_run500', name: 'Mapping Study', desc: 'Apply 500 Excursion in a single run.', icon: '📊', tier: 'gold', category: 'Calibration', on: ANY_RUN, test: (x) => (x.run!.stats.excursionApplied ?? 0) >= 500 },
  { id: 'cal_boss', name: 'Stability Study', desc: 'Kill a boss with Excursion damage.', icon: '🧪', tier: 'gold', category: 'Calibration', hidden: true, on: W, test: (x) => won(x) && x.combat!.kind === 'boss' && cs(x).excursionKills >= 1 },
  { id: 'cal_win', name: 'Traceable to National Standards', desc: 'Win a run as the Calibration Specialist.', icon: '📏', tier: 'gold', category: 'Calibration', on: R, test: (x) => won(x) && isChar(x, 'cal') },

  // ---------- Bosses ----------
  { id: 'boss_pc', name: 'Exit Interview', desc: 'Defeat the Director of People & Culture.', icon: '💼', tier: 'silver', category: 'Bosses', on: W, test: (x) => bossWin(x, 'boss_pc') },
  { id: 'boss_cto', name: 'Last Call', desc: 'Defeat the CTO.', icon: '🍺', tier: 'silver', category: 'Bosses', on: W, test: (x) => bossWin(x, 'boss_cto') },
  { id: 'boss_ceo', name: 'Fully Vested', desc: 'Defeat the CEO.', icon: '🦺', tier: 'gold', category: 'Bosses', on: W, test: (x) => bossWin(x, 'boss_ceo') },
  { id: 'boss_peter', name: 'Salt of the Earth', desc: 'Defeat Peter, the Saltpeter Guardian.', icon: '🧂', tier: 'gold', category: 'Bosses', on: W, test: (x) => bossWin(x, 'boss_peter') },
  { id: 'boss_forklift', name: 'Parked', desc: 'Defeat Forklift Frank.', icon: '🚜', tier: 'gold', category: 'Bosses', on: W, test: (x) => bossWin(x, 'boss_forklift') },
  { id: 'boss_cfo', name: 'Thawed', desc: 'Defeat the CFO.', icon: '🧊', tier: 'gold', category: 'Bosses', on: W, test: (x) => bossWin(x, 'boss_cfo') },
  { id: 'boss_audit', name: 'Audit Closed', desc: 'Defeat the Global Audit.', icon: '📑', tier: 'gold', category: 'Bosses', on: W, test: (x) => bossWin(x, 'boss_audit') },
  {
    id: 'forklift_slow', name: 'Speed Limit 10', desc: 'Defeat Forklift Frank without him ever reaching 10 Speed.', icon: '🐢', tier: 'silver', category: 'Bosses', on: W,
    test: (x) => bossWin(x, 'boss_forklift') && x.combat!.enemies.some((e) => e.defId === 'boss_forklift' && (e.flags.maxSpeed ?? 0) < 10),
  },
  { id: 'cfo_budget', name: 'Under Budget', desc: 'Defeat the CFO without losing a single token to him.', icon: '💶', tier: 'silver', category: 'Bosses', on: W, test: (x) => bossWin(x, 'boss_cfo') && x.combat!.goldStolen === 0 },
  {
    id: 'audit_clean', name: 'Clean Audit', desc: 'Defeat the Global Audit without receiving a single Finding.', icon: '✅', tier: 'platinum', category: 'Bosses', on: W, hidden: true,
    test: (x) => bossWin(x, 'boss_audit') && x.combat!.enemies.some((e) => e.defId === 'boss_audit' && !(e.flags.findings ?? 0)),
  },
  { id: 'recruiter_stop', name: 'Counter-Offer', desc: 'Defeat the Recruiter before it escapes with your card.', icon: '🤝', tier: 'bronze', category: 'Combat', on: W, test: (x) => won(x) && x.combat!.enemies.some((e) => e.defId === 'recruiter' && e.dead && !e.escaped) },
  {
    id: 'pc_nopip', name: 'No PIP Required', desc: 'Defeat People & Culture without a single PIP left in your deck.', icon: '📉', tier: 'gold', category: 'Bosses', hidden: true, on: W,
    test: (x) => bossWin(x, 'boss_pc') && ![...x.combat!.hand, ...x.combat!.draw, ...x.combat!.discard].some((c) => c.id === 'pip'),
  },
  { id: 'cto_flawless', name: 'Designated Driver', desc: 'Defeat the CTO without losing any HP.', icon: '🚗', tier: 'platinum', category: 'Bosses', hidden: true, on: W, test: (x) => bossWin(x, 'boss_cto') && cs(x).damageTaken === 0 },
  { id: 'ceo_fast', name: 'Hostile Takeover', desc: 'Defeat the CEO in 8 turns or fewer.', icon: '📉', tier: 'gold', category: 'Bosses', on: W, test: (x) => bossWin(x, 'boss_ceo') && x.combat!.turn <= 8 },
  {
    id: 'peter_defused', name: 'Defused', desc: 'Defeat Peter before he detonates.', icon: '🧯', tier: 'gold', category: 'Bosses', on: W,
    test: (x) => bossWin(x, 'boss_peter') && !x.combat!.enemies.some((e) => e.defId === 'boss_peter' && e.history.includes('boom')),
  },

  // ---------- Runs ----------
  { id: 'run_first', name: 'Onboarded', desc: 'Finish your first run, one way or another.', icon: '🪪', tier: 'bronze', category: 'Runs', on: R, test: () => true },
  { id: 'win1', name: 'Cold Chain Unbroken', desc: 'Win a run.', icon: '❄️', tier: 'gold', category: 'Runs', on: R, test: won },
  { id: 'win_all3', name: 'Full-Stack', desc: 'Win a run with all three characters.', icon: '🥞', tier: 'platinum', category: 'Runs', on: M, test: (_x, m) => ['fw', 'hw', 'cal'].every((c) => (m.charWins[c as 'fw'] ?? 0) > 0) },
  { id: 'win_review5', name: 'Exceeds Expectations', desc: 'Win a run at Performance Review 5 or higher.', icon: '🌟', tier: 'platinum', category: 'Runs', on: R, test: (x) => won(x) && (x.run!.reviewLevel ?? 0) >= 5 },
  { id: 'win_review10', name: 'Top Performer', desc: 'Win a run at Performance Review 10.', icon: '👑', tier: 'platinum', category: 'Runs', hidden: true, on: R, test: (x) => won(x) && (x.run!.reviewLevel ?? 0) >= 10 },
  { id: 'win_lowhp', name: 'Barely Compliant', desc: 'Win a run with 10 HP or less.', icon: '🩹', tier: 'gold', category: 'Runs', on: R, test: (x) => won(x) && x.run!.hp <= 10 },
  { id: 'win_small', name: 'Lean Startup', desc: 'Win a run with 15 or fewer cards in your deck.', icon: '🪶', tier: 'gold', category: 'Runs', on: R, test: (x) => won(x) && x.run!.deck.length <= 15 },
  { id: 'win_big', name: 'Enterprise Edition', desc: 'Win a run with 40 or more cards in your deck.', icon: '🐘', tier: 'gold', category: 'Runs', on: R, test: (x) => won(x) && x.run!.deck.length >= 40 },
  { id: 'win_norest', name: 'Decaf', desc: 'Win a run without resting at a coffee machine.', icon: '🚫', tier: 'gold', category: 'Runs', on: R, test: (x) => won(x) && (x.run!.stats.rests ?? 0) === 0 },
  { id: 'die_act1', name: 'Probation Period', desc: 'Get restructured in Act 1.', icon: '📦', tier: 'bronze', category: 'Runs', hidden: true, on: R, test: (x) => !won(x) && x.run!.act === 1 },
  { id: 'die_peter', name: 'So Close', desc: 'Get restructured by Peter.', icon: '⛏️', tier: 'silver', category: 'Runs', hidden: true, on: R, test: (x) => !won(x) && x.run!.act === 4 },
  { id: 'flawless5', name: 'Six Sigma', desc: 'Win 5 fights without losing HP in a single run.', icon: '📐', tier: 'gold', category: 'Runs', on: ANY_RUN, test: (x) => (x.run!.stats.flawlessFights ?? 0) >= 5 },

  // ---------- Economy (tokens are shown ×1000) ----------
  { id: 'earn_1m', name: 'Series A', desc: 'Earn 1,000k tokens in a single run.', icon: '💰', tier: 'silver', category: 'Economy', on: ANY_RUN, test: (x) => (x.run!.stats.tokensEarned ?? 0) >= 1_000_000 },
  { id: 'spend_500k', name: 'Shopping Spree', desc: 'Spend 500k tokens in a single run.', icon: '🛍️', tier: 'silver', category: 'Economy', on: ANY_RUN, test: (x) => (x.run!.stats.tokensSpent ?? 0) >= 500_000 },
  { id: 'hoard', name: 'Stock Buyback', desc: 'Hold 750k tokens at once.', icon: '🏦', tier: 'gold', category: 'Economy', hidden: true, on: ANY_RUN, test: (x) => x.run!.gold >= 750_000 },
  { id: 'broke', name: 'Budget Cuts', desc: 'Have exactly 0 tokens after floor 3.', icon: '🕳️', tier: 'bronze', category: 'Economy', hidden: true, on: ANY_RUN, test: (x) => x.run!.gold === 0 && x.run!.floor > 3 },
  { id: 'removals3', name: 'Marie Kondo', desc: 'Remove 3 cards from your deck in a single run.', icon: '🧹', tier: 'bronze', category: 'Economy', on: ANY_RUN, test: (x) => (x.run!.stats.removals ?? 0) >= 3 },
  { id: 'upgrades10', name: 'Continuous Improvement', desc: 'Upgrade 10 cards in a single run.', icon: '🧗', tier: 'silver', category: 'Economy', on: ANY_RUN, test: (x) => (x.run!.stats.upgrades ?? 0) >= 10 },
  { id: 'relics10', name: 'Desk Clutter', desc: 'Hold 10 relics at once.', icon: '🗃️', tier: 'silver', category: 'Economy', on: ANY_RUN, test: (x) => x.run!.relics.length >= 10 },

  // ---------- Events ----------
  { id: 'events10', name: 'Water Cooler Regular', desc: 'Visit 10 events in a single run.', icon: '🚰', tier: 'silver', category: 'Events', on: ANY_RUN, test: (x) => (x.run!.stats.eventsVisited ?? 0) >= 10 },
  { id: 'cake3', name: 'Sugar Rush', desc: 'Take three slices of the free cake.', icon: '🍰', tier: 'bronze', category: 'Events', hidden: true, on: ['event'], test: (x) => x.eventId === 'cake' && x.option === 1 },
  { id: 'usb_plug', name: 'Social Engineering', desc: 'Plug in the mysterious USB stick.', icon: '💾', tier: 'bronze', category: 'Events', hidden: true, on: ['event'], test: (x) => x.eventId === 'usb' && x.option === 0 },
  { id: 'lagoon_hike', name: 'Horizontal Rain', desc: 'Hike the volcano at the company offsite.', icon: '🌋', tier: 'bronze', category: 'Events', on: ['event'], test: (x) => x.eventId === 'lagoon' && x.option === 1 },
  { id: 'hackathon_win', name: 'Most Likely to Ship Without Review', desc: 'Pull an all-nighter at the hackathon.', icon: '🧑‍💻', tier: 'bronze', category: 'Events', on: ['event'], test: (x) => x.eventId === 'hackathon' && x.option === 0 },
  { id: 'events_all', name: 'Seen It All', desc: 'Encounter every event at least once.', icon: '👀', tier: 'gold', category: 'Events', on: M, test: (_x, m) => EVENTS.every((e) => m.compendium.events.includes(e.id)) },

  // ---------- Collection ----------
  { id: 'bestiary_all', name: 'Org Chart Memorized', desc: 'Encounter every enemy.', icon: '🗂️', tier: 'gold', category: 'Collection', on: M, test: (_x, m) => Object.keys(ENEMY).every((id) => (m.compendium.enemies[id]?.seen ?? 0) > 0) },
  { id: 'cards_half', name: 'Knowledge Base', desc: 'Discover half of all cards.', icon: '📚', tier: 'silver', category: 'Collection', on: M, test: (_x, m) => m.compendium.cards.length >= COLLECTIBLE_CARDS.length / 2 },
  { id: 'cards_all', name: 'Documentation Complete', desc: 'Discover every card.', icon: '📖', tier: 'platinum', category: 'Collection', hidden: true, on: M, test: (_x, m) => COLLECTIBLE_CARDS.every((id) => m.compendium.cards.includes(id)) },
  { id: 'relics_all', name: 'Swag Hoarder', desc: 'Discover every relic.', icon: '🎁', tier: 'gold', category: 'Collection', on: M, test: (_x, m) => Object.values(RELIC).filter((r) => r.tier !== 'starter').every((r) => m.compendium.relics.includes(r.id)) },
  { id: 'quotes25', name: 'Minutes Taker', desc: 'Hear 25 different enemy quotes.', icon: '🗒️', tier: 'silver', category: 'Collection', on: M, test: (_x, m) => Object.values(m.compendium.lines).reduce((a, l) => a + l.length, 0) >= 25 },

  // ---------- Career ----------
  { id: 'career5', name: 'Senior Material', desc: 'Reach career level 5.', icon: '🎓', tier: 'silver', category: 'Career', on: M, test: (_x, m) => levelForXp(m.xp) >= 5 },
  { id: 'career10', name: 'Principal Engineer', desc: 'Reach career level 10.', icon: '🏅', tier: 'gold', category: 'Career', on: M, test: (_x, m) => levelForXp(m.xp) >= 10 },
  { id: 'career14', name: 'Chief Cold Chain Officer', desc: 'Reach the top of the career ladder.', icon: '🏔️', tier: 'platinum', category: 'Career', hidden: true, on: M, test: (_x, m) => levelForXp(m.xp) >= 14 },
  { id: 'runs10', name: 'Tenured', desc: 'Play 10 runs.', icon: '📅', tier: 'silver', category: 'Career', on: M, test: (_x, m) => m.runs >= 10 },
  { id: 'runs50', name: 'Lifer', desc: 'Play 50 runs.', icon: '🪦', tier: 'gold', category: 'Career', hidden: true, on: M, test: (_x, m) => m.runs >= 50 },
  { id: 'ach25', name: 'Overachiever', desc: 'Unlock 25 achievements.', icon: '🥇', tier: 'gold', category: 'Career', on: M, test: (_x, m) => Object.keys(m.achievements).length >= 25 },
]

export const ACHIEVEMENT: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))

/** Cards that count toward the compendium (everything except statuses and curses). */
export const COLLECTIBLE_CARDS = ALL_CARDS.filter((d) => d.rarity !== 'special').map((d) => d.id)

/**
 * Check achievements for a trigger. Persists and returns only the NEWLY unlocked ones
 * (profile-only 'meta' achievements are always re-checked afterwards). Achievement XP is added immediately.
 */
export function checkAchievements(trigger: Trigger, ctx: AchCtx = {}): AchievementDef[] {
  const out: AchievementDef[] = []
  const tryUnlock = (t: Trigger) => {
    const meta = loadMeta()
    const hits = ACHIEVEMENTS.filter((a) => !meta.achievements[a.id] && !out.includes(a) && a.on.includes(t)).filter((a) => {
      try {
        return a.test(ctx, meta)
      } catch {
        return false
      }
    })
    if (!hits.length) return false
    updateMeta((m) => {
      for (const a of hits) {
        m.achievements[a.id] = Date.now()
        m.xp += TIER_XP[a.tier]
      }
    })
    out.push(...hits)
    return true
  }
  if (trigger !== 'meta') tryUnlock(trigger)
  // Meta achievements can cascade (e.g. unlocking the 25th achievement, or levelling up).
  for (let i = 0; i < 3 && tryUnlock('meta'); i++);
  return out
}

/** Achievements unlocked since a timestamp (e.g. during the current run). */
export function achievementsSince(ts: number): AchievementDef[] {
  const m = loadMeta()
  return ACHIEVEMENTS.filter((a) => (m.achievements[a.id] ?? 0) >= ts)
}
