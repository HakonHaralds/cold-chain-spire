import { useCallback, useEffect, useState } from 'react'
import { poolFor, rollCardRewards } from './game/cards'
import { CHARACTERS } from './game/characters'
import { applyCombatResult, endPlayerTurn, enemyAct, finishEnemyPhase, playCard, startCombat } from './game/combat'
import { mkCard, pick, rand, shuffle } from './game/core'
import { ENCOUNTERS } from './game/enemies'
import { EVENTS } from './game/events'
import { generateMap } from './game/map'
import { BOSS_RELICS, COMMON_RELICS } from './game/relics'
import type { CharId, Combat, MapNode, Run, Screen } from './game/types'
import { Backdrop } from './ui/Backdrop'
import { CombatScreen } from './ui/CombatScreen'
import { DeckModal } from './ui/DeckModal'
import { MapScreen } from './ui/MapScreen'
import { EventScreen, GameOverScreen, RestScreen, RewardScreen, ShopScreen, TitleScreen, TreasureScreen, VictoryScreen } from './ui/Screens'
import { TopBar } from './ui/TopBar'
import { Gallery } from './ui/Gallery'
import { CharSelect } from './ui/CharSelect'
import { Tour, tourDone } from './ui/Tutorial'
import { GameMenu } from './ui/GameMenu'
import { clearSave, readSave, saveable, writeSave } from './game/save'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function newRun(character: CharId): Run {
  const ch = CHARACTERS[character]
  return {
    character,
    hp: ch.hp,
    maxHp: ch.hp,
    gold: 99,
    deck: ch.deck.map((id) => mkCard(id)),
    relics: [ch.relic],
    act: 1,
    map: generateMap(1),
    position: null,
    floor: 0,
    seenBosses: [],
    stats: { enemiesDefeated: 0, cardsPlayed: 0, damageDealt: 0 },
  }
}

function grantRelic(run: Run, id: string): Run {
  let r = { ...run, relics: [...run.relics, id] }
  if (id === 'lanyard') r = { ...r, maxHp: r.maxHp + 10, hp: r.hp + 10 }
  if (id === 'kanelsnudur') r = { ...r, hp: Math.min(r.maxHp, r.hp + 20) }
  return r
}

const unownedCommon = (run: Run) => COMMON_RELICS.filter((id) => !run.relics.includes(id))

