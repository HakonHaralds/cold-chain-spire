import { useState } from 'react'
import { Portrait } from '../art/Portraits'
import { CHARACTERS } from '../game/characters'
import { RELIC } from '../game/relics'
import type { CharId } from '../game/types'
import { Card } from './Card'
import { PerkPicker, ReviewPicker } from './meta/Pickers'
import { reviewAvailable } from '../meta/career'

export interface RunOptions {
  reviewLevel: number
  perk: string | null
}

export function CharSelect({ onPick, onBack }: { onPick: (id: CharId, opts: RunOptions) => void; onBack: () => void }) {
  const ids = Object.keys(CHARACTERS) as CharId[]
  const [sel, setSel] = useState<CharId>(ids[0])
  const [review, setReview] = useState(() => Math.min(reviewAvailable(), readPref('ccs-review', 0)))
  const [perk, setPerk] = useState<string | null>(null)
  const go = (id: CharId) => {
    writePref('ccs-review', review)
    onPick(id, { reviewLevel: review, perk })
  }
  const ch = CHARACTERS[sel]
  const signature = [...new Set(ch.deck.filter((id) => id !== 'ping' && id !== 'insulate'))]
  return (
    <div className="charselect">
      <h1 className="cs-title">Choose your engineer</h1>
      <div className="cs-roster">
        {ids.map((id, i) => {
          const c = CHARACTERS[id]
          return (
            <button
              key={id}
              className={`cs-slot ${sel === id ? 'active' : ''}`}
              style={{ ['--accent' as string]: c.color, animationDelay: `${i * 0.1}s` }}
              onClick={() => setSel(id)}
              onDoubleClick={() => go(id)}
              aria-pressed={sel === id}
            >
              <span className="cs-glow" aria-hidden />
              <Portrait id={c.portrait} size={165} />
              <b>{c.name}</b>
              <span className="muted small">{c.title}</span>
            </button>
          )
        })}
      </div>
      <div key={sel} className="cs-detail panel" style={{ ['--accent' as string]: ch.color }}>
        <div className="cs-info">
          <h2>{ch.name}</h2>
          <p>{ch.blurb}</p>
          <div className="cs-stats">
            <span>❤️ {ch.hp} HP</span>
            <span>🪙 99k tokens</span>
          </div>
          <div className="cs-mech">
            <span className="overline">Play style</span>
            <p>{ch.mechanic}</p>
          </div>
          <div className="cs-relic">
            <span className="relic-big">{RELIC[ch.relic]?.icon}</span>
            <span>
              <b>{RELIC[ch.relic]?.name}</b>
              <br />
              <span className="muted small">{RELIC[ch.relic]?.text}</span>
            </span>
          </div>
        </div>
        <div className="cs-cards">
          <span className="overline">Signature cards</span>
          <div className="card-choice">
            {signature.map((id) => (
              <Card key={id} id={id} small tips="above" />
            ))}
          </div>
        </div>
      </div>
      <div className="cs-options">
        <ReviewPicker value={review} onChange={setReview} />
        <PerkPicker value={perk} onChange={setPerk} />
      </div>
      <div className="actions">
        <button className="btn ghost" onClick={onBack}>
          Back
        </button>
        <button className="btn primary big" onClick={() => go(sel)}>
          Clock in as {ch.name}
        </button>
      </div>
    </div>
  )
}

function readPref(key: string, def: number): number {
  try {
    const v = Number(localStorage.getItem(key))
    return Number.isFinite(v) && v >= 0 ? v : def
  } catch {
    return def
  }
}
function writePref(key: string, v: number) {
  try {
    localStorage.setItem(key, String(v))
  } catch {
    /* ignore */
  }
}
