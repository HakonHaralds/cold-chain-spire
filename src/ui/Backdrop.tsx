import type { CSSProperties } from 'react'

const AMBIENT: Record<number, { n: number; col: string; size: [number, number]; dur: [number, number]; rise?: boolean }> = {
  0: { n: 40, col: '#e6fbff', size: [2, 5], dur: [9, 18] }, // snow
  1: { n: 26, col: 'rgba(255,240,200,0.55)', size: [2, 4], dur: [14, 26] }, // warehouse dust
  2: { n: 14, col: 'rgba(255,255,255,0.35)', size: [2, 3], dur: [18, 30] },
  3: { n: 18, col: 'rgba(255,215,140,0.45)', size: [2, 4], dur: [16, 28] },
  4: { n: 30, col: '#ffb347', size: [2, 5], dur: [6, 12], rise: true }, // embers
}

function Ambient({ act }: { act: number }) {
  const a = AMBIENT[act] ?? AMBIENT[1]
  return (
    <div className={`ambient ${a.rise ? 'rise' : ''}`}>
      {Array.from({ length: a.n }).map((_, i) => {
        const f = (k: number) => ((i * 9301 + k * 49297) % 233280) / 233280
        const style = {
          left: `${f(1) * 100}%`,
          '--sz': `${a.size[0] + f(2) * (a.size[1] - a.size[0])}px`,
          '--dur': `${a.dur[0] + f(3) * (a.dur[1] - a.dur[0])}s`,
          '--delay': `${-f(4) * a.dur[1]}s`,
          '--drift': `${(f(5) - 0.5) * 200}px`,
          '--col': a.col,
        } as CSSProperties
        return <i key={i} style={style} />
      })}
    </div>
  )
}

/** Layered SVG scenery for each act. Purely decorative. */
export function Backdrop({ act }: { act: number }) {
  return (
    <div className={`backdrop bg-${act}`} aria-hidden>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
        {act === 0 && <TitleScene />}
        {act === 1 && <Warehouse />}
        {act === 2 && <Office />}
        {act === 3 && <Boardroom />}
        {act === 4 && <Mine />}
      </svg>
      <Ambient act={act} />
    </div>
  )
}

function TitleScene() {
  return (
    <g>
      {Array.from({ length: 60 }).map((_, i) => (
        <circle key={i} cx={(i * 263) % 1600} cy={(i * 131) % 520} r={1 + (i % 3)} fill="#bff5ef" opacity={0.2 + (i % 5) * 0.12} className="twinkle" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />
      ))}
      <path d="M0,900 L0,700 L180,560 L320,640 L520,420 L700,600 L800,300 L900,600 L1080,420 L1280,640 L1420,560 L1600,700 L1600,900 Z" fill="#0b2340" />
      <path d="M800,300 L760,380 L800,360 L840,380 Z" fill="#dff6ff" opacity="0.8" />
      <path d="M0,900 L0,780 L260,700 L520,760 L800,690 L1080,760 L1340,700 L1600,780 L1600,900 Z" fill="#071a30" />
    </g>
  )
}

function Warehouse() {
  const shelf = (x: number, k: number) => (
    <g key={k} transform={`translate(${x},0)`}>
      <rect x="0" y="260" width="12" height="520" fill="#3a4a5c" />
      <rect x="248" y="260" width="12" height="520" fill="#3a4a5c" />
      {[380, 520, 660].map((y) => (
        <g key={y}>
          <rect x="0" y={y} width="260" height="10" fill="#e07020" opacity="0.8" />
          {[0, 1, 2].map((b) => (
            <g key={b}>
              <rect x={18 + b * 78} y={y - 70 + ((b + k) % 2) * 16} width="68" height={70 - ((b + k) % 2) * 16} fill="#b88a5a" stroke="#8a6238" strokeWidth="2" />
              <path d={`M${18 + b * 78},${y - 40} l68,0`} stroke="#d8b484" strokeWidth="6" opacity="0.6" />
              {(b + k) % 3 === 0 && <text x={52 + b * 78} y={y - 18} fontSize="16" textAnchor="middle" fill="#5a3a18">❄</text>}
            </g>
          ))}
        </g>
      ))}
    </g>
  )
  return (
    <g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x={120 + i * 260} y="0" width="120" height="30" fill="#f6f2d0" opacity="0.28" />
          <path d={`M${120 + i * 260},30 L${60 + i * 260},400 L${300 + i * 260},400 L${240 + i * 260},30 Z`} fill="#f6f2d0" opacity="0.04" />
        </g>
      ))}
      {[40, 380, 1080, 1340].map((x, i) => shelf(x, i))}
      <rect x="0" y="780" width="1600" height="120" fill="#2a3440" />
      <path d="M0,800 L1600,800" stroke="#f2c230" strokeWidth="8" strokeDasharray="60 40" opacity="0.6" />
    </g>
  )
}