export default function App() {
  const [run, setRun] = useState<Run | null>(null)
  const [screen, setScreen] = useState<Screen>({ kind: 'title' })
  const [combat, setCombat] = useState<Combat | null>(null)
  const [showDeck, setShowDeck] = useState(false)
  const [lastEvents, setLastEvents] = useState<string[]>([])
  const [menu, setMenu] = useState(false)
  const [hasSave, setHasSave] = useState(() => !!readSave())
  const devMode = new URLSearchParams(location.search).has('fight')

  // Dev shortcuts: ?gallery shows every character, ?fight=boss_cto,act=2 jumps straight into a fight.
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    const fight = q.get('fight')
    if (fight) {
      const r = { ...newRun((q.get('char') as CharId) ?? 'fw'), act: Number(q.get('act') ?? 1) }
      setRun(r)
      setCombat(startCombat(r, fight.split(','), fight.includes('boss') ? 'boss' : 'normal'))
      setScreen({ kind: 'combat' })
    }
  }, [])

  const [tour, setTour] = useState<string | null>(null)

  const start = () => {
    setCombat(null)
    setScreen({ kind: 'charselect' })
  }
  const toTitle = () => {
    setMenu(false)
    setCombat(null)
    setRun(null)
    setTour(null)
    setHasSave(!!readSave())
    setScreen({ kind: 'title' })
  }
  const continueRun = () => {
    const s = readSave()
    if (!s) return setHasSave(false)
    setRun(s.run)
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
  const embark = (id: CharId) => {
    setRun(newRun(id))
    setLastEvents([])
    setScreen({ kind: 'map' })
  }

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
    const r: Run = { ...run, position: node.id, floor: run.floor + 1 }
    setRun(r)
    const enc = ENCOUNTERS[r.act]
    switch (node.type) {
      case 'combat': {
        const group = node.row < 2 ? pick(enc.easy) : pick(enc.hard)
        setCombat(startCombat(r, group, 'normal'))
        setScreen({ kind: 'combat' })
        break
      }
      case 'elite':
        setCombat(startCombat(r, pick(enc.elite), 'elite'))
        setScreen({ kind: 'combat' })
        break
      case 'boss':
        setCombat(startCombat(r, [enc.boss], 'boss'))
        setScreen({ kind: 'combat' })
        break
      case 'rest':
        setScreen({ kind: 'rest' })
        break
      case 'treasure':
        setScreen({ kind: 'treasure', relic: pick(unownedCommon(r).length ? unownedCommon(r) : ['kanelsnudur']), taken: false })
        break
      case 'shop': {
        const cards = shuffle(poolFor(r.character))
          .slice(0, 6)
          .map((d) => ({ id: d.id, price: (d.rarity === 'rare' ? 140 : d.rarity === 'uncommon' ? 75 : 48) + rand(-8, 8), sold: false }))
        const relics = shuffle(unownedCommon(r))
          .slice(0, 2)
          .map((id) => ({ id, price: 140 + rand(0, 40), sold: false }))
        setScreen({ kind: 'shop', cards, relics, removeUsed: false })
        break
      }
      case 'event': {
        const pool = EVENTS.filter((e) => !lastEvents.includes(e.id))
        const ev = pick(pool.length ? pool : EVENTS)
        setLastEvents((l) => [...l, ev.id].slice(-5))
        setScreen({ kind: 'event', eventId: ev.id, result: null })
        break
      }
    }
  }

  // ---- combat driving ----
  const onPlay = useCallback((cardUid: string, target: string | null) => {
    setCombat((c) => (c ? playCard(c, cardUid, target) : c))
    setRun((r) => (r ? { ...r, stats: { ...r.stats, cardsPlayed: r.stats.cardsPlayed + 1 } } : r))
  }, [])
  const onEndTurn = useCallback(() => setCombat((c) => (c ? endPlayerTurn(c) : c)), [])

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

  useEffect(() => {
    if (!combat || !run || (combat.phase !== 'won' && combat.phase !== 'lost')) return
    const t = setTimeout(() => {
      const r = applyCombatResult(run, combat)
      setCombat(null)
      if (combat.phase === 'lost') {
        setRun({ ...r, hp: 0 })
        setScreen({ kind: 'gameover' })
        return
      }
      if (combat.kind === 'boss' && r.act === 4) {
        setRun(r)
        setScreen({ kind: 'victory' })
        return
      }
      const goldMul = r.relics.includes('stock_options') ? 0.5 : 1
      const gold = Math.round((combat.kind === 'boss' ? 90 : combat.kind === 'elite' ? rand(28, 38) : rand(12, 22)) * goldMul)
      const relic = combat.kind === 'elite' && unownedCommon(r).length ? pick(unownedCommon(r)) : null
      const bossRelics = combat.kind === 'boss' ? shuffle(BOSS_RELICS.filter((id) => !r.relics.includes(id))).slice(0, 3) : null
      setRun({ ...r, gold: r.gold + gold })
      setScreen({ kind: 'reward', gold, cards: rollCardRewards(3, combat.kind !== 'normal', r.character), relic, bossRelics })
    }, 1100)
    return () => clearTimeout(t)
  }, [combat, run])

  const backToMap = () => {
    setCombat(null)
    if (!run) return
    const node = run.position ? run.map.nodes[run.position] : null
    if (node?.type === 'boss') {
      const act = run.act + 1
      setRun({ ...run, act, map: generateMap(act), position: null, hp: run.maxHp })
    }
    setScreen({ kind: 'map' })
  }

  const inGame = run && screen.kind !== 'title' && screen.kind !== 'charselect'
  const hero = run ? CHARACTERS[run.character] : null

  return (
    <div className={`app act-${run?.act ?? 1}`}>
      <Backdrop act={screen.kind === 'title' ? 0 : run?.act ?? 1} />
      {inGame && run && <TopBar run={run} combat={screen.kind === 'combat' ? combat : null} onDeck={() => setShowDeck(true)} onMenu={() => setMenu(true)} />}
      <main className="stage">
        <div key={screen.kind === 'combat' ? `combat-${run?.floor}` : screen.kind} className="screen-enter">
        {screen.kind === 'title' && (new URLSearchParams(location.search).has('gallery') ? <Gallery /> : <TitleScreen onStart={start} save={hasSave ? readSave() : null} onContinue={continueRun} />)}
        {screen.kind === 'charselect' && <CharSelect onPick={embark} onBack={() => setScreen({ kind: 'title' })} />}
        {screen.kind === 'map' && run && <MapScreen run={run} onEnter={enterNode} />}
        {screen.kind === 'combat' && combat && hero && <CombatScreen combat={combat} onPlay={onPlay} onEndTurn={onEndTurn} portrait={hero.portrait} heroName={hero.name} />}
        {screen.kind === 'reward' && run && (
          <RewardScreen
            screen={screen}
            onTakeCard={(id) => {
              setRun((r) => (r ? { ...r, deck: [...r.deck, mkCard(id)] } : r))
              setScreen((s) => (s.kind === 'reward' ? { ...s, cards: [] } : s))
            }}
            onTakeRelic={(id) => {
              setRun((r) => (r ? grantRelic(r, id) : r))
              setScreen((s) => (s.kind === 'reward' ? (s.relic === id ? { ...s, relic: null } : { ...s, bossRelics: [] }) : s))
            }}
            onDone={backToMap}
          />
        )}
        {screen.kind === 'rest' && run && <RestScreen run={run} used={!!screen.used} onUse={() => setScreen({ kind: 'rest', used: true })} setRun={setRun} onDone={backToMap} />}
        {screen.kind === 'shop' && run && <ShopScreen run={run} screen={screen} setRun={setRun} setScreen={setScreen} grantRelic={grantRelic} onDone={backToMap} />}
        {screen.kind === 'event' && run && <EventScreen run={run} screen={screen} setRun={setRun} setScreen={setScreen} onDone={backToMap} />}
        {screen.kind === 'treasure' && run && (
          <TreasureScreen
            relic={screen.relic}
            taken={screen.taken}
            onTake={() => {
              setRun((r) => (r ? grantRelic(r, screen.relic) : r))
              setScreen({ ...screen, taken: true })
            }}
            onDone={backToMap}
          />
        )}
        {screen.kind === 'gameover' && run && <GameOverScreen run={run} onRestart={start} />}
        {screen.kind === 'victory' && run && hero && <VictoryScreen run={run} portrait={hero.portrait} onRestart={start} />}
        </div>
      </main>
      {tour && <Tour id={tour} onDone={() => setTour(null)} />}
      {menu && <GameMenu canSave={saveable(screen, combat)} onResume={() => setMenu(false)} onSaveQuit={toTitle} onAbandon={abandon} />}
      {showDeck && run && <DeckModal title="Your deck" cards={run.deck} onClose={() => setShowDeck(false)} />}
    </div>
  )
}

