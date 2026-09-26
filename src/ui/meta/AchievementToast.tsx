import { useEffect, type CSSProperties } from 'react'
import type { AchievementDef } from '../../meta/achievements'
import { TIER_XP } from '../../meta/career'
import './meta.css'

const DURATION = 3800

/** Shows queued achievements one at a time as a big banner. Click to dismiss early. */
export function AchievementToasts({ queue, onShift }: { queue: AchievementDef[]; onShift: () => void }) {
  const a = queue[0]
  useEffect(() => {
    if (!a) return
    const t = setTimeout(onShift, DURATION)
    return () => clearTimeout(t)
  }, [a, onShift])
  if (!a) return null
  return (
    <div className="ach-toast-layer" aria-live="polite">
      <button key={a.id} className={`ach-toast tier-${a.tier}`} onClick={onShift} style={{ ['--dur' as string]: `${DURATION}ms` }}>
        <span className="ach-shine" aria-hidden />
        <span className="ach-confetti" aria-hidden>
          {Array.from({ length: 28 }).map((_, i) => (
            <i
              key={i}
              style={
                {
                  '--x': `${Math.cos((i / 28) * Math.PI * 2) * (120 + (i % 5) * 40)}px`,
                  '--y': `${Math.sin((i / 28) * Math.PI * 2) * (60 + (i % 4) * 30) + 40}px`,
                  '--r': `${(i * 47) % 360}deg`,
                  '--c': ['#ffd166', '#5cd6ce', '#ff6b9a', '#8dffb8', '#9cc7ff'][i % 5],
                  animationDelay: `${(i % 6) * 25}ms`,
                } as CSSProperties
              }
            />
          ))}
        </span>
        <span className="ach-icon">{a.icon}</span>
        <span className="ach-body">
          <span className="ach-kicker">
            Achievement unlocked · <b>{a.tier}</b> · +{TIER_XP[a.tier]} XP
          </span>
          <span className="ach-name">{a.name}</span>
          <span className="ach-desc">{a.desc}</span>
        </span>
        {queue.length > 1 && <span className="ach-more">+{queue.length - 1}</span>}
        <span className="ach-timer" aria-hidden />
      </button>
    </div>
  )
}
