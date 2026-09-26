import { describeOkr, okrProgress } from '../game/okrs'
import { fmtNum } from '../game/tokens'
import type { Run } from '../game/types'
import './run.css'

/** Top-bar OKR progress. Glows gold when the objective is complete. */
export function OkrChip({ run }: { run: Run }) {
  const p = okrProgress(run)
  if (!run.okr || !p) return null
  const o = describeOkr(run.okr.id, run.okr.act)
  const pct = Math.min(100, (p.current / p.target) * 100)
  const big = p.target >= 1000
  return (
    <span className={`okr-chip ${p.done ? 'done' : ''} ${p.claimed ? 'claimed' : ''}`} tabIndex={0} aria-label={`OKR ${o.title}: ${p.current} of ${p.target}`}>
      <span>{o.icon}</span>
      <span className="okr-bar">
        <i style={{ width: `${pct}%` }} />
      </span>
      <b>{p.done ? '✔' : big ? `${fmtNum(p.current)}/${fmtNum(p.target)}` : `${p.current}/${p.target}`}</b>
      <span className="tip">
        <b>
          OKR · {o.title}
        </b>
        <br />
        {o.desc}
        <br />
        <span className="muted">Reward: {o.reward}</span>
        {p.claimed && (
          <>
            <br />✔ Completed and claimed
          </>
        )}
      </span>
    </span>
  )
}
