import { PERK, reviewAvailable, unlockedPerks } from '../../meta/career'
import { REVIEW_LEVELS } from '../../meta/review'
import './meta.css'

/** Performance Review (difficulty) picker for the character select screen. Hidden until unlocked. */
export function ReviewPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const max = reviewAvailable()
  if (max === 0) return null
  return (
    <div className="picker">
      <span className="overline">Performance Review</span>
      <div className="review-pills" role="radiogroup" aria-label="Performance Review level">
        {Array.from({ length: max + 1 }, (_, i) => (
          <button key={i} role="radio" aria-checked={value === i} className={`pill ${value === i ? 'on' : ''}`} onClick={() => onChange(i)} title={i ? REVIEW_LEVELS[i - 1].desc : 'Standard difficulty'}>
            {i === 0 ? 'Off' : i}
          </button>
        ))}
      </div>
      <div className="review-mods">
        {value === 0 ? (
          <span className="muted small">Standard difficulty.</span>
        ) : (
          REVIEW_LEVELS.slice(0, value).map((r) => (
            <span key={r.level} className="small">
              {r.icon} <b>{r.name}</b>: {r.desc}
            </span>
          ))
        )}
      </div>
    </div>
  )
}

/** Onboarding perk picker (career unlocks). Hidden until the first perk is unlocked. */
export function PerkPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const perks = unlockedPerks()
  if (!perks.length) return null
  return (
    <div className="picker">
      <span className="overline">Onboarding perk</span>
      <div className="perk-row">
        <button className={`perk ${value === null ? 'on' : ''}`} onClick={() => onChange(null)}>
          <span className="perk-icon">🚫</span>
          <b>None</b>
        </button>
        {perks.map((p) => (
          <button key={p.id} className={`perk ${value === p.id ? 'on' : ''}`} onClick={() => onChange(p.id)} title={p.desc}>
            <span className="perk-icon">{p.icon}</span>
            <b>{p.name}</b>
          </button>
        ))}
      </div>
      {value && <span className="muted small">{PERK[value].desc}</span>}
    </div>
  )
}
