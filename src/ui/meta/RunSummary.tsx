import { useEffect, useState } from 'react'
import type { Run } from '../../game/types'
import { CAREER, levelProgress, PERK, TIER_XP } from '../../meta/career'
import type { RunEndResult } from '../../meta/compendium'
import { REVIEW_LEVELS } from '../../meta/review'
import './meta.css'

/** End-of-run career summary: XP breakdown, animated XP bar, level-ups, unlocks and achievements. */
export function RunSummary({ result, run }: { result: RunEndResult; run: Run }) {
  const [xp, setXp] = useState(result.xpBefore)
  useEffect(() => {
    const start = performance.now()
    const dur = 1800
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur)
      const e = 1 - Math.pow(1 - k, 3)
      setXp(Math.round(result.xpBefore + (result.xpAfter - result.xpBefore) * e))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    const d = setTimeout(() => (raf = requestAnimationFrame(tick)), 500)
    return () => {
      clearTimeout(d)
      cancelAnimationFrame(raf)
    }
  }, [result])
  const p = levelProgress(xp)
  const levelled = p.level > result.levelBefore
  return (
    <div className="run-summary">
      <div className="overline">Career progress · {run.character.toUpperCase()}</div>
      <div className="rs-grid">
        <ul className="rs-lines">
          {result.xpLines.map((l) => (
            <li key={l.label}>
              <span>{l.label}</span>
              <b>+{l.xp}</b>
            </li>
          ))}
          {result.achievementXp > 0 && (
            <li>
              <span>Achievements ({result.achievements.length})</span>
              <b>+{result.achievementXp}</b>
            </li>
          )}
          <li className="rs-total">
            <span>Total</span>
            <b>+{result.xpGained} XP</b>
          </li>
        </ul>
        <div className="rs-level">
          <div key={p.level} className={`rs-title ${levelled ? 'levelup' : ''}`}>
            <span className="muted small">Level {p.level}</span>
            <b>{CAREER[p.level - 1].title}</b>
            {levelled && <span className="rs-promo">PROMOTED!</span>}
          </div>
          <div className="xpbar big">
            <div className="xpfill" style={{ width: `${p.pct * 100}%` }} />
          </div>
          <div className="muted small">{p.needed ? `${p.into} / ${p.needed} XP` : 'Max level'}</div>
        </div>
      </div>
      {(result.newUnlocks.length > 0 || result.newReviewLevel) && (
        <div className="rs-unlocks">
          <div className="overline">New unlocks</div>
          {result.newUnlocks.map((u, i) => (
            <div key={i} className="rs-unlock" style={{ animationDelay: `${2.2 + i * 0.2}s` }}>
              {u.kind === 'perk' ? `${PERK[u.id]?.icon} ${u.label}: ${PERK[u.id]?.desc}` : u.label}
            </div>
          ))}
          {result.newReviewLevel && (
            <div className="rs-unlock" style={{ animationDelay: '2.4s' }}>
              ⚖️ Performance Review {result.newReviewLevel}: {REVIEW_LEVELS[result.newReviewLevel - 1].name}
            </div>
          )}
        </div>
      )}
      {result.achievements.length > 0 && (
        <div className="rs-achs">
          <div className="overline">Achievements this run</div>
          <div className="rs-ach-row">
            {result.achievements.map((a) => (
              <span key={a.id} className={`rs-ach tier-${a.tier}`} title={`${a.desc} (+${TIER_XP[a.tier]} XP)`}>
                {a.icon} {a.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
