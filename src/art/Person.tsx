import { useId, type ReactNode } from 'react'

export type Eyes = 'normal' | 'angry' | 'happy' | 'drunk' | 'closed' | 'beady' | 'wide'
export type Mouth = 'smile' | 'frown' | 'grin' | 'flat' | 'open' | 'smirk' | 'goofy' | 'pursed'
export type Top = 'suit' | 'shirt' | 'hoodie' | 'labcoat' | 'vest' | 'polo' | 'sport' | 'cardigan' | 'fleece'

export interface PersonProps {
  skin?: string
  top?: Top
  topColor?: string
  shirtColor?: string
  tie?: string
  bowtie?: string
  pants?: string
  shoes?: string
  eyes?: Eyes
  mouth?: Mouth
  brows?: 'normal' | 'angry' | 'raised' | 'bushy' | 'worried' | 'none'
  browColor?: string
  glasses?: 'round' | 'square' | 'half' | 'sun'
  blush?: boolean
  wrinkles?: boolean
  stubble?: string
  mustache?: string
  hairBack?: ReactNode
  hairFront?: ReactNode
  hat?: ReactNode
  props?: ReactNode // drawn after body, before head
  front?: ReactNode // drawn last
  slim?: boolean
  armsUp?: 'left' | 'right' | 'both'
  earrings?: string
  iris?: string
}

const darken = (hex: string, amt = 0.2) => {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)))
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)))
  const b = Math.max(0, Math.round((n & 255) * (1 - amt)))
  return `rgb(${r},${g},${b})`
}

function Eye({ x, kind, iris = '#5a3b22' }: { x: number; kind: Eyes; iris?: string }) {
  const y = 70
  switch (kind) {
    case 'happy':
      return <path d={`M${x - 6},${y + 1} Q${x},${y - 6} ${x + 6},${y + 1}`} stroke="#1b1b1b" strokeWidth="3" fill="none" strokeLinecap="round" />
    case 'closed':
      return <path d={`M${x - 6},${y} L${x + 6},${y}`} stroke="#1b1b1b" strokeWidth="3" strokeLinecap="round" />
    case 'drunk':
      return (
        <g>
          <ellipse cx={x} cy={y} rx="7" ry="6" fill="#fff" />
          <path d={`M${x - 7},${y - 1} L${x + 7},${y - 1}`} stroke="#c9606a" strokeWidth="1" />
          <circle cx={x + (x < 100 ? 2 : -2)} cy={y + 1} r="3" fill="#1b1b1b" />
          <path d={`M${x - 8},${y - 1} Q${x},${y - 5} ${x + 8},${y - 1}`} stroke="#a0624a" strokeWidth="3" fill="none" />
        </g>
      )
    case 'beady':
      return (
        <g>
          <ellipse cx={x} cy={y} rx="5" ry="3.2" fill="#f4efe8" />
          <circle cx={x} cy={y} r="2.4" fill="#2a1a10" />
          <path d={`M${x - 6},${y - 2} Q${x},${y - 5} ${x + 6},${y - 2}`} stroke="#2a1a14" strokeWidth="2" fill="none" />
        </g>
      )
    case 'wide':
      return (
        <g>
          <circle cx={x} cy={y} r="7.5" fill="#fff" stroke="#1b1b1b" strokeWidth="1" />
          <circle cx={x} cy={y} r="3.5" fill="#1b1b1b" />
        </g>
      )
    default:
      return (
        <g>
          <path d={`M${x - 7},${y} Q${x},${y - 6.5} ${x + 7},${y} Q${x},${y + 4.5} ${x - 7},${y} Z`} fill="#f6f1ea" />
          <circle cx={x + 0.5} cy={y - 0.3} r="3.4" fill={iris} />
          <circle cx={x + 0.5} cy={y - 0.3} r="1.6" fill="#120a06" />
          <circle cx={x + 1.8} cy={y - 1.6} r="1" fill="#fff" />
          <path d={`M${x - 7.5},${y + 0.5} Q${x},${y - 7.5} ${x + 7.5},${y - 0.5}`} stroke="#2a1a14" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d={`M${x - 5},${y + 3.2} Q${x},${y + 5} ${x + 5},${y + 3}`} stroke="rgba(90,50,40,0.35)" strokeWidth="1" fill="none" />
        </g>
      )
  }
}

