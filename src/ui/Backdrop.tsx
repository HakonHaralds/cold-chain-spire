import type { CSSProperties } from 'react'

type Amb = { n: number; col: string; size: [number, number]; dur: [number, number]; rise?: boolean; round?: boolean }

const AMBIENT: Record<string, Amb> = {
  title: { n: 40, col: '#e6fbff', size: [2, 5], dur: [9, 18] }, // snow
  m2: { n: 26, col: 'rgba(255,240,200,0.55)', size: [2, 4], dur: [14, 26] }, // warehouse dust
  m4: { n: 18, col: '#ffd27a', size: [1, 3], dur: [4, 8], rise: true }, // solder sparks
  s3: { n: 34, col: 'rgba(240,248,255,0.8)', size: [2, 5], dur: [10, 20] }, // snow past the windows
  wroclaw: { n: 16, col: 'rgba(255,214,150,0.5)', size: [2, 4], dur: [16, 28] }, // warm dust motes
  logipharma: { n: 30, col: '#5cd6ce', size: [2, 5], dur: [8, 16] }, // confetti / glitter
  lov: { n: 20, col: 'rgba(255,200,120,0.7)', size: [2, 3], dur: [12, 22], rise: true }, // candle glints
  mine: { n: 30, col: '#ffb347', size: [2, 5], dur: [6, 12], rise: true }, // embers
}

const BG: Record<string, string> = {
  title: 'radial-gradient(ellipse at 50% 20%, #12406e 0%, #07121f 70%)',
  m2: 'linear-gradient(#1b2530, #10171f)',
  m4: 'linear-gradient(#1a232b, #0b1014)',
  s3: 'linear-gradient(#8fa2b3, #3a4654 60%)',
  wroclaw: 'linear-gradient(#5d6f99, #2a3044 60%)',
  logipharma: 'linear-gradient(#1b1234, #0a0816)',
  lov: 'linear-gradient(#22170f, #0b0705)',
  mine: 'radial-gradient(ellipse at 50% 60%, #3a2a1c, #0e0a07 75%)',
}

const ACT_DEFAULT = ['title', 'm2', 's3', 'logipharma', 'mine']

function Ambient({ setting }: { setting: string }) {
  const a = AMBIENT[setting] ?? AMBIENT.m2
  const confetti = setting === 'logipharma'
  const palette = ['#5cd6ce', '#f2c230', '#e0457b', '#ffffff', '#669ed4']
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
          '--col': confetti ? palette[i % palette.length] : a.col,
          ...(confetti ? { borderRadius: 1, height: `calc(var(--sz) * 0.5)` } : {}),
        } as CSSProperties
        return <i key={i} style={style} />
      })}
    </div>
  )
}

/** Dev override: `?setting=wroclaw` forces a backdrop, handy for previewing scenes. */
const devSetting = () => {
  try {
    return new URLSearchParams(location.search).get('setting')
  } catch {
    return null
  }
}

/** Layered SVG scenery for each setting. Purely decorative. */
export function Backdrop({ act, setting }: { act?: number; setting?: string }) {
  const s = devSetting() ?? setting ?? ACT_DEFAULT[act ?? 0] ?? 'm2'
  return (
    <div className={`backdrop bg-${s}`} style={{ background: BG[s] ?? BG.m2 }} aria-hidden>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
        {s === 'title' && <TitleScene />}
        {s === 'm2' && <Warehouse />}
        {s === 'm4' && <Production />}
        {s === 's3' && <S3Tower />}
        {s === 'wroclaw' && <Wroclaw />}
        {s === 'logipharma' && <LogiPharma />}
        {s === 'lov' && <LovWeek />}
        {s === 'mine' && <Mine />}
      </svg>
      <Ambient setting={s} />
    </div>
  )
}

/** A dark wash over a scene so fighters and UI stay readable. */
const Dim = ({ o = 0.35, col = '#050a14' }: { o?: number; col?: string }) => <rect width="1600" height="900" fill={col} opacity={o} />

