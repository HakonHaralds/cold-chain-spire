import type { CSSProperties } from 'react'
import type { Combat, Fx } from '../game/types'

/** Deterministic pseudo-random from an fx id so re-renders don't reshuffle particles. */
const r = (seed: number, i: number) => {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function Particles({ f, n, cls, spread = 90, rise = 0 }: { f: Fx; n: number; cls: string; spread?: number; rise?: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const a = r(f.id, i) * Math.PI * 2
        const d = spread * (0.4 + r(f.id, i + 50) * 0.6)
        const style = {
          '--dx': `${Math.cos(a) * d}px`,
          '--dy': `${Math.sin(a) * d - rise}px`,
          '--s': 0.5 + r(f.id, i + 99) * 0.9,
          animationDelay: `${r(f.id, i + 7) * 0.12}s`,
        } as CSSProperties
        return <span key={i} className={`pt ${cls}`} style={style} />
      })}
    </>
  )
}

function FxItem({ f }: { f: Fx }) {
  switch (f.kind) {
    case 'slash':
      return (
        <div className={`fx fx-slash ${f.big ? 'big' : ''}`} style={{ '--rot': `${-35 + r(f.id, 1) * 30}deg` } as CSSProperties}>
          <svg viewBox="-100 -100 200 200">
            <path d="M-90,8 Q0,-14 90,-4 Q0,-2 -90,8 Z" fill="#fff" />
            <path d="M-80,4 Q0,-10 80,-3" stroke="#bff5ef" strokeWidth="3" fill="none" />
          </svg>
          <Particles f={f} n={f.big ? 16 : 9} cls="spark" spread={f.big ? 130 : 80} />
        </div>
      )
    case 'claw':
      return (
        <div className={`fx fx-claw ${f.big ? 'big' : ''}`}>
          <svg viewBox="-100 -100 200 200">
            {[-28, 0, 28].map((o) => (
              <path key={o} d={`M${o - 40},-70 Q${o},0 ${o + 36},72`} stroke="#ff4d4d" strokeWidth="9" strokeLinecap="round" fill="none" />
            ))}
          </svg>
          <Particles f={f} n={f.big ? 14 : 8} cls="blood" spread={f.big ? 120 : 70} />
        </div>
      )
    case 'blockhit':
      return (
        <div className="fx fx-blockhit">
          <Particles f={f} n={10} cls="shard" spread={90} />
        </div>
      )
    case 'shield':
      return (
        <div className="fx fx-shield">
          <svg viewBox="-60 -70 120 140">
            <path d="M0,-60 L50,-40 L46,10 Q36,48 0,64 Q-36,48 -46,10 L-50,-40 Z" fill="rgba(105,168,255,0.28)" stroke="#9cc7ff" strokeWidth="4" />
            <path d="M0,-44 L34,-30 L31,6 Q24,34 0,46" stroke="#e6f1ff" strokeWidth="3" fill="none" opacity="0.7" />
          </svg>
        </div>
      )
    case 'buff':
      return (
        <div className="fx fx-buff">
          <div className="ring gold" />
          <Particles f={f} n={10} cls="spark gold up" spread={40} rise={90} />
        </div>
      )
    case 'debuff':
      return (
        <div className="fx fx-debuff">
          <div className="swirl" />
          <Particles f={f} n={8} cls="spark purple down" spread={50} rise={-60} />
        </div>
      )
    case 'heal':
      return (
        <div className="fx fx-heal">
          <Particles f={f} n={12} cls="plus" spread={60} rise={100} />
        </div>
      )
    case 'heat':
      return (
        <div className="fx fx-heat">
          <Particles f={f} n={12} cls="ember" spread={50} rise={110} />
        </div>
      )
    case 'death':
      return (
        <div className="fx fx-death">
          <div className="flash" />
          <Particles f={f} n={26} cls="dust" spread={170} rise={30} />
        </div>
      )
  }
}

export function FxLayer({ c, target }: { c: Combat; target: string }) {
  return (
    <div className="fx-layer" aria-hidden>
      {c.fx
        .filter((f) => f.target === target)
        .map((f) => (
          <FxItem key={f.id} f={f} />
        ))}
    </div>
  )
}
