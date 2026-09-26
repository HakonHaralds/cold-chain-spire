import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { poolFor, rollCardRewards } from './game/cards'
import { CHARACTERS } from './game/characters'
import { applyCombatResult, endPlayerTurn, enemyAct, finishEnemyPhase, playCard, startCombat } from './game/combat'
import { DEFAULT_COMPANIONS, levelUpCompanion, newCompanion } from './game/companions'
import { mkCard, pick, rand, shuffle } from './game/core'
import { ENCOUNTERS } from './game/enemies'
import { EVENTS, eventsFor } from './game/events'
import { DEFAULT_SETTINGS, generateMap, rollSettings } from './game/map'
import { claimOkr, rollOkrs, startOkr } from './game/okrs'
import { BOSS_RELICS, COMMON_RELICS } from './game/relics'
import { clearSave, readSave, saveable, writeSave } from './game/save'
import { bump, emptyRunStats } from './game/stats'
import type { CharId, Combat, MapNode, Run, Screen } from './game/types'
import {
  applyBenefits,
  applyPerk,
  benefitExtraEliteCard,
  benefitRestBonus,
  benefitShopMul,
  applyReviewStart,
  cardRewardCount,
  careerLevel,
  careerTitle,
  checkAchievements,
  companionUnlocked,
  companionUnlockLevel,
  recordCardsSeen,
  recordEnemyDefeated,
  recordEnemySeen,
  recordEvent,
  recordLine,
  recordRelic,
  recordRunEnd,
  restHealPct,
  rewardTokenMul,
  shopPriceMul,
  type AchievementDef,
  type RunEndResult,
} from './meta'
import { Backdrop } from './ui/Backdrop'
import { CharSelect, type RunOptions } from './ui/CharSelect'
import { CombatScreen } from './ui/CombatScreen'
import { CompanionSelect } from './ui/CompanionSelect'
import { DeckChangeFx } from './ui/DeckChangeFx'
import { DeckModal } from './ui/DeckModal'
import { Gallery } from './ui/Gallery'
import { GameMenu } from './ui/GameMenu'
import { MapScreen } from './ui/MapScreen'
import { AchievementToasts } from './ui/meta/AchievementToast'
import { CareerScreen } from './ui/meta/CareerScreen'
import { CompendiumScreen } from './ui/meta/CompendiumScreen'
import { RunSummary } from './ui/meta/RunSummary'
import { OkrPicker } from './ui/OkrPicker'
import { BASE_H, BASE_W, ScaleContext } from './ui/scale'
import { EventScreen, GameOverScreen, RestScreen, RewardScreen, ShopScreen, TitleScreen, TreasureScreen, VictoryScreen } from './ui/Screens'
import { TopBar } from './ui/TopBar'
import { Tour, tourDone } from './ui/Tutorial'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const K = 1000 // tokens are shown in thousands ("25k")

function newRun(character: CharId, reviewLevel = 0): Run {
  const ch = CHARACTERS[character]
  return {
    character,
    hp: ch.hp,
    maxHp: ch.hp,
    gold: 99 * K,
    deck: ch.deck.map((id) => mkCard(id)),
    relics: [ch.relic],
    act: 1,
    map: generateMap(1),
    position: null,
    floor: 0,
    seenBosses: [],
    stats: emptyRunStats(),
    settings: rollSettings(),
    companion: null,
    okr: null,
    reviewLevel,
    startedAt: Date.now(),
  }
}

/** Bring older saves up to the current Run shape. */
function migrateRun(r: Run): Run {
  return {
    ...r,
    stats: { ...emptyRunStats(), ...r.stats },
    settings: r.settings ?? [...DEFAULT_SETTINGS],
    companion: r.companion ?? null,
    okr: r.okr ?? null,
    reviewLevel: r.reviewLevel ?? 0,
    startedAt: r.startedAt ?? Date.now(),
    gold: r.gold < 5000 ? r.gold * K : r.gold, // pre-token saves stored plain gold
  }
}

function grantRelic(run: Run, id: string): Run {
  let r = { ...run, relics: [...run.relics, id], stats: bump(run.stats, { relicsGained: 1 }) }
  if (id === 'lanyard') r = { ...r, maxHp: r.maxHp + 10, hp: r.hp + 10 }
  if (id === 'kanelsnudur') r = { ...r, hp: Math.min(r.maxHp, r.hp + 20) }
  return r
}

const unownedCommon = (run: Run) => COMMON_RELICS.filter((id) => !run.relics.includes(id))

