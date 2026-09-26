import { useState } from 'react'
import { Portrait } from '../art/Portraits'
import { COMPANION_IDS, COMPANIONS, rollCompanions } from '../game/companions'

interface Props {
  onPick: (id: string) => void
  onSkip?: () => void
  isUnlocked: (id: string) => boolean
  /** e.g. "Unlocks at Career level 4"; null hides the locked entry's hint. */
  lockedHint?: (id: string) => string | null
}

/** Pick one coworker to tag along for the run (M6). Offers 3 random unlocked companions. */
export function CompanionSelect({ onPick, onSkip, isUnlocked, lockedHint }: Props) {
  const [options] = useState(() => rollCompanions(isUnlocked, 3))
  const locked = COMPANION_IDS.filter((id) => !isUnlocked(id))
  return (
    <div className="charselect companion-select">
      <h1 className="cs-title">Pick a work buddy</h1>
      <p className="muted">They act once per turn and level up after every boss.</p>
      <div className="cs-roster">
        {options.map((id, i) => {
          const d = COMPANIONS[id]
          return (
            <button key={id} className="cs-slot comp-slot" style={{ ['--accent' as string]: '#5cd6ce', animationDelay: `${i * 0.1}s` }} onClick={() => onPick(id)}>
              <span className="cs-glow" aria-hidden />
              <Portrait id={d.portrait} size={170} />
              <b>{d.name}</b>
              <span className="muted small">{d.role}</span>
              <span className="comp-bio">{d.bio}</span>
              <ol className="comp-levels">
                {d.levels.map((t, n) => (
                  <li key={n}>
                    <span className="lvl">Lv {n + 1}</span> {t}
                  </li>
                ))}
              </ol>
            </button>
          )
        })}
      </div>
      {locked.length > 0 && (
        <div className="comp-locked">
          {locked.map((id) => (
            <span key={id} className="comp-locked-item" title={lockedHint?.(id) ?? 'Locked'}>
              🔒 {COMPANIONS[id].name}
              {lockedHint?.(id) && <small> · {lockedHint(id)}</small>}
            </span>
          ))}
        </div>
      )}
      {onSkip && (
        <div className="actions">
          <button className="btn ghost" onClick={onSkip}>
            Go it alone
          </button>
        </div>
      )}
    </div>
  )
}
