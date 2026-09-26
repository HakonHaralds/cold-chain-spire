import { useEffect, useRef, useState } from 'react'
import { RELIC } from '../game/relics'
import type { CardInst, Run } from '../game/types'
import { Card } from './Card'

type Change = { key: string; kind: 'add' | 'upgrade' | 'remove' | 'relic'; card?: CardInst; relic?: string }

const LABEL: Record<Change['kind'], string> = { add: 'Added to deck', upgrade: 'Upgraded', remove: 'Removed', relic: 'New relic' }
const LIFE_MS = 2300

/**
 * Watches the run's deck and relics and animates every change: new cards pop up and fly into the
 * Deck button, upgrades flash, removals burn away. A new run or a loaded save resets the baseline.
 */
export function DeckChangeFx({ run }: { run: Run | null }) {
  const prev = useRef<{ startedAt: number; deck: Map<string, CardInst>; relics: string[] } | null>(null)
  const [items, setItems] = useState<Change[]>([])
  const [target, setTarget] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!run) {
      prev.current = null
      return
    }
    const deck = new Map(run.deck.map((c) => [c.uid, c]))
    const p = prev.current
    prev.current = { startedAt: run.startedAt, deck, relics: run.relics }
    if (!p || p.startedAt !== run.startedAt) return
    const changes: Change[] = []
    const stamp = Date.now()
    for (const c of run.deck) {
      const old = p.deck.get(c.uid)
      if (!old) changes.push({ key: `a${c.uid}${stamp}`, kind: 'add', card: c })
      else if ((!old.upgraded && c.upgraded) || (!old.rewrite && c.rewrite)) changes.push({ key: `u${c.uid}${stamp}`, kind: 'upgrade', card: c })
    }
    for (const [uid, c] of p.deck) if (!deck.has(uid)) changes.push({ key: `r${uid}${stamp}`, kind: 'remove', card: c })
    for (const r of run.relics) if (!p.relics.includes(r)) changes.push({ key: `l${r}${stamp}`, kind: 'relic', relic: r })
    if (!changes.length) return
    // Aim the fly-away at the Deck button (in the scaled game root's own coordinates).
    const root = document.querySelector('.game-root') as HTMLElement | null
    const btn = document.querySelector('.deck-btn')
    if (root && btn) {
      const rr = root.getBoundingClientRect()
      const br = btn.getBoundingClientRect()
      const s = rr.width / root.offsetWidth
      setTarget({ x: (br.left + br.width / 2 - rr.left) / s - root.offsetWidth / 2, y: (br.top + br.height / 2 - rr.top) / s - root.offsetHeight / 2 })
    }
    setItems((cur) => [...cur, ...changes].slice(-6))
    const keys = new Set(changes.map((c) => c.key))
    setTimeout(() => setItems((cur) => cur.filter((c) => !keys.has(c.key))), LIFE_MS + changes.length * 150)
  }, [run])

  if (!items.length) return null
  return (
    <div className="deckfx" aria-live="polite">
      {items.map((it, i) => (
        <div
          key={it.key}
          className={`deckfx-item deckfx-${it.kind}`}
          style={{ ['--i' as string]: i - (items.length - 1) / 2, ['--tx' as string]: `${target.x}px`, ['--ty' as string]: `${target.y}px`, animationDelay: `${i * 150}ms` }}
        >
          <div className="deckfx-label">{LABEL[it.kind]}</div>
          {it.card && <Card id={it.card.id} upgraded={it.card.upgraded} rewrite={it.card.rewrite} diff={it.kind === 'upgrade'} tips="none" />}
          {it.relic && (
            <div className="deckfx-relic">
              <span className="relic-big">{RELIC[it.relic]?.icon}</span>
              <b>{RELIC[it.relic]?.name}</b>
              <span className="muted small">{RELIC[it.relic]?.text}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