/** Toast wrapper for non-achievement announcements (e.g. an OKR completing). */
const notice = (name: string, desc: string, icon = '🎯'): AchievementDef =>
  ({ id: `notice-${Date.now()}-${Math.random()}`, name, desc, icon, tier: 'gold', category: 'Runs', on: [], test: () => false }) as AchievementDef

export default function App() {
  const [run, setRun] = useState<Run | null>(null)
  const [screen, setScreen] = useState<Screen>({ kind: 'title' })
  const [combat, setCombat] = useState<Combat | null>(null)
  const [showDeck, setShowDeck] = useState(false)
  const [lastEvents, setLastEvents] = useState<string[]>([])
  const [menu, setMenu] = useState(false)
  const [tour, setTour] = useState<string | null>(null)
  const [toasts, setToasts] = useState<AchievementDef[]>([])
  const [summary, setSummary] = useState<RunEndResult | null>(null)
  const [scale, setScale] = useState(1)
  const [hasSave, setHasSave] = useState(() => !!readSave())
  const devMode = new URLSearchParams(location.search).has('fight')
  const combatRef = useRef<Combat | null>(null)
  const runRef = useRef<Run | null>(null)
  const lastCard = useRef<string | null>(null)
  const toasted = useRef(new Set<string>())
  combatRef.current = combat
  runRef.current = run

  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  const toast = useCallback((defs: AchievementDef[]) => {
    const fresh = defs.filter((d) => !toasted.current.has(d.id))
    fresh.forEach((d) => toasted.current.add(d.id))
    if (fresh.length) setToasts((q) => [...q, ...fresh])
  }, [])

  // Dev shortcuts: ?gallery shows every character, ?fight=boss_cto&act=2&char=hw jumps straight into a fight.
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    const fight = q.get('fight')
    if (fight) {
      const r = { ...newRun((q.get('char') as CharId) ?? 'fw'), act: Number(q.get('act') ?? 1) }
      const comp = q.get('comp')
      if (comp) r.companion = newCompanion(comp)
      setRun(r)
      setCombat(startCombat(r, fight.split(','), fight.includes('boss') ? 'boss' : 'normal'))
      setScreen({ kind: 'combat' })
    }
  }, [])

  const start = () => {
    setCombat(null)
    setSummary(null)
    setScreen({ kind: 'charselect' })
  }
  const toTitle = () => {
    setMenu(false)
    setCombat(null)
    setRun(null)
    setTour(null)
    setSummary(null)
    setHasSave(!!readSave())
    setScreen({ kind: 'title' })
  }
  const continueRun = () => {
    const s = readSave()
    if (!s) return setHasSave(false)
    setRun(migrateRun(s.run))
    setCombat(s.combat)
    setLastEvents(s.lastEvents)
    setScreen(s.screen)
  }
  const abandon = () => {
    clearSave()
    toTitle()
  }

  // Autosave at every safe point (map, stops, start of each player turn).
  useEffect(() => {
    if (!run || devMode) return
    if (screen.kind === 'gameover' || screen.kind === 'victory') return clearSave()
    if (saveable(screen, combat)) writeSave({ run, screen, combat: screen.kind === 'combat' ? combat : null, lastEvents })
  }, [run, screen, combat, lastEvents, devMode])

  const embark = (id: CharId, opts: RunOptions) => {
    let r = applyBenefits(applyReviewStart(newRun(id, opts.reviewLevel)))
    for (const perk of opts.perks) r = applyPerk(r, perk)
    recordCardsSeen(r.deck.map((c) => c.id))
    r.relics.forEach((rel) => recordRelic(rel))
    setRun(r)
    setLastEvents([])
    toasted.current.clear()
    setScreen({ kind: 'companionselect' })
  }
  const pickCompanion = (id: string | null) => {
    if (!run) return
    const r = { ...run, companion: id ? newCompanion(id) : null }
    setRun(r)
    setScreen({ kind: 'okrselect', options: rollOkrs(r.act, r.character) })
  }
  const pickOkr = (id: string | null) => {
    setRun((r) => (r && id ? startOkr(r, id) : r))
    setScreen({ kind: 'map' })
  }

  // OKRs: claim the reward the moment the goal is met.
  useEffect(() => {
    if (!run?.okr || run.okr.done) return
    const res = claimOkr(run)
    if (res) {
      setRun(res.run)
      toast([notice('OKR achieved!', res.rewardText)])
    }
  }, [run, toast])

  // First-time tutorial: one short tour per screen type.
  useEffect(() => {
    const id = screen.kind === 'map' ? 'map' : screen.kind === 'reward' ? 'reward' : screen.kind === 'combat' && combat?.kind === 'normal' ? 'combat' : null
    if (!id || tourDone(id)) return
    const t = setTimeout(() => setTour(id), id === 'combat' ? 1500 : 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen.kind])

  const enterNode = (node: MapNode) => {
    if (!run) return
    let r: Run = { ...run, position: node.id, floor: run.floor + 1 }
    const enc = ENCOUNTERS[r.act]
    const fight = (ids: string[], kind: Combat['kind']) => {
      ids.forEach((id) => recordEnemySeen(id))
      setCombat(startCombat(r, ids, kind))
      setScreen({ kind: 'combat' })
    }
    switch (node.type) {
      case 'combat':
        fight(node.row < 2 ? pick(enc.easy) : pick(enc.hard), 'normal')
        break
      case 'elite':
        fight(pick(enc.elite), 'elite')
        break
      case 'boss':
        fight([enc.boss], 'boss')
        break
      case 'rest':
        setScreen({ kind: 'rest' })
        break
      case 'treasure':
        setScreen({ kind: 'treasure', relic: pick(unownedCommon(r).length ? unownedCommon(r) : ['kanelsnudur']), taken: false })
        break
      case 'shop': {
        const mul = shopPriceMul(r.reviewLevel) * benefitShopMul()
        const price = (base: number) => Math.round(((base + rand(-8, 8)) * K * mul) / 1000) * 1000
        const cards = shuffle(poolFor(r.character))
          .slice(0, 6)
          .map((d) => ({ id: d.id, price: price(d.rarity === 'rare' ? 140 : d.rarity === 'uncommon' ? 75 : 48), sold: false }))
        const relics = shuffle(unownedCommon(r))
          .slice(0, 2)
          .map((id) => ({ id, price: Math.round(((140 + rand(0, 40)) * K * mul) / 1000) * 1000, sold: false }))
        recordCardsSeen(cards.map((c) => c.id))
        r = { ...r, stats: bump(r.stats, { shopsVisited: 1 }) }
        setScreen({ kind: 'shop', cards, relics, removeUsed: false })
        break
      }
      case 'event': {
        const local = eventsFor(r.settings?.[r.act - 1] ?? 'm2')
        const pool = local.filter((e) => !lastEvents.includes(e.id))
        const ev = pick(pool.length ? pool : local.length ? local : EVENTS)
        setLastEvents((l) => [...l, ev.id].slice(-8))
        recordEvent(ev.id)
        r = { ...r, stats: bump(r.stats, { eventsVisited: 1 }) }
        setScreen({ kind: 'event', eventId: ev.id, result: null })
        break
      }
    }
    setRun(r)
  }

  // ---- combat driving ----
  const onPlay = useCallback((cardUid: string, target: string | null) => {
    lastCard.current = combatRef.current?.hand.find((h) => h.uid === cardUid)?.id ?? null
    setCombat((c) => (c ? playCard(c, cardUid, target) : c))
    setRun((r) => (r ? { ...r, stats: bump(r.stats, { cardsPlayed: 1 }) } : r))
  }, [])
  const onEndTurn = useCallback(() => setCombat((c) => (c ? endPlayerTurn(c) : c)), [])

  // Card-played achievements, checked against the resolved combat state.
  const playedCount = combat?.stats?.cardsPlayed ?? 0
  useEffect(() => {
    const c = combatRef.current
    const r = runRef.current
    if (!c || !r || !lastCard.current || playedCount === 0) return
    toast(checkAchievements('cardPlayed', { run: r, combat: c, cardId: lastCard.current }))
  }, [playedCount, toast])

  // Compendium: remember every boss/enemy line we hear.
  const speechId = combat?.speech?.id
  useEffect(() => {
    const c = combatRef.current
    if (!c?.speech) return
    const e = c.enemies.find((x) => x.uid === c.speech!.target)
    if (e) recordLine(e.defId, c.speech.text)
  }, [speechId])

  useEffect(() => {
    if (!combat || combat.phase !== 'enemy') return
    let cancelled = false
    const order = combat.enemies.filter((e) => !e.dead).map((e) => e.uid)
    ;(async () => {
      await sleep(350)
      for (const u of order) {
        if (cancelled) return
        setCombat((c) => (c && c.phase === 'enemy' ? enemyAct(c, u) : c))
        await sleep(700)
      }
      if (!cancelled) setCombat((c) => (c && c.phase === 'enemy' ? finishEnemyPhase(c) : c))
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combat?.phase, combat?.turn])

  const endRun = (r: Run, won: boolean) => {
    if (devMode) return
    const res = recordRunEnd(r, won)
    setSummary(res)
    // Let the summary animate first, then celebrate anything newly unlocked.
    setTimeout(() => toast(res.achievements), 900)
  }

  useEffect(() => {
    if (!combat || !run || (combat.phase !== 'won' && combat.phase !== 'lost')) return
    const t = setTimeout(() => {
      const won = combat.phase === 'won'
      let r = applyCombatResult(run, combat)
      setCombat(null)
      combat.enemies.filter((e) => e.dead).forEach((e) => recordEnemyDefeated(e.defId))
      toast(checkAchievements('combatEnd', { run: r, combat, won }))
      if (!won) {
        r = { ...r, hp: 0 }
        setRun(r)
        setScreen({ kind: 'gameover' })
        endRun(r, false)
        return
      }
      if (combat.kind === 'boss' && r.act === 4) {
        setRun(r)
        setScreen({ kind: 'victory' })
        endRun(r, true)
        return
      }
      const mul = (r.relics.includes('stock_options') ? 0.5 : 1) * rewardTokenMul(r.reviewLevel)
      const base = combat.kind === 'boss' ? 90 : combat.kind === 'elite' ? rand(28, 38) : rand(12, 22)
      const gold = Math.round((base * K * mul) / 1000) * 1000
      const relic = combat.kind === 'elite' && unownedCommon(r).length ? pick(unownedCommon(r)) : null
      const bossRelics = combat.kind === 'boss' ? shuffle(BOSS_RELICS.filter((id) => !r.relics.includes(id))).slice(0, 3) : null
      const cards = rollCardRewards(cardRewardCount(r.reviewLevel) + (combat.kind !== 'normal' ? benefitExtraEliteCard() : 0), combat.kind !== 'normal', r.character)
      recordCardsSeen(cards)
      setRun({ ...r, gold: r.gold + gold, stats: bump(r.stats, { tokensEarned: gold }) })
      setScreen({ kind: 'reward', gold, cards, relic, bossRelics })
    }, 1100)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combat, run])

  const takeRelic = (id: string) => {
    const r = runRef.current
    if (!r) return
    const next = grantRelic(r, id)
    recordRelic(id)
    setRun(next)
    toast(checkAchievements('relic', { run: next, relicId: id }))
  }

  const backToMap = () => {
    setCombat(null)
    if (!run) return
    const node = run.position ? run.map.nodes[run.position] : null
    if (node?.type === 'boss') {
      const act = run.act + 1
      const r = levelUpCompanion({ ...run, act, map: generateMap(act), position: null, hp: run.maxHp, okr: null })
      setRun(r)
      if (r.companion && r.companion.level > (run.companion?.level ?? 0)) toast([notice('Companion levelled up!', `Your companion reached level ${r.companion.level}.`, '⭐')])
      setScreen({ kind: 'okrselect', options: rollOkrs(act, r.character) })
      return
    }
    setScreen({ kind: 'map' })
  }

  const inGame = run && !['title', 'charselect', 'career', 'compendium', 'companionselect'].includes(screen.kind)
  const hero = run ? CHARACTERS[run.character] : null
  const summaryNode = summary && run ? <RunSummary result={summary} run={run} /> : null
  const lvl = careerLevel()

  return (
    <div className={`app act-${run?.act ?? 1}`}>
      <Backdrop setting={!run || ['title', 'charselect', 'career', 'compendium', 'companionselect', 'okrselect'].includes(screen.kind) ? 'title' : run.settings?.[run.act - 1] ?? 'm2'} />
      <ScaleContext.Provider value={scale}>
        <div className="viewport">
          <div className="game-root" style={{ width: BASE_W, height: BASE_H, transform: `translate(-50%, -50%) scale(${scale})` }}>
            {inGame && run && <TopBar run={run} combat={screen.kind === 'combat' ? combat : null} onDeck={() => setShowDeck(true)} onMenu={() => setMenu(true)} />}
            <main className="stage">
              <div key={screen.kind === 'combat' ? `combat-${run?.floor}` : screen.kind} className="screen-enter">
                {screen.kind === 'title' &&
                  (new URLSearchParams(location.search).has('gallery') ? (
                    <Gallery />
                  ) : (
                    <TitleScreen
                      onStart={start}
                      save={hasSave ? readSave() : null}
                      onContinue={continueRun}
                      onCareer={() => setScreen({ kind: 'career' })}
                      onCompendium={() => setScreen({ kind: 'compendium' })}
                      careerLabel={`${careerTitle(lvl)} · Career level ${lvl}`}
                    />
                  ))}
                {screen.kind === 'career' && <CareerScreen onBack={() => setScreen({ kind: 'title' })} />}
                {screen.kind === 'compendium' && <CompendiumScreen onBack={() => setScreen({ kind: 'title' })} />}
                {screen.kind === 'charselect' && <CharSelect onPick={embark} onBack={() => setScreen({ kind: 'title' })} />}
                {screen.kind === 'companionselect' && (
                  <CompanionSelect
                    onPick={pickCompanion}
                    onSkip={() => pickCompanion(null)}
                    isUnlocked={(id) => companionUnlocked(id) || DEFAULT_COMPANIONS.includes(id)}
                    lockedHint={(id) => (companionUnlocked(id) ? null : `Unlocks at career level ${companionUnlockLevel(id)}`)}
                  />
                )}
                {screen.kind === 'okrselect' && run && <OkrPicker act={run.act} options={screen.options} onPick={pickOkr} onSkip={() => pickOkr(null)} />}
                {screen.kind === 'map' && run && <MapScreen run={run} onEnter={enterNode} />}
                {screen.kind === 'combat' && combat && hero && <CombatScreen combat={combat} onPlay={onPlay} onEndTurn={onEndTurn} portrait={hero.portrait} heroName={hero.name} />}
                {screen.kind === 'reward' && run && (
                  <RewardScreen
                    screen={screen}
                    onTakeCard={(id) => {
                      setRun((r) => (r ? { ...r, deck: [...r.deck, mkCard(id)], stats: bump(r.stats, { cardsAdded: 1 }) } : r))
                      setScreen((s) => (s.kind === 'reward' ? { ...s, cards: [] } : s))
                    }}
                    onTakeRelic={(id) => {
                      takeRelic(id)
                      setScreen((s) => (s.kind === 'reward' ? (s.relic === id ? { ...s, relic: null } : { ...s, bossRelics: [] }) : s))
                    }}
                    onDone={backToMap}
                  />
                )}
                {screen.kind === 'rest' && run && (
                  <RestScreen run={run} used={!!screen.used} onUse={() => setScreen({ kind: 'rest', used: true })} setRun={setRun} onDone={backToMap} healPct={restHealPct(run.reviewLevel) + benefitRestBonus()} />
                )}
                {screen.kind === 'shop' && run && (
                  <ShopScreen
                    run={run}
                    screen={screen}
                    setRun={setRun}
                    setScreen={setScreen}
                    grantRelic={(r, id) => {
                      recordRelic(id)
                      const next = grantRelic(r, id)
                      toast(checkAchievements('relic', { run: next, relicId: id }))
                      return next
                    }}
                    onDone={backToMap}
                  />
                )}
                {screen.kind === 'event' && run && (
                  <EventScreen
                    run={run}
                    screen={screen}
                    setRun={setRun}
                    setScreen={setScreen}
                    onDone={backToMap}
                    onChoice={(option, after) => toast(checkAchievements('event', { run: after, eventId: screen.eventId, option }))}
                  />
                )}
                {screen.kind === 'treasure' && run && (
                  <TreasureScreen
                    relic={screen.relic}
                    taken={screen.taken}
                    onTake={() => {
                      takeRelic(screen.relic)
                      setScreen({ ...screen, taken: true })
                    }}
                    onDone={backToMap}
                  />
                )}
                {screen.kind === 'gameover' && run && <GameOverScreen run={run} onRestart={start} summary={summaryNode} />}
                {screen.kind === 'victory' && run && hero && <VictoryScreen run={run} portrait={hero.portrait} onRestart={start} summary={summaryNode} />}
              </div>
            </main>
            <DeckChangeFx run={screen.kind === 'combat' ? null : run} />
            {showDeck && run && <DeckModal title="Your deck" cards={run.deck} onClose={() => setShowDeck(false)} />}
            {menu && <GameMenu canSave={saveable(screen, combat)} onResume={() => setMenu(false)} onSaveQuit={toTitle} onAbandon={abandon} />}
          </div>
        </div>
      </ScaleContext.Provider>
      {tour && <Tour id={tour} onDone={() => setTour(null)} />}
      <AchievementToasts queue={toasts} onShift={() => setToasts((q) => q.slice(1))} />
    </div>
  )
}

