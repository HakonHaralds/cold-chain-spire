import { useState } from 'react'
import { Portrait } from '../art/Portraits'
import { CHARACTERS } from '../game/characters'
import { RELIC } from '../game/relics'
import type { CharId } from '../game/types'
import { Card } from './Card'

export function CharSelect({ onPick, onBack }: { onPick: (id: CharId) => void; onBack: () => void }) {
  const ids = Object.keys(CHARACTERS) as CharId[]
  const [sel, setSel] = useState<CharId>(ids[0])
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
              onDoubleClick={() => onPick(id)}
              aria-pressed={sel === id}
            >
              <span className="cs-glow" aria-hidden />
              <Portrait id={c.portrait} size={210} />
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
            <span>🪙 99 gold</span>
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
      <div className="actions">
        <button className="btn ghost" onClick={onBack}>
          Back
        </button>
        <button className="btn primary big" onClick={() => onPick(sel)}>
          Clock in as {ch.name}
        </button>
      </div>
    </div>
  )
}