/* ------------------------------------------------------------------ */
/* M4: electronics production                                          */
/* ------------------------------------------------------------------ */
function Production() {
  return (
    <g>
      <style>{`
        .m4-belt { animation: m4belt 1.2s linear infinite; }
        @keyframes m4belt { to { stroke-dashoffset: -40; } }
        .m4-board { animation: m4board 9s linear infinite; }
        @keyframes m4board { from { transform: translateX(-200px); } to { transform: translateX(1800px); } }
        .m4-head { animation: m4head 2.4s ease-in-out infinite alternate; }
        @keyframes m4head { from { transform: translateX(0); } to { transform: translateX(150px); } }
        .m4-led { animation: m4led 1.3s steps(2) infinite; }
        .m4-heat { animation: m4heat 2.2s ease-in-out infinite; }
        @keyframes m4led { 50% { opacity: 0.15; } }
        @keyframes m4heat { 50% { opacity: 0.35; } }
      `}</style>
      <defs>
        <linearGradient id="m4-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#26323d" />
          <stop offset="1" stopColor="#151d24" />
        </linearGradient>
        <linearGradient id="m4-mach" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfe4e8" />
          <stop offset="1" stopColor="#9aa4ad" />
        </linearGradient>
        <linearGradient id="m4-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4550" />
          <stop offset="1" stopColor="#1c232a" />
        </linearGradient>
        <radialGradient id="m4-glow">
          <stop offset="0" stopColor="#ff8a2a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff8a2a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* back wall with ribs */}
      <rect width="1600" height="640" fill="url(#m4-wall)" />
      {Array.from({ length: 17 }).map((_, i) => (
        <rect key={i} x={i * 100} y="0" width="6" height="640" fill="#0f151a" opacity="0.6" />
      ))}
      {/* ceiling lights */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={120 + i * 380} y="30" width="220" height="12" rx="4" fill="#eaf6ff" opacity="0.85" />
          <path d={`M${120 + i * 380},42 L${60 + i * 380},330 L${400 + i * 380},330 L${340 + i * 380},42 Z`} fill="#dff4ff" opacity="0.05" />
        </g>
      ))}
      {/* signs */}
      <rect x="640" y="90" width="320" height="60" rx="6" fill="#0c1a26" stroke="#5cd6ce" strokeWidth="3" />
      <text x="800" y="131" fontSize="30" textAnchor="middle" fill="#5cd6ce" fontWeight="900" letterSpacing="4">M4 · PRODUCTION</text>
      {[210, 1300].map((x) => (
        <g key={x}>
          <rect x={x} y="100" width="120" height="56" rx="4" fill="#f2c230" />
          <circle cx={x + 26} cy="128" r="16" fill="#1a1a1a" />
          <path d={`M${x + 26},116 l6,12 h-12 z`} fill="#f2c230" />
          <text x={x + 76} y="124" fontSize="12" textAnchor="middle" fill="#1a1a1a" fontWeight="900">ESD</text>
          <text x={x + 76} y="140" fontSize="10" textAnchor="middle" fill="#1a1a1a" fontWeight="700">PROTECTED</text>
        </g>
      ))}
      {/* test racks, left and right, full of blinking loggers */}
      {[20, 1360].map((x, r) => (
        <g key={x}>
          <rect x={x} y="200" width="220" height="440" fill="#1a232b" stroke="#394652" strokeWidth="4" />
          {Array.from({ length: 6 }).map((_, row) => (
            <g key={row}>
              <rect x={x + 6} y={240 + row * 66} width="208" height="6" fill="#394652" />
              {Array.from({ length: 6 }).map((__, col) => (
                <g key={col}>
                  <rect x={x + 14 + col * 34} y={206 + row * 66} width="26" height="34" rx="4" fill="#003865" stroke="#5cd6ce" strokeWidth="1.5" />
                  <circle
                    cx={x + 27 + col * 34}
                    cy={214 + row * 66}
                    r="3"
                    fill={(row + col + r) % 5 === 0 ? '#ff5a5a' : '#6dff9e'}
                    className="m4-led"
                    style={{ animationDelay: `${((row * 7 + col * 3 + r) % 10) * 0.13}s` }}
                  />
                </g>
              ))}
            </g>
          ))}
        </g>
      ))}
      {/* SMT line */}
      <g>
        {/* pick-and-place */}
        <rect x="300" y="300" width="340" height="230" rx="10" fill="url(#m4-mach)" stroke="#5c6670" strokeWidth="3" />
        <rect x="330" y="330" width="280" height="120" rx="6" fill="#0f1a24" opacity="0.9" />
        <rect x="340" y="360" width="260" height="8" fill="#6b7580" />
        <g className="m4-head">
          <rect x="360" y="352" width="44" height="30" rx="3" fill="#2f62b7" />
          <rect x="378" y="382" width="8" height="30" fill="#c0c8d0" />
        </g>
        <rect x="330" y="470" width="120" height="36" rx="4" fill="#1b2733" />
        <text x="390" y="494" fontSize="14" textAnchor="middle" fill="#6dff9e" fontFamily="monospace">RUN 98%</text>
        <circle cx="600" cy="488" r="10" fill="#6dff9e" className="m4-led" />
        {/* reflow oven */}
        <rect x="690" y="340" width="520" height="190" rx="10" fill="url(#m4-mach)" stroke="#5c6670" strokeWidth="3" />
        <rect x="720" y="380" width="460" height="70" rx="6" fill="#2a120a" />
        <rect x="720" y="380" width="460" height="70" rx="6" fill="url(#m4-glow)" className="m4-heat" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <text key={i} x={760 + i * 76} y="480" fontSize="12" textAnchor="middle" fill="#3a2a1a" fontFamily="monospace" fontWeight="700">
            {[150, 180, 217, 245, 217, 120][i]}°C
          </text>
        ))}
        <text x="950" y="515" fontSize="14" textAnchor="middle" fill="#3a2a1a" fontWeight="900" letterSpacing="3">REFLOW</text>
        {/* AOI */}
        <rect x="1240" y="320" width="100" height="210" rx="8" fill="url(#m4-mach)" stroke="#5c6670" strokeWidth="3" />
        <rect x="1252" y="340" width="76" height="56" fill="#0f1a24" />
        <path d="M1258,380 l14,-10 l12,6 l16,-18 l14,8" stroke="#6dff9e" strokeWidth="2" fill="none" />
        {/* conveyor */}
        <rect x="0" y="540" width="1600" height="18" fill="#2c3440" />
        <line x1="0" y1="549" x2="1600" y2="549" stroke="#56606b" strokeWidth="6" strokeDasharray="20 20" className="m4-belt" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} className="m4-board" style={{ animationDelay: `${-i * 2.25}s` }}>
            <rect x="0" y="528" width="90" height="14" rx="2" fill="#1f7a3a" stroke="#0f4a22" />
            <rect x="12" y="530" width="16" height="8" fill="#222" />
            <rect x="40" y="531" width="10" height="7" fill="#c9a227" />
            <rect x="60" y="530" width="18" height="8" fill="#222" />
          </g>
        ))}
      </g>
      {/* floor */}
      <rect x="0" y="640" width="1600" height="260" fill="url(#m4-floor)" />
      <rect x="0" y="560" width="1600" height="80" fill="#222b33" />
      <path d="M0,700 L1600,700" stroke="#f2c230" strokeWidth="8" opacity="0.7" />
      <path d="M0,860 L1600,860" stroke="#f2c230" strokeWidth="8" opacity="0.5" />
      {[180, 1180].map((x) => (
        <rect key={x} x={x} y="720" width="240" height="120" rx="6" fill="#1f3b73" opacity="0.55" />
      ))}
      <Dim o={0.3} col="#050a14" />
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* S3: the office tower in Kópavogur                                   */
/* ------------------------------------------------------------------ */
function S3Tower() {
  const roofs = ['#b8433b', '#2f62b7', '#e8e4d8', '#3d8a5a', '#c9a227', '#7a4a8a', '#d86a3a']
  return (
    <g>
      <defs>
        <linearGradient id="s3-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8b8c6" />
          <stop offset="1" stopColor="#d8dee3" />
        </linearGradient>
        <linearGradient id="s3-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="s3-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b4450" />
          <stop offset="1" stopColor="#1e242c" />
        </linearGradient>
      </defs>
      {/* view outside */}
      <rect x="0" y="40" width="1600" height="520" fill="url(#s3-sky)" />
      {/* Esja: long flat-topped mountain with snow gullies */}
      <path d="M-20,360 L120,300 L260,270 L420,262 L600,250 L780,258 L920,244 L1100,262 L1260,280 L1420,300 L1620,340 L1620,420 L-20,420 Z" fill="#6f7f8f" />
      {Array.from({ length: 26 }).map((_, i) => {
        const x = 90 + i * 52 + ((i * 13) % 20)
        const top = 262 + Math.abs(800 - x) * 0.04
        return <path key={i} d={`M${x},${top} q${-6 - (i % 3) * 4},${22 + (i % 4) * 8} ${-14 - (i % 2) * 6},${46 + (i % 3) * 12}`} stroke="#e8eef3" strokeWidth={3 + (i % 3)} strokeLinecap="round" fill="none" opacity="0.7" />
      })}
      <path d="M100,300 L420,266 L780,262 L1100,266 L1420,300" stroke="#e8eef3" strokeWidth="5" fill="none" opacity="0.55" />
      <path d="M-20,300 L1620,300 L1620,420 L-20,420 Z" fill="#aab8c4" opacity="0.18" />
      {/* the bay */}
      <rect x="0" y="400" width="1600" height="40" fill="#5f7384" />
      <path d="M0,412 L1600,412 M0,426 L1600,426" stroke="#8ea2b2" strokeWidth="2" opacity="0.5" />
      {/* Kópavogur rooftops */}
      {Array.from({ length: 34 }).map((_, i) => {
        const x = i * 50 - 10
        const h = 30 + ((i * 37) % 50)
        const y = 520 - h
        return (
          <g key={i}>
            <rect x={x} y={y} width="46" height={h + 40} fill={i % 4 === 0 ? '#e9e6dc' : '#cfd4d8'} />
            <path d={`M${x - 3},${y} L${x + 23},${y - 18} L${x + 49},${y} Z`} fill={roofs[i % roofs.length]} />
            <rect x={x + 8} y={y + 12} width="10" height="10" fill="#f6d67a" opacity={i % 3 === 0 ? 0.8 : 0.25} />
            <rect x={x + 28} y={y + 12} width="10" height="10" fill="#f6d67a" opacity={i % 5 === 0 ? 0.8 : 0.25} />
          </g>
        )
      })}
      {/* Kópavogskirkja on its hill */}
      <path d="M1180,470 Q1230,430 1280,470 Z" fill="#c9ced3" />
      <path d="M1205,470 Q1230,400 1255,470 Z" fill="#f2f2ee" stroke="#9aa4ad" strokeWidth="2" />
      <path d="M1215,470 Q1230,420 1245,470" stroke="#9aa4ad" strokeWidth="2" fill="none" />
      {/* curtain wall mullions */}
      <rect x="0" y="40" width="1600" height="520" fill="url(#s3-glass)" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <rect key={i} x={i * 200 - 6} y="40" width="12" height="520" fill="#2a323c" />
      ))}
      <rect x="0" y="290" width="1600" height="8" fill="#2a323c" />
      <rect x="0" y="0" width="1600" height="44" fill="#1f262e" />
      <rect x="0" y="552" width="1600" height="16" fill="#2a323c" />
      {/* pendant lamps */}
      {[260, 800, 1340].map((x) => (
        <g key={x}>
          <line x1={x} y1="44" x2={x} y2="120" stroke="#111" strokeWidth="2" />
          <path d={`M${x - 40},150 Q${x},100 ${x + 40},150 Z`} fill="#1c1c1c" />
          <ellipse cx={x} cy="150" rx="40" ry="6" fill="#fff4d0" opacity="0.8" />
        </g>
      ))}
      {/* floor + desks */}
      <rect x="0" y="568" width="1600" height="332" fill="url(#s3-floor)" />
      {[70, 1250].map((x) => (
        <g key={x}>
          <rect x={x} y="600" width="260" height="16" fill="#e2dccf" />
          <rect x={x + 20} y="616" width="8" height="90" fill="#6b7580" />
          <rect x={x + 232} y="616" width="8" height="90" fill="#6b7580" />
          <rect x={x + 50} y="530" width="90" height="62" rx="4" fill="#15181e" stroke="#444" strokeWidth="4" />
          <rect x={x + 56} y="536" width="78" height="50" fill="#2d6fb0" opacity="0.7" />
          <rect x={x + 160} y="548" width="80" height="48" rx="3" fill="#15181e" stroke="#444" strokeWidth="3" />
          <rect x={x + 90} y="592" width="10" height="10" fill="#555" />
        </g>
      ))}
      {/* whiteboard on a column */}
      <rect x="720" y="590" width="160" height="104" rx="4" fill="#f4f4f0" opacity="0.9" />
      <text x="800" y="616" fontSize="16" textAnchor="middle" fill="#2f62b7" fontWeight="900">OKRs Q3</text>
      <path d="M736,632 h90 M736,650 h70 M736,668 h110" stroke="#c33" strokeWidth="3" />
      <rect x="560" y="570" width="60" height="30" rx="4" fill="#003865" stroke="#5cd6ce" strokeWidth="2" />
      <text x="590" y="591" fontSize="16" textAnchor="middle" fill="#5cd6ce" fontWeight="900">S3</text>
      {/* plant */}
      <rect x="1520" y="640" width="54" height="64" rx="6" fill="#8a5a3a" />
      <circle cx="1547" cy="612" r="40" fill="#3e8a4a" />
      <circle cx="1522" cy="586" r="24" fill="#4ea85a" />
      <Dim o={0.42} col="#0a1420" />
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Wrocław office overlooking the Rynek                                */
/* ------------------------------------------------------------------ */
function Wroclaw() {
  const facades = ['#e8b04a', '#d86a5a', '#7fb3a8', '#e7d9b0', '#b07ac2', '#f0a0a0', '#8ab0e0', '#e8c7a0', '#9fcf8a']
  return (
    <g>
      <defs>
        <linearGradient id="wr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d4f7a" />
          <stop offset="0.6" stopColor="#c98a6a" />
          <stop offset="1" stopColor="#f0b98a" />
        </linearGradient>
        <linearGradient id="wr-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3a26" />
          <stop offset="1" stopColor="#2a1a10" />
        </linearGradient>
        <clipPath id="wr-win">
          {[140, 620, 1100].map((x) => (
            <path key={x} d={`M${x},560 L${x},220 Q${x + 180},80 ${x + 360},220 L${x + 360},560 Z`} />
          ))}
        </clipPath>
      </defs>
      {/* brick wall */}
      <rect width="1600" height="620" fill="#5a2e22" />
      {Array.from({ length: 24 }).map((_, r) => (
        <g key={r}>
          {Array.from({ length: 34 }).map((__, c) => (
            <rect key={c} x={c * 50 + (r % 2) * 25 - 25} y={r * 26} width="46" height="22" fill={(r * 7 + c * 3) % 5 === 0 ? '#6a3828' : '#633424'} />
          ))}
        </g>
      ))}
      {/* view through arched windows */}
      <g clipPath="url(#wr-win)">
        <rect x="0" y="60" width="1600" height="520" fill="url(#wr-sky)" />
        {/* town hall with gothic spire */}
        <g>
          <path d="M760,120 L775,210 L745,210 Z" fill="#3a3040" />
          <rect x="735" y="210" width="50" height="120" fill="#6a5a5a" />
          <path d="M700,330 L820,330 L790,260 L730,260 Z" fill="#7a6a66" />
          <rect x="680" y="330" width="160" height="230" fill="#c9a88a" />
          <path d="M680,330 L700,290 L720,330 L740,290 L760,330 L780,290 L800,330 L820,290 L840,330 Z" fill="#c9a88a" />
          <circle cx="760" cy="240" r="12" fill="#e8d8a0" stroke="#3a3040" strokeWidth="2" />
          {[700, 740, 780, 810].map((x) => (
            <path key={x} d={`M${x},420 v-40 q10,-14 20,0 v40 z`} fill="#3a3040" opacity="0.7" />
          ))}
        </g>
        {/* gabled tenement houses */}
        {Array.from({ length: 20 }).map((_, i) => {
          const x = i * 84 - 20
          if (x > 640 && x < 860) return null
          const h = 190 + ((i * 53) % 70)
          const y = 560 - h
          const col = facades[i % facades.length]
          return (
            <g key={i}>
              <rect x={x} y={y} width="80" height={h} fill={col} />
              <path d={`M${x},${y} L${x + 10},${y - 20} L${x + 20},${y - 20} L${x + 20},${y - 38} L${x + 40},${y - 56} L${x + 60},${y - 38} L${x + 60},${y - 20} L${x + 70},${y - 20} L${x + 80},${y} Z`} fill={col} />
              {Array.from({ length: 4 }).map((__, r) =>
                [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={x + 10 + c * 22} y={y + 14 + r * 40} width="14" height="22" fill="#fbe3a0" opacity={(i + r + c) % 3 === 0 ? 0.9 : 0.35} />),
              )}
            </g>
          )
        })}
        {/* cobbles of the square */}
        <rect x="0" y="520" width="1600" height="60" fill="#8a7a6a" />
        {Array.from({ length: 60 }).map((_, i) => <ellipse key={i} cx={(i * 29) % 1600} cy={530 + (i % 3) * 14} rx="10" ry="4" fill="#6f6255" />)}
      </g>
      {/* window frames */}
      {[140, 620, 1100].map((x) => (
        <g key={x} fill="none" stroke="#e8dcc8" strokeWidth="10">
          <path d={`M${x},560 L${x},220 Q${x + 180},80 ${x + 360},220 L${x + 360},560 Z`} />
          <path d={`M${x + 180},130 L${x + 180},560 M${x},360 L${x + 360},360`} strokeWidth="6" />
        </g>
      ))}
      {/* windowsill with a bronze krasnal (dwarf) */}
      <rect x="1080" y="556" width="400" height="18" fill="#d8cbb4" />
      <g transform="translate(1420,556)">
        <ellipse cx="0" cy="0" rx="16" ry="4" fill="#3a2a1a" />
        <path d="M-10,0 L-10,-20 Q0,-26 10,-20 L10,0 Z" fill="#8a6a3a" />
        <circle cx="0" cy="-28" r="8" fill="#a07c46" />
        <path d="M-9,-31 L0,-52 L9,-31 Z" fill="#7a5a2a" />
        <path d="M-6,-24 Q0,-16 6,-24" fill="#c9a86a" />
      </g>
      {/* floor, desk and pierogi */}
      <rect x="0" y="620" width="1600" height="280" fill="url(#wr-floor)" />
      {Array.from({ length: 16 }).map((_, i) => (
        <rect key={i} x={i * 100} y="620" width="4" height="280" fill="#3a2414" opacity="0.6" />
      ))}
      <rect x="80" y="610" width="280" height="16" fill="#8a6a4a" />
      <rect x="100" y="626" width="10" height="90" fill="#5a3a26" />
      <rect x="330" y="626" width="10" height="90" fill="#5a3a26" />
      <rect x="130" y="542" width="96" height="62" rx="4" fill="#15181e" stroke="#444" strokeWidth="4" />
      <rect x="136" y="548" width="84" height="50" fill="#2d6fb0" opacity="0.7" />
      <ellipse cx="290" cy="604" rx="40" ry="8" fill="#f4f0e6" />
      {[270, 290, 310].map((x) => (
        <path key={x} d={`M${x - 10},602 Q${x},588 ${x + 10},602 Z`} fill="#f0dca0" stroke="#c9a86a" />
      ))}
      <Dim o={0.38} col="#140a08" />
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* LogiPharma convention                                               */
/* ------------------------------------------------------------------ */
function LogiPharma() {
  const booths = [
    { x: 40, col: '#3a2a6a', name: 'PHARMATRANS', sub: 'Moving medicine, slowly' },
    { x: 440, col: '#003865', name: 'CONTROLANT', sub: 'Real-time visibility', teal: true },
    { x: 840, col: '#6a2a3a', name: 'COLDBOX INC.', sub: 'Styrofoam since 1987' },
    { x: 1240, col: '#2a4a3a', name: 'LOGISTIX AI', sub: 'Blockchain-ready' },
  ]
  return (
    <g>
      <style>{`
        .lp-spot { animation: lpspot 6s ease-in-out infinite alternate; transform-box: view-box; }
        @keyframes lpspot { from { transform: rotate(-6deg); } to { transform: rotate(6deg); } }
        .lp-screen { animation: lpscreen 3s steps(3) infinite; }
        @keyframes lpscreen { 33% { opacity: 0.6; } 66% { opacity: 0.85; } }
      `}</style>
      <defs>
        <linearGradient id="lp-carpet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2250" />
          <stop offset="1" stopColor="#120e26" />
        </linearGradient>
        <pattern id="lp-pat" width="60" height="30" patternUnits="userSpaceOnUse">
          <path d="M0,15 L30,0 L60,15 L30,30 Z" fill="none" stroke="#3a3070" strokeWidth="2" />
        </pattern>
      </defs>
      {/* ceiling truss */}
      <rect x="0" y="40" width="1600" height="16" fill="#3a3a44" />
      <rect x="0" y="90" width="1600" height="16" fill="#3a3a44" />
      {Array.from({ length: 40 }).map((_, i) => (
        <path key={i} d={`M${i * 40},56 L${i * 40 + 20},90 L${i * 40 + 40},56`} stroke="#4a4a56" strokeWidth="4" fill="none" />
      ))}
      {/* spotlight cones */}
      {[200, 560, 1040, 1400].map((x, i) => (
        <g key={x} className="lp-spot" style={{ transformOrigin: `${x}px 106px`, animationDelay: `${-i * 1.7}s` }}>
          <circle cx={x} cy="112" r="10" fill="#fff8e0" />
          <path d={`M${x - 8},116 L${x - 170},640 L${x + 170},640 L${x + 8},116 Z`} fill="#fff4d0" opacity="0.06" />
        </g>
      ))}
      {/* hanging banner */}
      <line x1="560" y1="106" x2="560" y2="140" stroke="#888" strokeWidth="2" />
      <line x1="1040" y1="106" x2="1040" y2="140" stroke="#888" strokeWidth="2" />
      <rect x="500" y="140" width="600" height="96" rx="6" fill="#0c1a2a" stroke="#5cd6ce" strokeWidth="4" />
      <text x="800" y="200" fontSize="56" textAnchor="middle" fill="#ffffff" fontWeight="900" letterSpacing="6">LOGIPHARMA</text>
      <text x="800" y="226" fontSize="16" textAnchor="middle" fill="#5cd6ce" letterSpacing="4">SUPPLY CHAIN SUMMIT · EXPO HALL</text>
      {/* booths */}
      {booths.map((b) => (
        <g key={b.x}>
          <rect x={b.x} y="280" width="330" height="260" fill={b.col} stroke={b.teal ? '#5cd6ce' : '#555'} strokeWidth={b.teal ? 5 : 2} />
          <rect x={b.x} y="280" width="330" height="60" fill={b.teal ? '#5cd6ce' : '#ffffff'} opacity={b.teal ? 1 : 0.12} />
          <text x={b.x + 165} y="320" fontSize="26" textAnchor="middle" fill={b.teal ? '#003865' : '#ffffff'} fontWeight="900" letterSpacing="2">
            {b.name}
          </text>
          <text x={b.x + 165} y="366" fontSize="14" textAnchor="middle" fill="#ffffff" opacity="0.8">
            {b.sub}
          </text>
          <rect x={b.x + 95} y="384" width="140" height="80" rx="4" fill="#0c1a2a" stroke="#222" strokeWidth="3" />
          <rect x={b.x + 101} y="390" width="128" height="68" fill={b.teal ? '#5cd6ce' : '#669ed4'} opacity="0.75" className="lp-screen" />
          {b.teal && (
            <g transform={`translate(${b.x + 165},424)`} fill="none" strokeWidth="6" strokeLinecap="round">
              <path d="M-22,10 A24,24 0 0 1 22,10" stroke="#003865" />
              <path d="M-12,14 A14,14 0 0 1 12,14" stroke="#2f62b7" />
            </g>
          )}
          <rect x={b.x + 60} y="490" width="210" height="50" fill="#e8e8f0" />
          <rect x={b.x + 60} y="490" width="210" height="10" fill={b.teal ? '#5cd6ce' : '#aaa'} />
        </g>
      ))}
      {/* crowd silhouettes with lanyards */}
      {Array.from({ length: 22 }).map((_, i) => {
        const x = 30 + i * 74 + ((i * 17) % 20)
        const h = 120 + ((i * 29) % 30)
        return (
          <g key={i} opacity="0.5">
            <circle cx={x} cy={640 - h} r="16" fill="#0d0a1c" />
            <path d={`M${x - 26},640 L${x - 22},${660 - h} Q${x},${646 - h} ${x + 22},${660 - h} L${x + 26},640 Z`} fill="#0d0a1c" />
            <path d={`M${x - 8},${664 - h} L${x},${700 - h} L${x + 8},${664 - h}`} stroke={['#5cd6ce', '#e0457b', '#f2c230'][i % 3]} strokeWidth="2" fill="none" />
            <rect x={x - 5} y={698 - h} width="10" height="13" fill="#ddd" />
          </g>
        )
      })}
      {/* carpet */}
      <rect x="0" y="640" width="1600" height="260" fill="url(#lp-carpet)" />
      <rect x="0" y="640" width="1600" height="260" fill="url(#lp-pat)" opacity="0.6" />
      <Dim o={0.3} col="#06040e" />
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* LOV Week: the banquet hall                                          */
/* ------------------------------------------------------------------ */
function LovWeek() {
  return (
    <g>
      <style>{`
        .lov-chand { animation: lovchand 3s ease-in-out infinite; }
        @keyframes lovchand { 50% { opacity: 0.6; } }
        .lov-slide { animation: lovslide 7s steps(1) infinite; }
        @keyframes lovslide { 50% { opacity: 0.92; } }
      `}</style>
      <defs>
        <linearGradient id="lov-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2418" />
          <stop offset="1" stopColor="#1a0f0a" />
        </linearGradient>
        <linearGradient id="lov-drape" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a1420" />
          <stop offset="0.5" stopColor="#7a1e2c" />
          <stop offset="1" stopColor="#4a1018" />
        </linearGradient>
        <radialGradient id="lov-glow">
          <stop offset="0" stopColor="#ffe0a0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe0a0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lov-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2014" />
          <stop offset="1" stopColor="#140a06" />
        </linearGradient>
      </defs>
      <rect width="1600" height="640" fill="url(#lov-wall)" />
      {/* drapes */}
      {[0, 1440].map((x) => (
        <g key={x}>
          <rect x={x} y="0" width="160" height="640" fill="url(#lov-drape)" />
          {[30, 70, 110].map((o) => (
            <path key={o} d={`M${x + o},0 Q${x + o + 10},320 ${x + o},640`} stroke="#3a0a12" strokeWidth="4" fill="none" opacity="0.6" />
          ))}
        </g>
      ))}
      {/* stage */}
      <rect x="360" y="440" width="880" height="100" fill="#2a1810" />
      <rect x="360" y="440" width="880" height="12" fill="#5a3a24" />
      {/* projector screen with the endless slide deck */}
      <rect x="480" y="80" width="640" height="340" fill="#0a0806" />
      <rect x="490" y="90" width="620" height="320" fill="#f4f2ec" className="lov-slide" />
      <text x="520" y="150" fontSize="38" fill="#003865" fontWeight="900">Q3 STRATEGY</text>
      <rect x="520" y="166" width="140" height="6" fill="#5cd6ce" />
      {[210, 250, 290, 330].map((y, i) => (
        <g key={y}>
          <circle cx="532" cy={y - 6} r="5" fill="#003865" />
          <rect x="548" y={y - 14} width={[380, 300, 420, 260][i]} height="14" rx="3" fill="#b8c4d0" />
        </g>
      ))}
      <path d="M900,330 L960,290 L1000,310 L1070,240" stroke="#2f62b7" strokeWidth="6" fill="none" />
      <text x="1090" y="396" fontSize="18" textAnchor="end" fill="#667" fontWeight="700">1/214</text>
      {/* podium with a tiny speaker silhouette */}
      <rect x="1140" y="360" width="70" height="90" fill="#4a2e1c" stroke="#6a4a30" strokeWidth="3" />
      <circle cx="1175" cy="330" r="14" fill="#140a06" />
      <path d="M1155,362 Q1175,336 1195,362 Z" fill="#140a06" />
      <rect x="1168" y="344" width="4" height="18" fill="#888" />
      {/* chandeliers */}
      {[260, 800, 1340].map((x) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="60" stroke="#8a6a3a" strokeWidth="3" />
          <circle cx={x} cy="90" r="90" fill="url(#lov-glow)" className="lov-chand" />
          <path d={`M${x - 50},78 Q${x},110 ${x + 50},78`} stroke="#c9a227" strokeWidth="4" fill="none" />
          {[-44, -22, 0, 22, 44].map((o) => (
            <g key={o}>
              <rect x={x + o - 2} y="70" width="4" height="10" fill="#f4f0e0" />
              <circle cx={x + o} cy="66" r="4" fill="#ffd27a" />
            </g>
          ))}
        </g>
      ))}
      {/* round tables receding */}
      <rect x="0" y="540" width="1600" height="360" fill="url(#lov-floor)" />
      {[
        { y: 575, r: 70, xs: [140, 420, 1180, 1460] },
        { y: 640, r: 92, xs: [60, 380, 1220, 1540] },
      ].map((row) =>
        row.xs.map((x) => (
          <g key={`${row.y}-${x}`}>
            {[-1, -0.4, 0.4, 1].map((o) => (
              <rect key={o} x={x + o * row.r * 0.95 - 8} y={row.y - row.r * 0.35} width="16" height={row.r * 0.45} rx="4" fill="#2a1a10" />
            ))}
            <ellipse cx={x} cy={row.y} rx={row.r} ry={row.r * 0.28} fill="#f0ece2" />
            <path d={`M${x - row.r},${row.y} Q${x - row.r},${row.y + row.r * 0.55} ${x},${row.y + row.r * 0.55} Q${x + row.r},${row.y + row.r * 0.55} ${x + row.r},${row.y}`} fill="#d8d2c4" />
            <circle cx={x} cy={row.y - 6} r="5" fill="#ffd27a" opacity="0.9" />
            <rect x={x - 2} y={row.y - 22} width="4" height="16" fill="#f4f0e0" />
          </g>
        )),
      )}
      <Dim o={0.18} col="#0a0503" />
    </g>
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
