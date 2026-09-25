import { useEffect, useRef, useState } from 'react'
import { Portrait } from '../art/Portraits'
import { DEF } from '../game/cards'
import { canPlay } from '../game/combat'
import { livingEnemies, STATUS_INFO } from '../game/core'
import { ENEMY, intentOf, shownDamage } from '../game/enemies'
import type { CardInst, Combat, EnemyInst, Fighter, IntentKind, StatusId } from '../game/types'
import { Card } from './Card'
import { DeckModal } from './DeckModal'
import { FxLayer } from './Fx'

const INTENT_ICON: Record<IntentKind, string> = {
  attack: '⚔️',
  defend: '🛡️',
  buff: '✨',
  debuff: '🌀',
  attack_debuff: '⚔️🌀',
  attack_defend: '⚔️🛡️',
  defend_buff: '🛡️✨',
  summon: '📣',
  sleep: '💤',
  heal: '💚',
}

const FLY_MS = 300

function Statuses({ f }: { f: Fighter }) {
  const entries = Object.entries(f.statuses).filter(([, v]) => v) as [StatusId, number][]
  return (
    <div className="statuses">
      {entries.map(([id, v]) => (
        <span key={id} className={`status ${STATUS_INFO[id].debuff || v < 0 ? 'debuff' : ''}`} tabIndex={0}>
          <span key={v} className="status-pop">
            {STATUS_INFO[id].icon}
            <b>{id === 'tipsy' ? `${v}%` : v}</b>
          </span>
          <span className="tip">
            <b>{STATUS_INFO[id].name}</b>
            <br />
            {STATUS_INFO[id].desc.replace('X', String(v))}
          </span>
        </span>
      ))}
    </div>
  )
}

function HpBar({ f }: { f: Fighter }) {
  const pct = Math.max(0, (f.hp / f.maxHp) * 100)
  const exc = f.statuses.excursion ? Math.min(pct, (f.statuses.excursion / f.maxHp) * 100) : 0
  return (
    <div className="hpbar-wrap">
      {f.block > 0 && (
        <span key={f.block} className="block-badge">
          🛡️ {f.block}
        </span>
      )}
      <div className={`hpbar ${f.block > 0 ? 'blocking' : ''}`}>
        <div className="hptrail" style={{ width: `${pct}%` }} />
        <div className="hpfill" style={{ width: `${pct}%` }} />
        {exc > 0 && <div className="hpfill-poison" style={{ width: `${exc}%`, left: `${pct - exc}%` }} />}
        <span className="hptext">
          {f.hp}/{f.maxHp}
        </span>
      </div>
    </div>
  )
}

function Floats({ c, target }: { c: Combat; target: string }) {
  const list = c.floats.filter((f) => f.target === target)
  return (
    <div className="floats">
      {list.map((f, i) => (
        <span key={f.id} className={`float float-${f.kind}`} style={{ animationDelay: `${(i % 4) * 0.06}s`, left: `${((f.id * 37) % 60) - 30}px` }}>
          {f.text}
        </span>
      ))}
    </div>
  )
}

function Speech({ c, target }: { c: Combat; target: string }) {
  if (!c.speech || c.speech.target !== target) return null
  return (
    <div key={c.speech.id} className="speech">
      {c.speech.text}
    </div>
  )
}

function EnemyView({ e, c, targeting, onTarget }: { e: EnemyInst; c: Combat; targeting: boolean; onTarget: () => void }) {
  const def = ENEMY[e.defId]
  const it = intentOf(e, c)
  const dmg = shownDamage(e, c)
  const size = def.tier === 'boss' ? 300 : def.tier === 'elite' ? 220 : def.tier === 'minion' ? 130 : 170
  return (
    <div
      data-uid={e.uid}
      className={`fighter enemy tier-${def.tier} ${e.dead ? 'dead' : ''} ${targeting && !e.dead ? 'targetable' : ''}`}
      onClick={() => targeting && !e.dead && onTarget()}
      role={targeting ? 'button' : undefined}
      aria-label={`${def.name}, ${e.hp} HP`}
    >
      {!e.dead && c.phase !== 'won' && (
        <div key={`${e.move}-${e.turn}`} className={`intent intent-${it.kind}`} tabIndex={0}>
          <span className="intent-icon">{INTENT_ICON[it.kind]}</span>
          {dmg !== null && (
            <span className="intent-dmg">
              {dmg}
              {(it.hits ?? 1) > 1 ? `×${it.hits}` : ''}
            </span>
          )}
          <span className="intent-label">{it.label}</span>
        </div>
      )}
      <Speech c={c} target={e.uid} />
      <div className="sprite-wrap">
        <div key={c.anim[e.uid]} className={`sprite ${c.anim[e.uid]?.split(' ')[0] ?? ''}`}>
          <Portrait id={e.defId} size={size} />
        </div>
        <FxLayer c={c} target={e.uid} />
      </div>
      <Floats c={c} target={e.uid} />
      <div className="fighter-info">
        <div className="fighter-name">
          {def.name}
          {def.title && <span className="fighter-title">{def.title}</span>}
        </div>
        <HpBar f={e} />
        <Statuses f={e} />
      </div>
      {def.bio && <div className="bio">{def.bio}</div>}
    </div>
  )
}

