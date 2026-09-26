import { nextPerk, PERK, perkSlots, perksFor, reviewAvailable } from '../../meta/career'
import type { CharId } from '../../game/types'
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

/** Onboarding perk picker: perks are earned per character by winning with them; career levels add slots. */
export function PerkPicker({ character, value, onChange }: { character: CharId; value: string[]; onChange: (v: string[]) => void }) {
  const perks = perksFor(character)
  const slots = perkSlots()
  const next = nextPerk(character)
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id))
    else onChange(slots === 1 ? [id] : [...value, id].slice(-slots))
  }
  return (
    <div className="picker">
      <span className="overline">
        Onboarding perks · pick {slots === 1 ? '1' : `up to ${slots}`}
      </span>
      {perks.length === 0 ? (
        <span className="muted small">Win a run as this character to earn their first onboarding perk{next ? ` (${next.icon} ${next.name})` : ''}.</span>
      ) : (
        <>
          <div className="perk-row">
            {perks.map((p) => (
              <button key={p.id} className={`perk ${value.includes(p.id) ? 'on' : ''}`} onClick={() => toggle(p.id)} title={p.desc}>
                <span className="perk-icon">{p.icon}</span>
                <b>{p.name}</b>
              </button>
            ))}
            {next && (
              <span className="perk locked" title={`Win again to unlock: ${next.desc}`}>
                <span className="perk-icon">🔒</span>
                <b>Next win</b>
              </span>
            )}
          </div>
          <span className="muted small">{value.length ? value.map((id) => PERK[id].desc).join(' · ') : 'No perk selected.'}</span>
        </>
      )}
    </div>
  )
}
