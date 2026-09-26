import { Person } from './Person'

/* New bosses and elites (Forklift Frank, the CFO, the Global Audit and friends). Same viewBox as the other portraits. */

const hardHat = (color = '#f2c230') => (
  <g>
    <path d="M64,50 Q64,18 100,16 Q136,18 136,50 Z" fill={color} stroke="#9a7a10" strokeWidth="2" />
    <rect x="58" y="46" width="84" height="8" rx="3" fill={color} stroke="#9a7a10" strokeWidth="2" />
    <path d="M100,17 L100,46" stroke="#fff" strokeWidth="3" opacity="0.35" />
  </g>
)

export function ForkliftFrank() {
  return (
    <g>
      {/* speed lines */}
      <g stroke="#bfe8ff" strokeWidth="3" strokeLinecap="round" opacity="0.45">
        <path d="M-14,150 L14,150" />
        <path d="M-18,176 L10,176" />
        <path d="M-10,202 L18,202" />
      </g>
      {/* exhaust puffs */}
      <g fill="#9aa3ad" opacity="0.6">
        <circle cx="22" cy="118" r="7">
          <animate attributeName="cy" values="118;96;118" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="14" cy="106" r="5">
          <animate attributeName="cy" values="106;80;106" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
        </circle>
      </g>
      <rect x="18" y="118" width="10" height="26" rx="2" fill="#555" />
      {/* mast and raised forks */}
      <rect x="170" y="36" width="8" height="200" fill="#4a4f57" />
      <rect x="186" y="36" width="8" height="200" fill="#3a3f47" />
      <path d="M168,40 L196,40" stroke="#2a2e34" strokeWidth="5" />
      <rect x="176" y="84" width="46" height="7" rx="2" fill="#6b7078" stroke="#2a2e34" strokeWidth="1.5" />
      <rect x="176" y="100" width="46" height="7" rx="2" fill="#6b7078" stroke="#2a2e34" strokeWidth="1.5" />
      <rect x="172" y="76" width="10" height="36" fill="#555a62" />
      {/* a pallet of loggers balanced on the forks */}
      <rect x="182" y="70" width="38" height="14" fill="#b88a5a" stroke="#7a5a34" />
      <rect x="186" y="52" width="14" height="18" fill="#e6e3da" stroke="#9a968a" />
      <rect x="202" y="56" width="14" height="14" fill="#e6e3da" stroke="#9a968a" />
      {/* overhead guard */}
      <path d="M40,40 L160,40 M46,40 L52,140 M154,40 L150,140" stroke="#2a2e34" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M40,40 L160,40" stroke="#e0b020" strokeWidth="2" />
      {/* Frank himself, from the waist up */}
      <g transform="translate(22,22) scale(0.62)">
        <Person
          skin="#e8b08a"
          top="vest"
          topColor="#ff7a1a"
          shirtColor="#6a7a8a"
          eyes="angry"
          mouth="grin"
          brows="angry"
          stubble="#6d5a4a"
          mustache="#5a3a24"
          hat={hardHat()}
          armsUp="right"
          props={
            <g stroke="#e8f4ff" strokeWidth="4" opacity="0.9">
              <path d="M52,150 L148,150" />
              <path d="M52,176 L148,176" />
            </g>
          }
        />
      </g>
      {/* weld seams: Frank is part of the machine now */}
      <g fill="#ffb347" className="glow">
        {[62, 74, 86, 98, 110, 122, 134].map((x) => (
          <circle key={x} cx={x} cy={141} r="2.4" />
        ))}
      </g>
      {/* body */}
      <path d="M20,140 L170,140 L180,160 L180,224 L14,224 L14,160 Z" fill="#f2c230" stroke="#9a7a10" strokeWidth="3" />
      <path d="M20,140 L170,140 L176,152 L18,152 Z" fill="#ffe27a" opacity="0.7" />
      <path d="M14,196 L180,196" stroke="#9a7a10" strokeWidth="2" />
      <rect x="120" y="160" width="40" height="22" rx="3" fill="#1c1c1c" />
      <text x="140" y="176" fontSize="10" textAnchor="middle" fill="#ffb347" fontWeight="900" fontFamily="monospace">FRANK</text>
      <rect x="28" y="160" width="60" height="10" fill="#1c1c1c" />
      <path d="M30,165 L86,165" stroke="#f2c230" strokeWidth="4" strokeDasharray="8 6" />
      {/* steering wheel */}
      <ellipse cx="104" cy="132" rx="16" ry="6" fill="none" stroke="#222" strokeWidth="4" />
      {/* headlight + warning beacon */}
      <circle cx="172" cy="170" r="7" fill="#fff6c8" stroke="#9a7a10" strokeWidth="2" />
      <path d="M178,170 L222,154 L222,186 Z" fill="#fff6c8" opacity="0.2" />
      <circle cx="100" cy="34" r="6" fill="#ff7a1a" className="blink" />
      {/* wheels */}
      {[50, 146].map((x) => (
        <g key={x}>
          <circle cx={x} cy={234} r={20} fill="#1c1c1c" />
          <circle cx={x} cy={234} r={9} fill="#6b7078" />
          <circle cx={x} cy={234} r={3} fill="#2a2e34" />
        </g>
      ))}
    </g>
  )
}