interface Flying {
  card: CardInst
  from: DOMRect
  to: { x: number; y: number }
  go: boolean
  kind: string
}

export function CombatScreen({
  combat: c,
  onPlay,
  onEndTurn,
  portrait,
  heroName,
}: {
  combat: Combat
  onPlay: (uid: string, target: string | null) => void
  onEndTurn: () => void
  portrait: string
  heroName: string
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [pile, setPile] = useState<null | 'draw' | 'discard' | 'exhaust'>(null)
  const [shake, setShake] = useState<string | null>(null)
  const [flying, setFlying] = useState<Flying | null>(null)
  const [discarding, setDiscarding] = useState(false)
  const [screenShake, setScreenShake] = useState(false)
  const [intro, setIntro] = useState<EnemyInst | null>(() => (c.turn === 1 ? c.enemies.find((e) => ENEMY[e.defId].tier === 'boss') ?? null : null))
  const lastShake = useRef(c.shake)

  const selectedCard = c.hand.find((h) => h.uid === selected) ?? null
  const targeting = !!selectedCard && DEF[selectedCard.id].target === 'enemy'
  const busy = !!flying || discarding || !!intro
  const isPlayer = c.phase === 'player'

  useEffect(() => {
    if (selected && !c.hand.some((h) => h.uid === selected)) setSelected(null)
  }, [c.hand, selected])

  useEffect(() => {
    if (c.shake !== lastShake.current) {
      lastShake.current = c.shake
      setScreenShake(true)
      const t = setTimeout(() => setScreenShake(false), 450)
      return () => clearTimeout(t)
    }
  }, [c.shake])

  useEffect(() => {
    if (!intro) return
    const t = setTimeout(() => setIntro(null), 2600)
    return () => clearTimeout(t)
  }, [intro])

  /** Animate a card from the hand to its destination, then resolve it. */
  const launch = (card: CardInst, target: string | null) => {
    const el = document.querySelector(`.hand [data-uid="${card.uid}"]`)
    const d = DEF[card.id]
    const dest = target ? document.querySelector(`.enemy[data-uid="${target}"] .sprite-wrap`) : d.type === 'power' ? document.querySelector('.player .sprite-wrap') : null
    const bf = document.querySelector('.battlefield')?.getBoundingClientRect()
    const tr = dest?.getBoundingClientRect()
    const to = tr ? { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 } : { x: (bf?.left ?? 0) + (bf?.width ?? 800) / 2, y: (bf?.top ?? 0) + (bf?.height ?? 400) * 0.45 }
    setSelected(null)
    if (!el) {
      onPlay(card.uid, target)
      return
    }
    setFlying({ card, from: el.getBoundingClientRect(), to, go: false, kind: d.type })
    requestAnimationFrame(() => requestAnimationFrame(() => setFlying((f) => (f ? { ...f, go: true } : f))))
    setTimeout(() => {
      onPlay(card.uid, target)
      setFlying(null)
    }, FLY_MS)
  }

  const clickCard = (card: CardInst) => {
    if (!isPlayer || busy) return
    if (!canPlay(c, card)) {
      setShake(card.uid)
      setTimeout(() => setShake(null), 400)
      return
    }
    const d = DEF[card.id]
    if (d.target === 'enemy') {
      const living = livingEnemies(c)
      if (living.length === 1) launch(card, living[0].uid)
      else setSelected(selected === card.uid ? null : card.uid)
    } else launch(card, null)
  }

  const endTurn = () => {
    if (!isPlayer || busy) return
    setSelected(null)
    setDiscarding(true)
    setTimeout(() => {
      setDiscarding(false)
      onEndTurn()
    }, 380)
  }

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (pile || document.querySelector('.tour')) return
      if (ev.key === 'Escape') setSelected(null)
      if (ev.key === 'e' || ev.key === 'E') endTurn()
      const n = ev.key === '0' ? 10 : parseInt(ev.key, 10)
      if (n >= 1 && n <= c.hand.length) clickCard(c.hand[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const n = c.hand.length
  const hasPlayable = c.hand.some((h) => canPlay(c, h))

  return (
    <div className={`combat ${targeting ? 'is-targeting' : ''} ${screenShake ? 'screen-shake' : ''}`} onContextMenu={(e) => { e.preventDefault(); setSelected(null) }}>
      <div className="battlefield">
        <div className="side player-side">
          <div className="fighter player">
            <Speech c={c} target="player" />
            <div className="sprite-wrap">
              <div key={c.anim.player} className={`sprite ${c.anim.player?.split(' ')[0] ?? ''}`}>
                <Portrait id={portrait} size={200} />
              </div>
              <FxLayer c={c} target="player" />
            </div>
            <Floats c={c} target="player" />
            <div className="fighter-info">
              <div className="fighter-name">You · {heroName}</div>
              <HpBar f={c.player} />
              <Statuses f={c.player} />
            </div>
          </div>
        </div>
        <div className="side enemy-side">
          {c.enemies.map((e) => (
            <EnemyView key={e.uid} e={e} c={c} targeting={targeting} onTarget={() => selectedCard && launch(selectedCard, e.uid)} />
          ))}
        </div>
      </div>

      {targeting && <div className="target-hint">Choose a target · right-click or Esc to cancel</div>}
      {isPlayer && !intro && (
        <div key={`p${c.turn}`} className="turn-banner sweep">
          <span>Your Turn</span>
          <small>Turn {c.turn}</small>
        </div>
      )}
      {c.phase === 'enemy' && (
        <div key={`e${c.turn}`} className="turn-banner sweep enemy">
          <span>Enemy Turn</span>
        </div>
      )}
      {c.phase === 'won' && <div className="turn-banner win">Victory!</div>}
      {c.phase === 'lost' && <div className="turn-banner lose">You have been restructured…</div>}

      {intro && (
        <div className="boss-intro" onClick={() => setIntro(null)}>
          <div className="boss-intro-band">
            <div className="boss-intro-art">
              <Portrait id={intro.defId} size={260} />
            </div>
            <div className="boss-intro-text">
              <div className="overline">Boss encounter</div>
              <h2>{ENEMY[intro.defId].name}</h2>
              {ENEMY[intro.defId].title && <div className="boss-intro-title">{ENEMY[intro.defId].title?.replace('Boss · ', '').replace('Boss', '')}</div>}
              <p>{ENEMY[intro.defId].bio}</p>
            </div>
          </div>
        </div>
      )}

      <div className={`hand-area ${discarding ? 'discarding' : ''}`}>
        <div className="left-controls">
          <div className={`energy-orb ${c.energy === 0 ? 'empty' : ''}`} title="Energy">
            <span className="orb-swirl" aria-hidden />
            <span key={c.energy} className="orb-num">
              {c.energy}/{c.maxEnergy}
            </span>
          </div>
          <button className="pile pile-draw" onClick={() => setPile('draw')} title="Draw pile">
            🂠 <b>{c.draw.length}</b>
          </button>
        </div>
        <div className="hand">
          {c.hand.map((card, i) => {
            const mid = (n - 1) / 2
            const off = i - mid
            const rot = off * Math.min(5, 26 / Math.max(1, n))
            const lift = Math.abs(off) * Math.abs(off) * 2
            const hidden = flying?.card.uid === card.uid
            return (
              <div
                key={card.uid}
                className={`hand-slot ${selected === card.uid ? 'sel' : ''} ${shake === card.uid ? 'shake' : ''} ${hidden ? 'launched' : ''}`}
                style={{ ['--rot' as string]: `${rot}deg`, ['--lift' as string]: `${lift}px`, ['--i' as string]: i, ['--off' as string]: off, zIndex: selected === card.uid ? 50 : i, marginLeft: i === 0 ? 0 : n > 7 ? -52 : -26 }}
              >
                <Card
                  uid={card.uid}
                  id={card.id}
                  upgraded={card.upgraded}
                  playable={isPlayer && canPlay(c, card)}
                  selected={selected === card.uid}
                  onClick={() => clickCard(card)}
                  hotkey={i < 10 ? (i + 1) % 10 : undefined}
                  tips={off > 0 ? 'left' : 'right'}
                />
              </div>
            )
          })}
        </div>
        <div className="right-controls">
          <button className={`btn end-turn ${isPlayer && !hasPlayable && !busy ? 'pulse-btn' : ''}`} disabled={!isPlayer || busy} onClick={endTurn}>
            End Turn <kbd>E</kbd>
          </button>
          <div className="piles">
            <button className="pile pile-discard" onClick={() => setPile('discard')} title="Discard pile">
              🗑️ <b key={c.discard.length}>{c.discard.length}</b>
            </button>
            <button className="pile" onClick={() => setPile('exhaust')} title="Exhausted">
              🔥 <b>{c.exhaust.length}</b>
            </button>
          </div>
        </div>
      </div>

      {flying && (
        <div
          className={`flying-card fly-${flying.kind} ${flying.go ? 'go' : ''}`}
          style={{
            left: flying.from.left,
            top: flying.from.top,
            width: flying.from.width,
            ['--tx' as string]: `${flying.to.x - (flying.from.left + flying.from.width / 2)}px`,
            ['--ty' as string]: `${flying.to.y - (flying.from.top + flying.from.height / 2)}px`,
            transitionDuration: `${FLY_MS}ms`,
          }}
        >
          <Card id={flying.card.id} upgraded={flying.card.upgraded} tips="none" />
        </div>
      )}

      {pile && (
        <DeckModal
          title={pile === 'draw' ? 'Draw pile (random order)' : pile === 'discard' ? 'Discard pile' : 'Exhausted'}
          cards={c[pile]}
          onClose={() => setPile(null)}
        />
      )}
    </div>
  )
}
