import { describeOkr } from '../game/okrs'
import './run.css'

/** Screen content for 'okrselect': choose this quarter's objective. */
export function OkrPicker({ act, options, onPick, onSkip }: { act: number; options: string[]; onPick: (id: string) => void; onSkip?: () => void }) {
  return (
    <div className="okr-screen">
      <div className="overline">Quarterly planning · Q{Math.min(act, 4)}</div>
      <h1>Pick your OKR</h1>
      <p className="muted">One objective for this act. Hit it for a bonus. Miss it and nobody will mention it (much).</p>
      <div className="okr-options">
        {options.map((id, i) => {
          const o = describeOkr(id, act)
          return (
            <button key={id} className="okr-card" style={{ animationDelay: `${i * 0.1}s` }} onClick={() => onPick(id)}>
              <span className="okr-icon">{o.icon}</span>
              <h3>{o.title}</h3>
              <p>{o.desc}</p>
              <span className="okr-reward">🎁 {o.reward}</span>
            </button>
          )
        })}
      </div>
      {onSkip && (
        <div className="actions">
          <button className="btn ghost" onClick={onSkip}>
            No OKR this quarter
          </button>
        </div>
      )}
    </div>
  )
}