export function CFO() {
  return (
    <g>
      {/* frost aura */}
      <ellipse cx="100" cy="140" rx="92" ry="118" fill="#bfe8ff" opacity="0.14" />
      <g fill="#e6f7ff" opacity="0.85">
        {[
          [26, 60],
          [176, 44],
          [18, 170],
          [184, 150],
          [40, 230],
          [168, 218],
        ].map(([x, y], i) => (
          <text key={i} x={x} y={y} fontSize={i % 2 ? 14 : 18} textAnchor="middle">
            ❄
          </text>
        ))}
      </g>
      <g transform="translate(-6,-10) scale(1.06)">
        <Person
          skin="#ecd6c8"
          top="suit"
          topColor="#2a3140"
          shirtColor="#e8f4ff"
          tie="#7fd3ff"
          eyes="normal"
          iris="#5fc3ff"
          mouth="flat"
          brows="raised"
          browColor="#3a3a44"
          glasses="half"
          hairFront={
            <g>
              <path d="M68,64 Q64,28 100,26 Q136,28 132,64 Q126,42 100,40 Q74,42 68,64 Z" fill="#2c2c34" />
              <path d="M68,62 Q66,48 72,40 M132,62 Q134,48 128,40" stroke="#c9ced6" strokeWidth="4" fill="none" />
            </g>
          }
          armsUp="right"
          front={
            <g>
              {/* the ledger */}
              <g transform="translate(160,46) rotate(8)">
                <rect x="-22" y="-26" width="44" height="54" rx="3" fill="#1f3b2a" stroke="#0f2418" strokeWidth="2" />
                <rect x="-18" y="-22" width="36" height="46" fill="#f4f1e6" />
                {[-14, -6, 2, 10].map((y) => (
                  <path key={y} d={`M-14,${y} L14,${y}`} stroke="#bbb" strokeWidth="2" />
                ))}
                <text x="0" y="22" fontSize="9" textAnchor="middle" fill="#d33" fontWeight="900">−40%</text>
              </g>
              {/* icicles on the cuff */}
              <path d="M44,196 l3,12 l3,-12 M52,196 l2,9 l2,-9" fill="#dff4ff" stroke="#9fd6ff" strokeWidth="1" />
              {/* frosty breath */}
              <g fill="#e6f7ff">
                <circle cx="118" cy="92" r="4" opacity="0.6">
                  <animate attributeName="cx" values="118;134;118" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
                </circle>
              </g>
            </g>
          }
        />
      </g>
    </g>
  )
}