function MouthShape({ kind }: { kind: Mouth }) {
  const s = { stroke: '#5a2a24', strokeWidth: 3, fill: 'none', strokeLinecap: 'round' as const }
  switch (kind) {
    case 'smile':
      return (
        <g>
          <path d="M88,88 Q100,97 112,88 Q100,92 88,88 Z" fill="#7a3a34" />
          <path d="M91,91.5 Q100,97.5 109,91.5" stroke="#c07a70" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M88,88 Q100,93 112,88" stroke="#5a2a24" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'grin':
      return (
        <g>
          <path d="M84,86 Q100,104 116,86 Z" fill="#fff" stroke="#5a2a24" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M86,89 L114,89" stroke="#d8d8d8" strokeWidth="1" />
        </g>
      )
    case 'goofy':
      return (
        <g>
          <path d="M86,87 Q102,103 116,84" fill="#7a2c2c" stroke="#5a2a24" strokeWidth="2.5" />
          <ellipse cx="104" cy="94" rx="5" ry="3" fill="#e0707a" />
        </g>
      )
    case 'frown':
      return (
        <g>
          <path d="M89,93 Q100,86 111,93" stroke="#5a2a24" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M92,95.5 Q100,92.5 108,95.5" stroke="#b87a70" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
      )
    case 'open':
      return <ellipse cx="100" cy="91" rx="7" ry="6" fill="#5a2a24" />
    case 'smirk':
      return <path d="M88,90 Q102,93 113,85" {...s} />
    case 'pursed':
      return <ellipse cx="100" cy="90" rx="4" ry="3" fill="none" stroke="#5a2a24" strokeWidth="2.5" />
    default:
      return (
        <g>
          <path d="M90,90 Q100,91 110,90" stroke="#5a2a24" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M93,93 Q100,95 107,93" stroke="#b87a70" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
      )
  }
}

function Brows({ kind, color }: { kind: PersonProps['brows']; color: string }) {
  const s = { stroke: color, strokeWidth: 3.5, strokeLinecap: 'round' as const, fill: 'none' }
  switch (kind) {
    case 'none':
      return null
    case 'angry':
      return (
        <g>
          <path d="M80,58 L95,63" {...s} />
          <path d="M120,58 L105,63" {...s} />
        </g>
      )
    case 'raised':
      return (
        <g>
          <path d="M80,58 Q88,52 95,57" {...s} />
          <path d="M105,57 Q112,52 120,58" {...s} />
        </g>
      )
    case 'worried':
      return (
        <g>
          <path d="M80,62 L95,57" {...s} />
          <path d="M120,62 L105,57" {...s} />
        </g>
      )
    case 'bushy':
      return (
        <g>
          <path d="M78,60 Q87,52 96,60" stroke={color} strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M104,60 Q113,52 122,60" stroke={color} strokeWidth="7" strokeLinecap="round" fill="none" />
        </g>
      )
    default:
      return (
        <g>
          <path d="M81,60 Q88,56 95,60" {...s} />
          <path d="M105,60 Q112,56 119,60" {...s} />
        </g>
      )
  }
}

const OUT = 'rgba(0,0,0,0.4)'
/** Heads are drawn at ~0.8 scale around the chin for less "chibi" proportions. */
const HEAD = 'translate(100,104) scale(0.8) translate(-100,-104)'

function Arm({ d, color }: { d: string; color: string }) {
  return (
    <g>
      <path d={d} stroke={OUT} strokeWidth="19" strokeLinecap="round" fill="none" />
      <path d={d} stroke={color} strokeWidth="16" strokeLinecap="round" fill="none" />
      <path d={d} transform="translate(3.5,1)" stroke="rgba(0,0,0,0.22)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d={d} transform="translate(-4,-1)" stroke="rgba(255,255,255,0.2)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  )
}

function Hand({ x, y, skin, up, side }: { x: number; y: number; skin: string; up: boolean; side: number }) {
  const dk = darken(skin, 0.18)
  return (
    <g transform={`translate(${x},${y}) ${up ? '' : 'rotate(180)'} scale(${side},1)`}>
      <path d="M-7,6 Q-8,-4 -5,-9 Q0,-12 5,-9 Q8,-4 7,6 Q0,9 -7,6 Z" fill={skin} stroke={OUT} strokeWidth="1.3" />
      <ellipse cx="-7" cy="0" rx="3" ry="5" transform="rotate(-25 -7 0)" fill={skin} stroke={OUT} strokeWidth="1.1" />
      <path d="M-3,-9 L-3,-4 M0.5,-10 L0.5,-4 M4,-9 L4,-4" stroke={dk} strokeWidth="1" />
      <path d="M2,6 Q7,2 6,-6" stroke="rgba(0,0,0,0.18)" strokeWidth="2.5" fill="none" />
    </g>
  )
}

export function Person(p: PersonProps) {
  const skin = p.skin ?? '#f1c7a5'
  const top = p.top ?? 'shirt'
  const topColor = p.topColor ?? '#4a6fa5'
  const shirt = p.shirtColor ?? '#f4f4f4'
  const pants = p.pants ?? '#2b3040'
  const shoes = p.shoes ?? '#1c1c1c'
  const skinD = darken(skin, 0.12)
  const torsoW = p.slim ? 36 : 44
  const armColor = top === 'vest' ? shirt : top === 'polo' || top === 'sport' ? topColor : topColor
  const L = 100 - torsoW
  const R = 100 + torsoW

  const id = useId().replace(/:/g, '')
  const torsoPath = top === 'labcoat' ? `M${L},122 Q${L + 4},108 ${L + 22},106 L${R - 22},106 Q${R - 4},108 ${R},122 L${R + 6},228 L${L - 6},228 Z` : `M${L},124 Q${L + 4},108 ${L + 22},106 L${R - 22},106 Q${R - 4},108 ${R},124 L${R + 4},202 L${L - 4},202 Z`
  const leftArm = p.armsUp === 'left' || p.armsUp === 'both'
  const rightArm = p.armsUp === 'right' || p.armsUp === 'both'

  return (
    <g>
      {/* legs */}
      <defs>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id={`${id}-vsh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id={`${id}-head`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.8" stopColor="#5a2a14" stopOpacity="0.12" />
          <stop offset="1" stopColor="#3a1a0a" stopOpacity="0.38" />
        </radialGradient>
      </defs>
      {/* legs */}
      <path d="M72,195 L96,195 L95,247 L74,247 Z" fill={pants} stroke={OUT} strokeWidth="1.5" />
      <path d="M104,195 L128,195 L126,247 L105,247 Z" fill={pants} stroke={OUT} strokeWidth="1.5" />
      <path d="M72,195 L96,195 L95,247 L74,247 Z M104,195 L128,195 L126,247 L105,247 Z" fill={`url(#${id}-sh)`} />
      <path d="M86,205 Q84,225 87,244 M117,205 Q119,225 116,244" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" fill="none" />
      <path d="M76,214 Q82,218 90,215 M108,220 Q114,224 122,221" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
      <path d="M68,252 Q68,242 80,242 L94,243 Q98,252 94,256 L70,256 Z" fill={shoes} stroke={OUT} strokeWidth="1.5" />
      <path d="M132,252 Q132,242 120,242 L106,243 Q102,252 106,256 L130,256 Z" fill={shoes} stroke={OUT} strokeWidth="1.5" />
      <path d="M73,246 Q80,244 88,245 M127,246 Q120,244 112,245" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />

      <g transform={HEAD}>{p.hairBack}</g>

      {/* arms */}
      <Arm d={leftArm ? `M${L + 6},118 Q${L - 20},100 ${L - 18},66` : `M${L + 6},118 Q${L - 8},150 ${L - 6},186`} color={armColor} />
      <Arm d={rightArm ? `M${R - 6},118 Q${R + 20},100 ${R + 18},66` : `M${R - 6},118 Q${R + 8},150 ${R + 6},186`} color={armColor} />
      <Hand x={leftArm ? L - 18 : L - 6} y={leftArm ? 58 : 193} skin={skin} up={leftArm} side={-1} />
      <Hand x={rightArm ? R + 18 : R + 6} y={rightArm ? 58 : 193} skin={skin} up={rightArm} side={1} />

      {/* neck */}
      <path d="M90,94 L110,94 L111,114 L89,114 Z" fill={skinD} stroke={OUT} strokeWidth="1.2" />
      <path d="M90,100 Q100,108 110,100 L110,94 L90,94 Z" fill="rgba(60,20,10,0.25)" />

      {/* torso */}
      {top === 'labcoat' ? (
        <g>
          <path d={`M${L},122 Q${L + 4},108 ${L + 22},106 L${R - 22},106 Q${R - 4},108 ${R},122 L${R + 6},228 L${L - 6},228 Z`} fill={topColor} stroke="#c9ced6" strokeWidth="1.5" />
          <path d="M88,106 L100,140 L112,106 Z" fill={shirt} />
          <path d="M100,140 L100,228" stroke="#c9ced6" strokeWidth="1.5" />
          <path d="M86,106 L100,140 L94,150 L80,110 Z M114,106 L100,140 L106,150 L120,110 Z" fill={darken(topColor, 0.05)} stroke="#c9ced6" strokeWidth="1" />
          <rect x={R - 28} y="150" width="18" height="16" rx="2" fill="none" stroke="#c9ced6" strokeWidth="1.5" />
          <rect x={R - 25} y="144" width="3" height="12" fill="#2f62b7" />
          <rect x={R - 20} y="143" width="3" height="13" fill="#d33" />
        </g>
      ) : (
        <path d={`M${L},124 Q${L + 4},108 ${L + 22},106 L${R - 22},106 Q${R - 4},108 ${R},124 L${R + 4},202 L${L - 4},202 Z`} fill={top === 'vest' ? shirt : topColor} />
      )}

      {top === 'suit' && (
        <g>
          <path d="M88,106 L100,146 L112,106 Z" fill={shirt} />
          {p.tie && <path d="M97,112 L103,112 L106,148 L100,156 L94,148 Z" fill={p.tie} />}
          {p.tie && <path d="M96,106 L104,106 L103,113 L97,113 Z" fill={darken(p.tie, 0.2)} />}
          <path d="M86,106 L100,146 L92,152 L78,112 Z M114,106 L100,146 L108,152 L122,112 Z" fill={darken(topColor, 0.15)} />
          <circle cx="100" cy="170" r="2.5" fill={darken(topColor, 0.35)} />
          <circle cx="100" cy="185" r="2.5" fill={darken(topColor, 0.35)} />
        </g>
      )}
      {top === 'shirt' && (
        <g>
          <path d="M88,106 L100,118 L112,106" stroke={darken(topColor, 0.2)} strokeWidth="3" fill="none" />
          {p.tie && <path d="M97,114 L103,114 L106,150 L100,158 L94,150 Z" fill={p.tie} />}
          <path d="M100,118 L100,200" stroke={darken(topColor, 0.15)} strokeWidth="1.5" />
        </g>
      )}
      {top === 'polo' && (
        <g>
          <path d="M86,106 L100,116 L114,106 L110,100 L100,108 L90,100 Z" fill={shirt} />
          <path d="M100,116 L100,134" stroke={darken(topColor, 0.25)} strokeWidth="2" />
          <circle cx="100" cy="122" r="1.5" fill="#eee" />
          <circle cx="100" cy="130" r="1.5" fill="#eee" />
        </g>
      )}
      {top === 'hoodie' && (
        <g>
          <path d="M78,112 Q100,128 122,112 Q118,100 100,102 Q82,100 78,112 Z" fill={darken(topColor, 0.18)} />
          <path d="M93,118 L91,150 M107,118 L109,150" stroke="#f2f2f2" strokeWidth="2" />
          <path d={`M78,168 L122,168 L126,196 L74,196 Z`} fill={darken(topColor, 0.1)} />
        </g>
      )}
      {top === 'sport' && (
        <g>
          <path d="M100,106 L100,202" stroke="#e8e8e8" strokeWidth="2" />
          <rect x="97" y="108" width="6" height="10" rx="1" fill="#e8e8e8" />
          <path d={`M${L + 4},130 L${L + 10},200 M${R - 4},130 L${R - 10},200`} stroke={darken(topColor, 0.25)} strokeWidth="4" />
          <path d="M88,104 L100,112 L112,104" stroke={darken(topColor, 0.3)} strokeWidth="4" fill="none" />
        </g>
      )}
      {top === 'cardigan' && (
        <g>
          <path d="M86,106 L100,150 L114,106 Z" fill={shirt} />
          <path d="M100,150 L100,202" stroke={darken(topColor, 0.25)} strokeWidth="2" />
          {[160, 174, 188].map((y) => <circle key={y} cx="104" cy={y} r="2.5" fill={darken(topColor, 0.4)} />)}
          <path d={`M${L},130 L${R},130`} stroke={darken(topColor, 0.1)} strokeWidth="1" opacity="0.5" />
        </g>
      )}
      {top === 'fleece' && (
        <g>
          <path d="M84,104 L100,120 L116,104 L116,96 L84,96 Z" fill={darken(topColor, 0.15)} />
          <path d="M100,104 L100,140" stroke="#c0c0c0" strokeWidth="2" />
          <rect x={R - 26} y="130" width="12" height="7" rx="1" fill="#ddd" />
        </g>
      )}
      {top === 'vest' && (
        <g>
          <path d="M88,106 L100,118 L112,106" stroke="#bcd" strokeWidth="3" fill="none" />
          <path d={`M${L - 2},118 Q${L + 6},104 ${L + 26},104 L96,112 L96,204 L${L - 6},204 Z`} fill={topColor} />
          <path d={`M${R + 2},118 Q${R - 6},104 ${R - 26},104 L104,112 L104,204 L${R + 6},204 Z`} fill={topColor} />
          {[128, 146, 164, 182].map((y) => (
            <g key={y}>
              <path d={`M${L - 3},${y} Q${L + 22},${y + 5} 96,${y}`} stroke={darken(topColor, 0.35)} strokeWidth="2" fill="none" />
              <path d={`M104,${y} Q${R - 22},${y + 5} ${R + 3},${y}`} stroke={darken(topColor, 0.35)} strokeWidth="2" fill="none" />
            </g>
          ))}
          <path d="M96,112 L96,204 M104,112 L104,204" stroke={darken(topColor, 0.45)} strokeWidth="1.5" />
          <path d={`M${L + 6},118 Q${L + 16},112 ${L + 30},116`} stroke="#ffffff" strokeWidth="3" opacity="0.18" fill="none" />
          <path d={`M${R - 30},116 Q${R - 16},112 ${R - 6},118`} stroke="#ffffff" strokeWidth="3" opacity="0.18" fill="none" />
        </g>
      )}
      {p.bowtie && <path d="M88,108 L100,114 L112,108 L112,120 L100,114 L88,120 Z" fill={p.bowtie} />}

      {/* torso volume: directional light, folds, outline */}
      <path d={torsoPath} fill={`url(#${id}-sh)`} />
      <path d={torsoPath} fill="none" stroke={OUT} strokeWidth="1.6" />
      <path d={`M${L + 10},${top === 'labcoat' ? 200 : 180} Q${L + 20},${top === 'labcoat' ? 170 : 160} ${L + 16},140 M${R - 12},188 Q${R - 20},165 ${R - 14},138 M${L + 20},196 Q100,188 ${R - 18},197`} stroke="rgba(0,0,0,0.16)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d={`M${L + 6},124 Q${L + 10},112 ${L + 26},108`} stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" strokeLinecap="round" />

      {p.props}

      {/* head */}
      <g transform={HEAD}>
      <ellipse cx="69" cy="72" rx="5.5" ry="9" fill={skinD} stroke={OUT} strokeWidth="1.2" />
      <ellipse cx="131" cy="72" rx="5.5" ry="9" fill={skinD} stroke={OUT} strokeWidth="1.2" />
      <path d="M68,68 Q66,73 69,78 M132,68 Q134,73 131,78" stroke="rgba(80,30,15,0.35)" strokeWidth="1.3" fill="none" />
      {p.earrings && (
        <g>
          <circle cx="68" cy="86" r="3" fill={p.earrings} />
          <circle cx="132" cy="86" r="3" fill={p.earrings} />
        </g>
      )}
      <path d="M69,66 Q69,33 100,33 Q131,33 131,66 Q131,88 118,99 Q108,105 100,105 Q92,105 82,99 Q69,88 69,66 Z" fill={skin} stroke={OUT} strokeWidth="1.5" />
      <path d="M69,66 Q69,33 100,33 Q131,33 131,66 Q131,88 118,99 Q108,105 100,105 Q92,105 82,99 Q69,88 69,66 Z" fill={`url(#${id}-head)`} />
      <path d="M122,72 Q124,90 112,100" stroke="rgba(80,30,15,0.18)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="80" cy="81" rx="6" ry="3.5" fill="#e88a80" opacity="0.18" />
      <ellipse cx="120" cy="81" rx="6" ry="3.5" fill="#e88a80" opacity="0.14" />
      {p.stubble && (
        <g>
          <path d="M71,76 Q74,104 100,106 Q126,104 129,76 Q124,92 112,96 Q100,99 88,96 Q76,92 71,76 Z" fill={p.stubble} opacity="0.75" />
          {Array.from({ length: 46 }).map((_, i) => {
            const a = (i * 137.5) % 360
            const r = 0.35 + ((i * 53) % 60) / 100
            const cx = 100 + Math.cos((a * Math.PI) / 180) * 26 * r
            const cy = 92 + Math.abs(Math.sin((a * Math.PI) / 180)) * 12 * r
            return <circle key={i} cx={cx} cy={cy} r="0.9" fill={darken(p.stubble!, 0.35)} />
          })}
        </g>
      )}
      {p.wrinkles && (
        <g stroke={skinD} strokeWidth="1.3" fill="none" strokeLinecap="round">
          <path d="M76,72 L72,70 M76,75 L72,76 M124,72 L128,70 M124,75 L128,76" />
          <path d="M86,80 Q84,86 86,90 M114,80 Q116,86 114,90" />
        </g>
      )}
      {p.blush && (
        <g>
          <ellipse cx="80" cy="82" rx="7" ry="4" fill="#e8747c" opacity="0.6" />
          <ellipse cx="120" cy="82" rx="7" ry="4" fill="#e8747c" opacity="0.6" />
        </g>
      )}
      <Eye x={88} kind={p.eyes ?? 'normal'} iris={p.iris} />
      <Eye x={112} kind={p.eyes ?? 'normal'} iris={p.iris} />
      <Brows kind={p.brows ?? 'normal'} color={p.browColor ?? '#3a2a20'} />
      <path d="M101,70 Q105,78 104,82 Q100,84 96,82" fill="rgba(90,40,20,0.16)" />
      <path d="M100,71 Q104,79 102,83 Q99,84.5 96,83" stroke="rgba(90,40,20,0.55)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M98,71 Q99,76 98.5,79" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {p.mustache && <path d="M86,86 Q93,80 100,84 Q107,80 114,86 Q107,88 100,86 Q93,88 86,86 Z" fill={p.mustache} />}
      <MouthShape kind={p.mouth ?? 'smile'} />
      {p.glasses === 'round' && (
        <g stroke="#2b2b2b" strokeWidth="2.2" fill="rgba(200,230,255,0.15)">
          <circle cx="88" cy="70" r="10" />
          <circle cx="112" cy="70" r="10" />
          <path d="M98,70 L102,70" />
        </g>
      )}
      {p.glasses === 'square' && (
        <g stroke="#1e1e1e" strokeWidth="3" fill="rgba(200,230,255,0.15)">
          <rect x="76" y="62" width="22" height="15" rx="3" />
          <rect x="102" y="62" width="22" height="15" rx="3" />
          <path d="M98,68 L102,68 M76,67 L70,66 M124,67 L130,66" />
        </g>
      )}
      {p.glasses === 'half' && (
        <g stroke="#6b4a2a" strokeWidth="2" fill="rgba(200,230,255,0.2)">
          <path d="M78,72 L98,72 Q97,80 88,80 Q79,80 78,72 Z" />
          <path d="M102,72 L122,72 Q121,80 112,80 Q103,80 102,72 Z" />
          <path d="M98,73 L102,73" />
        </g>
      )}
      {p.glasses === 'sun' && (
        <g>
          <path d="M75,64 L98,64 L96,76 Q88,80 78,76 Z" fill="#111" />
          <path d="M102,64 L125,64 L122,76 Q112,80 104,76 Z" fill="#111" />
          <path d="M98,66 L102,66" stroke="#111" strokeWidth="2" />
          <path d="M80,67 L86,67" stroke="#fff" strokeWidth="1.5" opacity="0.6" />
        </g>
      )}
      {p.hairFront}
      {p.hat}
      </g>
      {p.front}
    </g>
  )
}