function Office() {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={60 + i * 310} y="120" width="260" height="360" fill="#9fc3e6" opacity="0.25" stroke="#c8d8e8" strokeWidth="6" />
          <path d={`M${190 + i * 310},120 L${190 + i * 310},480 M${60 + i * 310},300 L${320 + i * 310},300`} stroke="#c8d8e8" strokeWidth="4" opacity="0.6" />
          {[0, 1, 2, 3].map((b) => <rect key={b} x={80 + i * 310 + b * 55} y={400 - ((b * 37 + i * 23) % 140)} width="40" height={80 + ((b * 37 + i * 23) % 140)} fill="#6a8aa8" opacity="0.35" />)}
        </g>
      ))}
      <rect x="0" y="560" width="1600" height="340" fill="#39424f" />
      {[100, 520, 940, 1360].map((x) => (
        <g key={x}>
          <rect x={x} y="600" width="220" height="16" fill="#d8d0c0" />
          <rect x={x + 20} y="616" width="8" height="90" fill="#777" />
          <rect x={x + 192} y="616" width="8" height="90" fill="#777" />
          <rect x={x + 60} y="530" width="90" height="62" rx="4" fill="#1c1c24" stroke="#555" strokeWidth="4" />
          <rect x={x + 66} y="536" width="78" height="50" fill="#2d6fb0" opacity="0.7" />
          <rect x={x + 100} y="592" width="10" height="10" fill="#555" />
        </g>
      ))}
      {[40, 1500].map((x) => (
        <g key={x}>
          <rect x={x} y="620" width="60" height="70" rx="6" fill="#b86a3a" />
          <circle cx={x + 30} cy="590" r="44" fill="#3e8a4a" />
          <circle cx={x + 6} cy="560" r="26" fill="#4ea85a" />
          <circle cx={x + 56} cy="560" r="26" fill="#357a40" />
        </g>
      ))}
    </g>
  )
}

function Boardroom() {
  return (
    <g>
      <rect x="0" y="0" width="1600" height="560" fill="#241a18" />
      <rect x="180" y="80" width="1240" height="420" fill="#0f2640" stroke="#6b4a2a" strokeWidth="14" />
      {Array.from({ length: 22 }).map((_, i) => (
        <g key={i}>
          <rect x={200 + i * 56} y={500 - ((i * 71) % 300) - 60} width="44" height={((i * 71) % 300) + 60} fill="#1b3a5c" />
          {Array.from({ length: 6 }).map((__, j) => ((i + j) % 3 === 0 ? <rect key={j} x={208 + i * 56} y={500 - ((i * 71) % 300) - 40 + j * 16} width="8" height="6" fill="#f6d67a" opacity="0.7" /> : null))}
        </g>
      ))}
      <path d="M800,80 L800,500 M180,290 L1420,290" stroke="#6b4a2a" strokeWidth="8" />
      <rect x="0" y="560" width="1600" height="340" fill="#3a1f18" />
      <ellipse cx="800" cy="700" rx="700" ry="90" fill="#5a2e1c" stroke="#7a4a2a" strokeWidth="6" />
      <ellipse cx="800" cy="690" rx="680" ry="78" fill="#6b3a22" />
      {[240, 480, 720, 960, 1200].map((x, i) => (
        <g key={x}>
          <rect x={x} y="640" width="60" height="40" rx="4" fill="#ddd" opacity="0.85" />
          {i % 2 === 0 && <circle cx={x + 90} cy="660" r="12" fill="#fff" opacity="0.8" />}
        </g>
      ))}
    </g>
  )
}

function Mine() {
  return (
    <g>
      <path d="M0,0 L1600,0 L1600,140 Q1500,220 1400,150 Q1300,260 1180,160 Q1060,240 960,150 Q820,260 700,150 Q580,230 460,150 Q320,250 200,150 Q100,220 0,140 Z" fill="#1a1512" />
      {[120, 330, 560, 820, 1040, 1270, 1480].map((x, i) => <path key={x} d={`M${x},150 L${x + 20},${260 + (i % 3) * 50} L${x + 40},150 Z`} fill="#241c16" />)}
      {[100, 300, 1260, 1480].map((x, i) => (
        <g key={x} className="glow-slow" style={{ animationDelay: `${i * 0.7}s` }}>
          <path d={`M${x},780 L${x + 20},${660 - i * 20} L${x + 44},780 Z`} fill="#e6eef6" opacity="0.8" />
          <path d={`M${x + 30},780 L${x + 60},${700 - i * 10} L${x + 80},780 Z`} fill="#cfdbe6" opacity="0.8" />
        </g>
      ))}
      {[200, 800, 1400].map((x) => (
        <g key={x}>
          <rect x={x} y="260" width="14" height="520" fill="#5a3a20" />
          <circle cx={x + 7} cy="300" r="12" fill="#ffb347" className="flicker" />
          <circle cx={x + 7} cy="300" r="60" fill="#ffb347" opacity="0.08" className="flicker" />
        </g>
      ))}
      <rect x="0" y="780" width="1600" height="120" fill="#2a211a" />
      <path d="M0,820 L1600,820 M0,850 L1600,850" stroke="#6a5a4a" strokeWidth="6" />
      {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={i * 56} y="812" width="14" height="46" fill="#4a3a2a" />)}
    </g>
  )
}