/** A stern auditor head peeking over the binder wall. */
function AuditorHead({ x, y, hair, skin, glasses = true, s = 1 }: { x: number; y: number; hair: string; skin: string; glasses?: boolean; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="20" ry="23" fill={skin} stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      <ellipse cx="6" cy="6" rx="14" ry="15" fill="rgba(0,0,0,0.12)" />
      <path d="M-20,-4 Q-22,-26 0,-26 Q22,-26 20,-4 Q14,-16 0,-16 Q-14,-16 -20,-4 Z" fill={hair} />
      <path d="M-12,-6 L-3,-3 M12,-6 L3,-3" stroke="#2a1d16" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="-7" cy="1" r="2.2" fill="#2a1d16" />
      <circle cx="7" cy="1" r="2.2" fill="#2a1d16" />
      {glasses && (
        <g stroke="#1e1e1e" strokeWidth="1.8" fill="rgba(200,230,255,0.2)">
          <rect x="-13" y="-4" width="11" height="8" rx="2" />
          <rect x="2" y="-4" width="11" height="8" rx="2" />
        </g>
      )}
      <path d="M-7,13 Q0,9 7,13" stroke="#5a2a24" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function GlobalAudit() {
  const binder = (x: number, y: number, w: number, h: number, c: string, k: number) => (
    <g key={k}>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={c} stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
      <rect x={x + 4} y={y + h * 0.3} width={w - 8} height={h * 0.28} rx="2" fill="#f4f1e6" opacity="0.85" />
      <circle cx={x + w / 2} cy={y + h * 0.78} r="3" fill="rgba(0,0,0,0.35)" />
    </g>
  )
  const colors = ['#1f4e9a', '#7a1f2b', '#2a6a4a', '#4a3a80', '#8a5a1a', '#1f3b73']
  return (
    <g transform="translate(-24,-30) scale(1.24)">
      <g className="breathe">
        {/* binder colossus */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => binder(34 + i * 17, 96 + (i % 2) * 6, 16, 74, colors[i % colors.length], i))}
        {[0, 1, 2, 3, 4, 5].map((i) => binder(48 + i * 18, 52 + (i % 2) * 4, 17, 50, colors[(i + 2) % colors.length], 10 + i))}
        {/* three auditors */}
        <AuditorHead x={62} y={60} hair="#6b6b6b" skin="#efd0bb" />
        <AuditorHead x={100} y={40} hair="#2a1d16" skin="#d9a582" s={1.12} />
        <AuditorHead x={138} y={60} hair="#b8b8b8" skin="#f1d6c6" glasses={false} />
        {/* raised clipboards */}
        <g transform="translate(24,96) rotate(-14)">
          <rect x="-12" y="-16" width="24" height="32" rx="2" fill="#b0763a" />
          <rect x="-9" y="-12" width="18" height="26" fill="#fff" />
          <path d="M-6,-6 l4,4 M-2,-6 l-4,4 M-6,2 l4,4 M-2,2 l-4,4" stroke="#d33" strokeWidth="1.8" />
        </g>
        <g transform="translate(178,92) rotate(12)">
          <rect x="-12" y="-16" width="24" height="32" rx="2" fill="#b0763a" />
          <rect x="-9" y="-12" width="18" height="26" fill="#fff" />
          <text x="0" y="4" fontSize="6" textAnchor="middle" fill="#d33" fontWeight="900">NC</text>
        </g>
        {/* the long table */}
        <rect x="8" y="166" width="184" height="12" rx="2" fill="#6b4a2a" stroke="#3a2a1a" strokeWidth="2" />
        <path d="M18,178 L182,178 L176,232 L24,232 Z" fill="#5a3a22" stroke="#3a2a1a" strokeWidth="2" />
        <rect x="30" y="186" width="140" height="24" rx="3" fill="#0f2640" stroke="#5cd6ce" strokeWidth="2" />
        <text x="100" y="203" fontSize="13" textAnchor="middle" fill="#5cd6ce" fontWeight="900" letterSpacing="2">
          GLOBAL AUDIT
        </text>
        {/* rubber stamp */}
        <g transform="translate(150,152) rotate(-18)">
          <rect x="-16" y="-6" width="32" height="12" rx="2" fill="none" stroke="#d33" strokeWidth="2" />
          <text x="0" y="3" fontSize="6.5" textAnchor="middle" fill="#d33" fontWeight="900">REJECTED</text>
        </g>
        <rect x="46" y="158" width="18" height="8" rx="1" fill="#e6e3da" />
        <circle cx="100" cy="160" r="4" fill="#d33" className="blink" />
      </g>
    </g>
  )
}

export function PalletGolem() {
  const pallet = (y: number, w: number, k: number) => {
    const x = 100 - w / 2
    return (
      <g key={k}>
        <rect x={x} y={y} width={w} height="7" fill="#c89a62" stroke="#7a5a34" strokeWidth="1.2" />
        {[0.1, 0.45, 0.8].map((f, i) => (
          <rect key={i} x={x + w * f - 7} y={y + 7} width="14" height="9" fill="#a8784a" stroke="#6a4a24" strokeWidth="1.2" />
        ))}
        <rect x={x} y={y + 16} width={w} height="5" fill="#b8884e" stroke="#7a5a34" strokeWidth="1.2" />
        {[0.2, 0.4, 0.6].map((f, i) => (
          <path key={i} d={`M${x + w * f},${y + 1} L${x + w * f},${y + 6}`} stroke="#7a5a34" strokeWidth="1" />
        ))}
      </g>
    )
  }
  return (
    <g className="breathe">
      {/* legs */}
      <rect x="62" y="206" width="26" height="44" fill="#a8784a" stroke="#6a4a24" strokeWidth="2" />
      <rect x="112" y="206" width="26" height="44" fill="#a8784a" stroke="#6a4a24" strokeWidth="2" />
      {/* stacked body */}
      {[100, 126, 152, 178].map((y, i) => pallet(y, 120 - (i === 0 ? 10 : 0), i))}
      {/* shrink-wrap sheen */}
      <path d="M44,104 Q40,150 46,200" stroke="#ffffff" strokeWidth="4" opacity="0.25" fill="none" />
      <path d="M156,104 Q162,150 154,200" stroke="#ffffff" strokeWidth="3" opacity="0.2" fill="none" />
      {/* arms made of planks */}
      <g transform="rotate(-18 40 120)">
        <rect x="6" y="112" width="40" height="14" fill="#c89a62" stroke="#7a5a34" strokeWidth="1.5" />
        <rect x="0" y="126" width="16" height="48" fill="#b8884e" stroke="#7a5a34" strokeWidth="1.5" />
      </g>
      <g transform="rotate(18 160 120)">
        <rect x="154" y="112" width="40" height="14" fill="#c89a62" stroke="#7a5a34" strokeWidth="1.5" />
        <rect x="184" y="126" width="16" height="48" fill="#b8884e" stroke="#7a5a34" strokeWidth="1.5" />
      </g>
      {/* head: a small crate */}
      <rect x="72" y="46" width="56" height="52" fill="#b8884e" stroke="#6a4a24" strokeWidth="2.5" />
      <path d="M72,46 L128,98 M128,46 L72,98" stroke="#8a6238" strokeWidth="3" opacity="0.6" />
      <path d="M82,66 L96,72 L94,78 L82,76 Z" fill="#ff9a3c" className="glow" />
      <path d="M118,66 L104,72 L106,78 L118,76 Z" fill="#ff9a3c" className="glow" />
      <text x="100" y="92" fontSize="7" textAnchor="middle" fill="#5a3a18" fontWeight="900">THIS SIDE UP</text>
      {/* a stray logger box on top */}
      <rect x="86" y="30" width="28" height="18" fill="#e6e3da" stroke="#9a968a" strokeWidth="1.5" />
      <text x="100" y="42" fontSize="8" textAnchor="middle" fill="#5a3a18">❄</text>
    </g>
  )
}

export function OfficePrinter() {
  return (
    <g transform="translate(0,20)" className="hover-bob">
      {/* output paper flying */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${150 + i * 14},${24 - i * 18}) rotate(${18 + i * 14})`}>
          <rect x="-12" y="-16" width="24" height="32" fill="#fff" stroke="#ccc" />
          <path d="M-8,-8 L8,-8 M-8,-2 L8,-2 M-8,4 L4,4" stroke="#bbb" strokeWidth="1.5" />
        </g>
      ))}
      {/* body */}
      <rect x="28" y="70" width="144" height="110" rx="10" fill="#d9dbde" stroke="#8a8e94" strokeWidth="3" />
      <rect x="28" y="70" width="144" height="20" rx="8" fill="#eceef0" />
      <rect x="36" y="150" width="128" height="22" rx="3" fill="#b8bcc2" stroke="#8a8e94" strokeWidth="2" />
      {/* angry display */}
      <rect x="48" y="96" width="84" height="40" rx="4" fill="#3a5a3a" stroke="#2a3a2a" strokeWidth="2" />
      <path d="M58,106 L74,114 M122,106 L106,114" stroke="#b8f0a8" strokeWidth="4" strokeLinecap="round" />
      <text x="90" y="130" fontSize="7.5" textAnchor="middle" fill="#b8f0a8" fontWeight="900" fontFamily="monospace">PC LOAD LETTER</text>
      <circle cx="148" cy="104" r="6" fill="#ff9a3c" className="blink" />
      <circle cx="148" cy="122" r="5" fill="#666" />
      {/* the paper tongue */}
      <path d="M72,172 Q70,210 96,222 Q118,232 124,204 L124,172 Z" fill="#fff" stroke="#c9ccd0" strokeWidth="2" />
      <path d="M84,186 L114,186 M86,196 L112,196 M92,206 L110,206" stroke="#e05060" strokeWidth="1.6" opacity="0.6" />
      {/* little legs */}
      <path d="M50,180 L44,210 M150,180 L156,210" stroke="#6b7078" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="100" cy="226" rx="56" ry="6" fill="rgba(0,0,0,0.2)" />
    </g>
  )
}

export function PaperMinion() {
  return (
    <g transform="translate(40,70) scale(0.62)" className="hover-bob">
      <path d="M40,20 L140,20 L160,40 L160,220 L40,220 Z" fill="#ffffff" stroke="#c9ccd0" strokeWidth="3" />
      <path d="M140,20 L140,40 L160,40 Z" fill="#e2e4e8" stroke="#c9ccd0" strokeWidth="2" />
      {[70, 90, 150, 170, 190].map((y) => (
        <path key={y} d={`M56,${y} L144,${y}`} stroke="#c9ccd0" strokeWidth="3" />
      ))}
      <path d="M66,112 L88,120 M134,112 L112,120" stroke="#1b1b1b" strokeWidth="6" strokeLinecap="round" />
      <circle cx="80" cy="128" r="6" fill="#1b1b1b" />
      <circle cx="120" cy="128" r="6" fill="#1b1b1b" />
      <path d="M84,146 Q100,136 116,146" stroke="#1b1b1b" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M40,120 L10,96 M160,120 L190,96" stroke="#c9ccd0" strokeWidth="6" strokeLinecap="round" />
    </g>
  )
}

export function Recruiter() {
  return (
    <Person
      skin="#e2b08e"
      top="suit"
      topColor="#5b3fa0"
      shirtColor="#ffffff"
      eyes="happy"
      mouth="grin"
      brows="raised"
      hairFront={
        <g>
          <path d="M68,64 Q64,26 104,24 Q138,28 132,64 Q126,40 96,40 Q78,42 68,64 Z" fill="#241a14" />
          <path d="M80,38 Q104,28 126,42" stroke="#fff" strokeWidth="2" opacity="0.35" fill="none" />
        </g>
      }
      hat={
        <g>
          <path d="M66,70 Q64,20 100,20 Q136,20 134,70" fill="none" stroke="#1c1c1c" strokeWidth="5" />
          <rect x="58" y="62" width="12" height="20" rx="4" fill="#1c1c1c" />
          <path d="M64,80 Q70,100 88,96" stroke="#1c1c1c" strokeWidth="3" fill="none" />
          <circle cx="90" cy="96" r="3.5" fill="#333" />
        </g>
      }
      armsUp="right"
      front={
        <g transform="translate(160,48) rotate(8)">
          <rect x="-22" y="-28" width="44" height="58" rx="5" fill="#1c1c1c" />
          <rect x="-18" y="-24" width="36" height="48" rx="2" fill="#f4f7ff" />
          <text x="0" y="-12" fontSize="5.5" textAnchor="middle" fill="#5b3fa0" fontWeight="900">OPPORTUNITY!</text>
          <text x="0" y="6" fontSize="16" textAnchor="middle">💸</text>
          <text x="0" y="20" fontSize="5" textAnchor="middle" fill="#2a9d5c" fontWeight="900">+20% · remote*</text>
        </g>
      }
    />
  )
}

export function Influencer() {
  return (
    <g>
      {/* ring light */}
      <circle cx="100" cy="74" r="62" fill="none" stroke="#fff6e0" strokeWidth="10" opacity="0.9" />
      <circle cx="100" cy="74" r="62" fill="none" stroke="#ffe08a" strokeWidth="18" opacity="0.18" />
      <rect x="97" y="136" width="6" height="120" fill="#3a3a3a" />
      <Person
        skin="#e9c2a4"
        top="sport"
        topColor="#1c1c22"
        eyes="normal"
        mouth="smirk"
        brows="raised"
        glasses="round"
        hairBack={<circle cx="100" cy="30" r="12" fill="#6b4226" />}
        hairFront={<path d="M68,64 Q64,30 100,30 Q136,30 132,64 Q126,44 100,44 Q74,44 68,64 Z" fill="#6b4226" />}
        stubble="#8a6a54"
        armsUp="right"
        props={
          <g>
            <rect x="84" y="128" width="32" height="14" rx="3" fill="#0a66c2" />
            <text x="100" y="138" fontSize="7" textAnchor="middle" fill="#fff" fontWeight="900">TOP VOICE</text>
          </g>
        }
        front={
          <g>
            {/* selfie stick + phone */}
            <path d="M158,58 L186,12" stroke="#222" strokeWidth="3" />
            <g transform="translate(188,8) rotate(20)">
              <rect x="-10" y="-16" width="20" height="32" rx="4" fill="#111" />
              <rect x="-8" y="-13" width="16" height="26" rx="2" fill="#6ab0ff" />
              <circle cx="0" cy="-4" r="4" fill="#ffd166" />
            </g>
            <text x="30" y="30" fontSize="16">👍</text>
            <text x="14" y="56" fontSize="12">❤️</text>
          </g>
        }
      />
    </g>
  )
}

export function ConsultingPartner() {
  return (
    <g transform="translate(-8,-12) scale(1.08)">
      <Person
        skin="#f1d0bd"
        top="suit"
        topColor="#3a3f4a"
        tie="#b2182b"
        eyes="normal"
        mouth="smirk"
        brows="normal"
        browColor="#999"
        wrinkles
        hairFront={
          <g>
            <path d="M68,64 Q64,28 100,26 Q136,28 132,64 Q126,42 100,40 Q74,42 68,64 Z" fill="#c9c9c9" />
          </g>
        }
        props={
          <g stroke="#4a4f5a" strokeWidth="1" opacity="0.55">
            {[70, 80, 120, 130].map((x) => (
              <path key={x} d={`M${x},112 L${x},200`} />
            ))}
          </g>
        }
        armsUp="left"
        front={
          <g transform="translate(40,58) rotate(-10)">
            <rect x="-26" y="-18" width="52" height="34" rx="3" fill="#2a2e34" />
            <rect x="-22" y="-14" width="44" height="26" fill="#f4f7ff" />
            <text x="0" y="-4" fontSize="6" textAnchor="middle" fontWeight="900" fill="#1c2a4a">DELIVERABLES</text>
            <text x="0" y="7" fontSize="6" textAnchor="middle" fill="#d33" fontWeight="900">€€€€€</text>
          </g>
        }
      />
    </g>
  )
}

export function JuniorConsultant() {
  return (
    <g transform="translate(26,56) scale(0.74)">
      <Person
        skin="#f5d2b8"
        top="suit"
        topColor="#23345a"
        tie="#6aa0ff"
        eyes="wide"
        mouth="smile"
        brows="raised"
        hairFront={<path d="M68,64 Q64,28 100,26 Q136,28 132,64 Q126,44 100,42 Q74,44 68,64 Z" fill="#8a5a3a" />}
        armsUp="right"
        front={
          <g transform="translate(162,52)">
            <rect x="-20" y="-16" width="40" height="30" fill="#fff" stroke="#999" strokeWidth="2" />
            <rect x="-16" y="-12" width="32" height="6" fill="#23345a" />
            <path d="M-14,8 L-4,0 L4,4 L14,-6" stroke="#2a9d5c" strokeWidth="2.5" fill="none" />
          </g>
        }
      />
    </g>
  )
}
