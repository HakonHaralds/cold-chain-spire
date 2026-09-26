import { Portrait } from '../art/Portraits'
import { COMPANION, COMPANIONS } from '../game/companions'
import type { Combat } from '../game/types'
import { FxLayer } from './Fx'

/** The companion beside the player in combat: small portrait, level pips, its own floats and speech. */
export function CompanionView({ c }: { c: Combat }) {
  const comp = c.companion
  if (!comp) return null
  const def = COMPANIONS[comp.id]
  if (!def) return null
  const floats = c.floats.filter((f) => f.target === COMPANION)
  return (
    <div className="fighter companion" tabIndex={0} aria-label={`${def.name}, level ${comp.level}`}>
      {c.speech?.target === COMPANION && (
        <div key={c.speech.id} className="speech">
          {c.speech.text}
        </div>
      )}
      <div className="sprite-wrap">
        <div className="sprite companion-sprite">
          <Portrait id={def.portrait} size={96} />
        </div>
        <FxLayer c={c} target={COMPANION} />
      </div>
      <div className="floats">
        {floats.map((f, i) => (
          <span key={f.id} className={`float float-${f.kind}`} style={{ animationDelay: `${(i % 4) * 0.06}s` }}>
            {f.text}
          </span>
        ))}
      </div>
      <div className="companion-info">
        <b>{def.name}</b>
        <span className="pips" aria-hidden>
          {[1, 2, 3].map((n) => (
            <i key={n} className={n <= comp.level ? 'on' : ''} />
          ))}
        </span>
      </div>
      <div className="companion-tip">
        <b>
          {def.name} · Level {comp.level}
        </b>
        <span className="muted small">{def.role}</span>
        <span>{def.levels[comp.level - 1]}</span>
      </div>
    </div>
  )
}
