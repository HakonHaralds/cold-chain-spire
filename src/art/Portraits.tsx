import { useId, type ReactNode } from 'react'
import { Person } from './Person'
import { Duck, FriendlyQA, Intern, ITGuy, OfficeDog, SummerStudent } from './Companions'
import { CFO as CfoArt, ConsultingPartner, ForkliftFrank, GlobalAudit, Influencer, JuniorConsultant, OfficePrinter, PalletGolem, PaperMinion, Recruiter } from './NewEnemies'

/* ---------- reusable hair ---------- */
const shortHair = (c: string) => <path d="M68,68 Q66,30 100,28 Q134,30 132,68 Q126,46 112,44 Q100,50 86,44 Q72,48 68,68 Z" fill={c} />
const messyHair = (c: string) => (
  <path d="M67,70 Q60,40 78,30 Q84,18 100,24 Q112,14 122,26 Q140,30 134,70 Q130,50 120,46 L116,40 L108,48 L100,38 L92,48 L84,40 L78,50 Q70,54 67,70 Z" fill={c} />
)
const slickHair = (c: string) => (
  <g>
    <path d="M68,66 Q64,30 100,26 Q136,28 132,64 Q128,42 104,40 Q82,40 68,66 Z" fill={c} />
    <path d="M78,40 Q100,30 126,44" stroke="#ffffff" strokeWidth="2" opacity="0.35" fill="none" />
  </g>
)
const sideHair = (c: string) => (
  <g fill={c}>
    <path d="M68,76 Q64,54 72,46 Q74,62 76,76 Z" />
    <path d="M132,76 Q136,54 128,46 Q126,62 124,76 Z" />
  </g>
)
const baldShine = <path d="M80,44 Q92,34 108,36" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.55" fill="none" />

/* ---------- props ---------- */
const lanyard = (badge: string, color = '#5CD6CE') => (
  <g>
    <path d="M88,108 L96,150 M112,108 L104,150" stroke={color} strokeWidth="3" />
    <rect x="90" y="148" width="20" height="26" rx="2" fill="#fff" stroke="#999" />
    <rect x="93" y="152" width="14" height="10" fill="#cfd8e3" />
    <text x="100" y="170" fontSize="5" textAnchor="middle" fill="#333" fontWeight="700">{badge}</text>
  </g>
)
const clipboard = (x: number, y: number, s = 1, marks: 'check' | 'cross' | 'heart' = 'check') => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x="-16" y="-20" width="32" height="42" rx="3" fill="#b0763a" />
    <rect x="-13" y="-16" width="26" height="35" fill="#fff" />
    <rect x="-7" y="-23" width="14" height="7" rx="2" fill="#777" />
    {marks === 'heart' ? (
      <path d="M0,10 C-14,0 -8,-12 0,-5 C8,-12 14,0 0,10 Z" fill="#e0457b" />
    ) : (
      [-10, -2, 6, 14].map((yy) => (
        <g key={yy}>
          {marks === 'check' ? <path d={`M-10,${yy} l3,3 l5,-6`} stroke="#2a9d5c" strokeWidth="2" fill="none" /> : <path d={`M-10,${yy - 3} l5,5 M-5,${yy - 3} l-5,5`} stroke="#d33" strokeWidth="2" />}
          <path d={`M-1,${yy} L10,${yy}`} stroke="#bbb" strokeWidth="2" />
        </g>
      ))
    )}
  </g>
)
/* ---------- characters ---------- */
function FirmwareDev() {
  // Hoodie, headphones round the neck, laptop full of C and a very necessary coffee.
  return (
    <Person
      skin="#eec3a0"
      top="hoodie"
      topColor="#24444a"
      pants="#2c3446"
      shoes="#d9dde2"
      eyes="normal"
      iris="#4a6a3a"
      mouth="flat"
      brows="normal"
      stubble="#7a5a44"
      hairFront={
        <g>
          {messyHair('#3e2a1c')}
          <path d="M82,76 Q88,79 94,76 M106,76 Q112,79 118,76" stroke="rgba(110,60,70,0.45)" strokeWidth="1.6" fill="none" />
        </g>
      }
      props={
        <g>
          <path d="M80,118 Q100,132 120,118" stroke="#1a1a1a" strokeWidth="5" fill="none" />
          <ellipse cx="80" cy="114" rx="9" ry="11" fill="#222" stroke="#000" strokeWidth="1.5" />
          <ellipse cx="80" cy="114" rx="5" ry="7" fill="#5CD6CE" opacity="0.8" />
          <ellipse cx="120" cy="114" rx="9" ry="11" fill="#222" stroke="#000" strokeWidth="1.5" />
          <ellipse cx="120" cy="114" rx="5" ry="7" fill="#5CD6CE" opacity="0.8" />
          <path d="M88,150 L110,150 L110,160 L88,160 Z" fill="#5CD6CE" opacity="0.35" />
          <text x="99" y="158" fontSize="6" textAnchor="middle" fill="#bff5ef" fontFamily="monospace" fontWeight="700">{'{ }'}</text>
        </g>
      }
      armsUp="right"
      front={
        <g>
          {/* coffee */}
          <g transform="translate(162,46)">
            <path d="M-10,-14 L10,-14 L8,12 Q0,15 -8,12 Z" fill="#f4f4f4" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
            <path d="M-9.5,-6 L9.5,-6 L9,2 L-9,2 Z" fill="#003865" />
            <path d="M-4,-20 Q-7,-26 -3,-31 M3,-20 Q0,-27 5,-32" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5">
              <animate attributeName="opacity" values="0;0.6;0" dur="2.4s" repeatCount="indefinite" />
            </path>
          </g>
          {/* laptop */}
          <g transform="translate(46,182) rotate(-6)">
            <path d="M-30,-40 L26,-40 L26,0 L-30,0 Z" fill="#2a2e36" stroke="#111" strokeWidth="1.5" />
            <path d="M-26,-36 L22,-36 L22,-4 L-26,-4 Z" fill="#0c1a14" />
            {[['#5CD6CE', 30], ['#9fe870', 22], ['#5CD6CE', 34], ['#e9c46a', 18], ['#9fe870', 28], ['#5CD6CE', 14]].map(([c, w], i) => (
              <rect key={i} x={-23 + (i % 3) * 3} y={-33 + i * 5} width={w as number} height="2.4" rx="1" fill={c as string} opacity="0.9" />
            ))}
            <rect x="-2" y="-8" width="3" height="3" fill="#9fe870" className="blink" />
            <path d="M-34,0 L30,0 L34,6 L-38,6 Z" fill="#8a929e" stroke="#111" strokeWidth="1.2" />
          </g>
        </g>
      }
    />
  )
}

function HardwareEngineer() {
  // Blue ESD smock, safety glasses on the forehead, soldering iron and a fresh PCB.
  return (
    <Person
      skin="#d9a27c"
      top="labcoat"
      topColor="#3a6fb8"
      shirtColor="#dde4ea"
      pants="#3a3f4a"
      shoes="#2a2a2a"
      eyes="normal"
      iris="#3a2a1a"
      mouth="smile"
      brows="raised"
      browColor="#2a1a10"
      mustache="#2a1a10"
      hairFront={
        <g>
          {shortHair('#2a1a10')}
          <g>
            <path d="M72,50 Q100,40 128,50 L126,60 Q113,64 100,58 Q87,64 74,60 Z" fill="rgba(210,240,255,0.45)" stroke="#e8a020" strokeWidth="2.5" />
            <path d="M80,50 Q90,47 96,49" stroke="#fff" strokeWidth="1.5" opacity="0.7" fill="none" />
            <path d="M72,54 L66,58 M128,54 L134,58" stroke="#e8a020" strokeWidth="3" />
          </g>
        </g>
      }
      props={
        <g>
          <path d="M60,140 L60,150" stroke="#e8e8e8" strokeWidth="1" />
          <rect x="118" y="120" width="14" height="10" rx="2" fill="#f2c230" />
          <text x="125" y="127.5" fontSize="5" textAnchor="middle" fontWeight="900" fill="#222">ESD</text>
        </g>
      }
      armsUp="right"
      front={
        <g>
          {/* soldering iron */}
          <g transform="translate(162,58) rotate(20)">
            <rect x="-4" y="-6" width="8" height="30" rx="3" fill="#1c1c1c" />
            <rect x="-4" y="2" width="8" height="10" fill="#e07020" />
            <path d="M-2,-6 L2,-6 L1,-30 L-1,-30 Z" fill="#b8bec6" />
            <circle cx="0" cy="-31" r="2.5" fill="#ff7a1a" className="glow" />
            <circle cx="0" cy="-31" r="6" fill="#ff9a3c" opacity="0.35" className="glow" />
            <path d="M0,-36 Q-5,-44 0,-50 Q5,-56 0,-62" stroke="#dde" strokeWidth="2" fill="none" opacity="0.5">
              <animate attributeName="opacity" values="0.1;0.6;0.1" dur="1.8s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0,2;0,-4;0,2" dur="1.8s" repeatCount="indefinite" />
            </path>
            <path d="M0,24 Q10,40 4,60" stroke="#333" strokeWidth="2" fill="none" />
          </g>
          {/* PCB */}
          <g transform="translate(48,186) rotate(-10)">
            <rect x="-26" y="-18" width="52" height="34" rx="3" fill="#1f7a3c" stroke="#0e4a22" strokeWidth="2" />
            <path d="M-20,-10 L-6,-10 L0,-4 L14,-4 M-20,6 L-8,6 L-4,10 L18,10 M8,-14 L8,-4" stroke="#e8c060" strokeWidth="1.3" fill="none" />
            <rect x="-6" y="-2" width="14" height="10" fill="#1a1a1a" />
            <rect x="12" y="-14" width="8" height="6" fill="#1a1a1a" />
            {[-4, 0, 4].map((x) => <rect key={x} x={x - 0.5} y="8" width="1.5" height="2" fill="#ccc" />)}
            <circle cx="-18" cy="-12" r="2" fill="#c8c8c8" />
            <circle cx="20" cy="10" r="2" fill="#c8c8c8" />
            <circle cx="-16" cy="10" r="2.5" fill="#e33" className="blink" />
          </g>
        </g>
      }
    />
  )
}

function CalibrationSpecialist() {
  // Insulated cold-room jacket, teal beanie, ponytail, reference probe reading exactly 2.00 °C.
  const hair = '#5a3322'
  return (
    <Person
      skin="#f2cdb2"
      top="sport"
      topColor="#0b3a63"
      pants="#1f2a3a"
      shoes="#3a3a3a"
      slim
      eyes="normal"
      iris="#3a6a9a"
      mouth="smile"
      brows="normal"
      browColor={hair}
      hairBack={
        <g>
          <path d="M70,70 Q66,100 76,104 L80,70 Z M130,70 Q134,100 124,104 L120,70 Z" fill={hair} />
          <path d="M124,56 Q150,62 146,100 Q144,122 132,132 Q138,108 130,84 Z" fill={hair} stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" />
          <path d="M136,76 Q142,96 136,118" stroke="#7a4a32" strokeWidth="1.5" fill="none" />
        </g>
      }
      hairFront={<path d="M70,66 Q70,50 84,48 Q96,58 118,52 Q130,54 130,66 Q124,58 110,60 Q92,62 76,58 Q72,62 70,66 Z" fill={hair} />}
      hat={
        <g>
          <path d="M68,58 Q66,20 100,18 Q134,20 132,58 Z" fill="#2aa9a1" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
          {[78, 88, 100, 112, 122].map((x) => <path key={x} d={`M${x},24 Q${x + (x - 100) * 0.05},40 ${x + (x - 100) * 0.1},56`} stroke="rgba(0,0,0,0.18)" strokeWidth="2" fill="none" />)}
          <rect x="66" y="50" width="68" height="12" rx="5" fill="#5CD6CE" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
          <circle cx="100" cy="16" r="8" fill="#e8f8f6" stroke="rgba(0,0,0,0.3)" />
        </g>
      }
      props={
        <g>
          {[128, 146, 164, 182].map((y) => (
            <path key={y} d={`M66,${y} Q100,${y + 6} 134,${y}`} stroke="rgba(0,0,0,0.35)" strokeWidth="2" fill="none" />
          ))}
          <path d="M66,120 Q72,112 84,110" stroke="#5CD6CE" strokeWidth="3" fill="none" />
          <path d="M134,120 Q128,112 116,110" stroke="#5CD6CE" strokeWidth="3" fill="none" />
          <rect x="112" y="132" width="16" height="8" rx="2" fill="#5CD6CE" />
          <path d="M84,104 Q100,112 116,104 L114,98 Q100,104 86,98 Z" fill="#0a2e4f" />
        </g>
      }
      armsUp="right"
      front={
        <g>
          {/* cold breath */}
          <g className="breath" transform="translate(114,92)">
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={i * 7} cy={-i * 3} r={4 + i * 2} fill="#eef8ff" opacity="0">
                <animate attributeName="opacity" values="0;0.55;0" dur="2.8s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
                <animate attributeName="cx" values={`${i * 7};${i * 7 + 14}`} dur="2.8s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
          {/* reference thermometer */}
          <g transform="translate(162,58) rotate(12)">
            <rect x="-11" y="-10" width="22" height="34" rx="5" fill="#f2c230" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
            <rect x="-8" y="-6" width="16" height="10" rx="1.5" fill="#cfe8d0" />
            <text x="0" y="1.6" fontSize="5.5" textAnchor="middle" fontFamily="monospace" fontWeight="700" fill="#0b3a1a">2.00°C</text>
            <circle cx="0" cy="14" r="3" fill="#333" />
            <path d="M0,-10 L0,-48" stroke="#c8ced6" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M-0.8,-12 L-0.8,-46" stroke="#fff" strokeWidth="0.8" opacity="0.7" />
          </g>
          {/* dry-block calibrator */}
          <g transform="translate(48,192)">
            <path d="M-8,-18 Q0,-26 8,-18" stroke="#333" strokeWidth="3" fill="none" />
            <rect x="-22" y="-16" width="44" height="30" rx="4" fill="#dfe4ea" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
            <rect x="-18" y="-12" width="18" height="8" rx="1" fill="#1a2a3a" />
            <text x="-9" y="-6" fontSize="5" textAnchor="middle" fill="#5CD6CE" fontFamily="monospace">-20.0</text>
            {[4, 10, 16].map((x) => <circle key={x} cx={x} cy="-8" r="2.5" fill="#555" />)}
            <rect x="-18" y="2" width="36" height="7" rx="2" fill="#003865" />
          </g>
        </g>
      }
    />
  )
}

export const Player = FirmwareDev

function SensitechMinion() {
  return (
    <g transform="translate(20,40) scale(0.82)">
      <Person
        skin="#e9b995"
        top="polo"
        topColor="#8c929c"
        shirtColor="#b4b9c1"
        pants="#4a4a52"
        eyes="beady"
        mouth="grin"
        brows="angry"
        hairFront={<path d="M72,56 Q80,34 110,36 Q96,40 90,52 Q84,44 72,56 Z" fill="#5a4636" />}
        front={
          <g>
            <rect x="140" y="170" width="34" height="24" rx="3" fill="#d6d2c4" stroke="#8a8676" strokeWidth="2" />
            <rect x="145" y="175" width="16" height="9" fill="#9fae88" />
            <path d="M174,182 Q190,190 182,215 Q176,232 190,240" stroke="#333" strokeWidth="3" fill="none" />
            <rect x="185" y="237" width="10" height="7" fill="#777" />
          </g>
        }
      />
    </g>
  )
}

function RogueLogger() {
  return (
    <g transform="translate(0,20)" className="hover-bob">
      <path d="M100,70 L100,42" stroke="#555" strokeWidth="3" />
      <circle cx="100" cy="38" r="5" fill="#e33" className="blink" />
      <rect x="52" y="70" width="96" height="120" rx="14" fill="#e6e3da" stroke="#9a968a" strokeWidth="3" />
      <rect x="64" y="84" width="72" height="46" rx="4" fill="#9fb28a" stroke="#6f7d5f" strokeWidth="2" />
      <path d="M74,98 L90,106 M126,98 L110,106" stroke="#1f2a17" strokeWidth="4" strokeLinecap="round" />
      <rect x="80" y="112" width="40" height="8" rx="2" fill="#1f2a17" />
      <text x="100" y="152" fontSize="12" textAnchor="middle" fill="#555" fontWeight="700" fontFamily="monospace">ERR 31°C</text>
      <circle cx="80" cy="172" r="7" fill="#c33" />
      <circle cx="100" cy="172" r="7" fill="#3a3" />
      <circle cx="120" cy="172" r="7" fill="#444" />
      <path d="M70,190 L62,222 M130,190 L138,222" stroke="#555" strokeWidth="5" strokeLinecap="round" />
      <path d="M52,120 L30,100 M148,120 L170,100" stroke="#555" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="100" cy="240" rx="40" ry="6" fill="rgba(0,0,0,0.25)" />
    </g>
  )
}

function QAEmployee() {
  return (
    <Person
      skin="#f3cfb3"
      top="labcoat"
      topColor="#f7f9fb"
      shirtColor="#7aa6c2"
      pants="#3b4252"
      eyes="normal"
      mouth="flat"
      brows="raised"
      glasses="square"
      hairBack={<path d="M66,80 Q60,40 100,30 Q140,40 134,80 Z" fill="#8a5a3a" />}
      hairFront={
        <g>
          <path d="M64,58 Q66,20 100,20 Q134,20 136,58 Q120,46 100,46 Q80,46 64,58 Z" fill="#bfe0f5" />
          {Array.from({ length: 10 }).map((_, i) => <circle key={i} cx={70 + i * 6.6} cy={52 - Math.sin((i / 9) * Math.PI) * 20} r="1.2" fill="#8fbcd8" />)}
        </g>
      }
      armsUp="left"
      front={clipboard(46, 64, 1, 'cross')}
    />
  )
}

function SalesRep() {
  return (
    <Person
      skin="#e2ac86"
      top="suit"
      topColor="#6e3b2e"
      tie="#e0b020"
      eyes="happy"
      mouth="grin"
      brows="raised"
      hairFront={slickHair('#1b1b1b')}
      armsUp="right"
      front={
        <g transform="translate(160,46) rotate(10)">
          <rect x="-18" y="-24" width="36" height="46" fill="#fff" stroke="#bbb" />
          <rect x="-18" y="-24" width="36" height="14" fill="#e07020" />
          <text x="0" y="-13" fontSize="7" textAnchor="middle" fill="#fff" fontWeight="900">SALE</text>
          <text x="0" y="6" fontSize="12" textAnchor="middle" fill="#e07020" fontWeight="900">-10%</text>
          <text x="0" y="16" fontSize="4.5" textAnchor="middle" fill="#666">*first order only</text>
        </g>
      }
    />
  )
}

function LeadAuditor() {
  return (
    <g transform="translate(-10,-12) scale(1.1)">
      <Person
        skin="#efd0bb"
        top="labcoat"
        topColor="#e8ecf0"
        shirtColor="#555"
        pants="#2f2f38"
        eyes="normal"
        mouth="frown"
        brows="angry"
        browColor="#777"
        glasses="half"
        wrinkles
        hairBack={<circle cx="100" cy="30" r="16" fill="#9a9a9a" />}
        hairFront={<path d="M68,66 Q66,32 100,32 Q134,32 132,66 Q124,44 100,44 Q76,44 68,66 Z" fill="#9a9a9a" />}
        armsUp="both"
        front={
          <g>
            {clipboard(40, 50, 1.3, 'cross')}
            <g transform="translate(162,48) rotate(25)">
              <circle cx="0" cy="-10" r="14" fill="rgba(180,220,255,0.35)" stroke="#4a3a2a" strokeWidth="4" />
              <rect x="-3" y="4" width="6" height="22" rx="2" fill="#4a3a2a" />
            </g>
          </g>
        }
      />
    </g>
  )
}

function DirectorPC() {
  // Fit older woman with voluminous dark hair, sporty and relentlessly upbeat.
  const hair = '#241612'
  const curls: [number, number, number][] = [
    [58, 60, 22], [52, 90, 20], [58, 118, 18], [142, 60, 22], [148, 90, 20], [142, 118, 18],
    [72, 32, 22], [100, 22, 24], [128, 32, 22], [64, 140, 14], [136, 140, 14], [84, 20, 18], [116, 20, 18],
  ]
  return (
    <g transform="translate(-20,-18) scale(1.2)">
      <Person
        skin="#e8b896"
        top="sport"
        topColor="#8e2a5c"
        pants="#1f1f28"
        shoes="#f4f4f4"
        slim
        eyes="happy"
        mouth="grin"
        brows="raised"
        browColor="#241612"
        wrinkles
        earrings="#e9c46a"
        hairBack={
          <g>
            {curls.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={hair} />)}
            {curls.slice(0, 8).map(([x, y, r], i) => <path key={`h${i}`} d={`M${x - r * 0.5},${y - r * 0.3} q${r * 0.4},-${r * 0.5} ${r * 0.8},0`} stroke="#5b4038" strokeWidth="2" fill="none" />)}
            <path d="M58,120 Q50,140 62,150" stroke="#8c8c8c" strokeWidth="2" fill="none" opacity="0.8" />
          </g>
        }
        hairFront={
          <g>
            <path d="M66,66 Q62,26 100,24 Q138,26 134,66 Q128,40 108,38 Q96,50 80,44 Q70,50 66,66 Z" fill={hair} />
            <path d="M104,30 Q116,34 124,46" stroke="#6b4a40" strokeWidth="2.5" fill="none" />
            <path d="M84,32 Q76,38 72,50" stroke="#8c8c8c" strokeWidth="2" fill="none" />
          </g>
        }
        armsUp="right"
        props={
          <g>
            {lanyard('P&C', '#e0457b')}
            <rect x="46" y="176" width="14" height="8" rx="2" fill="#111" />
            <rect x="48" y="177" width="10" height="6" rx="1" fill="#3de0c0" />
          </g>
        }
        front={
          <g>
            {clipboard(162, 44, 1.05, 'heart')}
            <g transform="translate(46,206)">
              <path d="M-8,-12 Q0,-22 8,-12" stroke="#333" strokeWidth="4" fill="none" />
              <circle cx="0" cy="0" r="13" fill="#2b2b2b" />
              <text x="0" y="4" fontSize="9" textAnchor="middle" fill="#e9c46a" fontWeight="900">16</text>
            </g>
          </g>
        }
      />
    </g>
  )
}

function RocheManager() {
  return (
    <Person
      skin="#f2c9a8"
      top="suit"
      topColor="#1f4e9a"
      shirtColor="#ffffff"
      pants="#2a3348"
      eyes="normal"
      mouth="flat"
      brows="normal"
      hairFront={shortHair('#7a5230')}
      props={lanyard('VISITOR', '#1f4e9a')}
      armsUp="left"
      front={
        <g transform="translate(42,58) rotate(-8)">
          <rect x="-22" y="-18" width="44" height="34" rx="2" fill="#fff" stroke="#999" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={-18 + i * 6} y={-12 + i * 7} width={16 + (i % 2) * 6} height="5" fill={['#1f4e9a', '#5CD6CE', '#e07020', '#c33'][i]} />)}
        </g>
      }
    />
  )
}

function Consultant() {
  return (
    <Person
      skin="#f5d2b8"
      top="suit"
      topColor="#1c2a4a"
      tie="#6aa0ff"
      eyes="normal"
      mouth="smirk"
      brows="raised"
      browColor="#c9a14a"
      hairFront={slickHair('#d9b35a')}
      armsUp="right"
      front={
        <g transform="translate(162,50)">
          <rect x="-24" y="-18" width="48" height="34" rx="2" fill="#fff" stroke="#888" strokeWidth="2" />
          <text x="0" y="-8" fontSize="6" textAnchor="middle" fontWeight="900" fill="#1c2a4a">SYNERGY</text>
          <path d="M-18,10 L-8,2 L0,6 L16,-6" stroke="#2a9d5c" strokeWidth="2.5" fill="none" />
          <text x="18" y="13" fontSize="5" fill="#999">1/200</text>
        </g>
      }
    />
  )
}

function Procurement() {
  return (
    <Person
      skin="#f0c8ae"
      top="cardigan"
      topColor="#c9a227"
      shirtColor="#f4f1e6"
      pants="#5a4a3a"
      eyes="normal"
      mouth="pursed"
      brows="raised"
      browColor="#888"
      glasses="round"
      hairFront={<path d="M68,64 Q64,28 100,28 Q136,28 132,64 Q128,40 100,42 Q72,40 68,64 Z" fill="#b8b8b8" />}
      hairBack={<path d="M66,70 Q62,98 74,104 L70,70 Z M134,70 Q138,98 126,104 L130,70 Z" fill="#b8b8b8" />}
      armsUp="left"
      front={
        <g transform="translate(40,58)">
          <rect x="-16" y="-22" width="32" height="44" rx="4" fill="#333" />
          <rect x="-12" y="-18" width="24" height="10" fill="#b8d8a8" />
          <text x="10" y="-10" fontSize="7" textAnchor="end" fontFamily="monospace" fill="#222">-40%</text>
          {[0, 1, 2, 3].map((r) => [0, 1, 2].map((col) => <rect key={`${r}${col}`} x={-12 + col * 9} y={-4 + r * 6} width="6" height="4" rx="1" fill={col === 2 && r === 3 ? '#e07020' : '#888'} />))}
        </g>
      }
    />
  )
}

function RocheVP() {
  return (
    <g transform="translate(-12,-16) scale(1.12)">
      <Person
        skin="#eab996"
        top="suit"
        topColor="#3a3d46"
        tie="#b2182b"
        eyes="normal"
        mouth="smirk"
        brows="angry"
        glasses="sun"
        hairFront={<path d="M68,64 Q64,28 104,28 Q136,30 132,64 Q126,42 96,42 Q80,44 68,64 Z" fill="#c8c8c8" />}
        props={
          <g stroke="#4a4d56" strokeWidth="1" opacity="0.6">
            {[70, 80, 120, 130].map((x) => <path key={x} d={`M${x},112 L${x},200`} />)}
          </g>
        }
        armsUp="right"
        front={
          <g transform="translate(140,62) rotate(-20)">
            <rect x="-6" y="-16" width="14" height="28" rx="3" fill="#111" />
            <rect x="-4" y="-13" width="10" height="20" fill="#4a90e2" />
          </g>
        }
      />
    </g>
  )
}

function CTO() {
  // Post-launch-party CTO: loosened tie, party hat, laptop full of stickers and a "coffee".
  return (
    <g transform="translate(-20,-20) scale(1.2)">
      <g className="sway">
        <Person
          skin="#f0bea0"
          top="shirt"
          topColor="#e9eef5"
          tie="#2f62b7"
          pants="#303a4d"
          shoes="#6a4a2a"
          eyes="drunk"
          mouth="goofy"
          brows="worried"
          blush
          stubble="#6d5a4a"
          hairFront={messyHair('#4a3526')}
          hat={
            <g transform="rotate(-24 100 30)">
              <path d="M84,34 L100,-6 L116,34 Z" fill="#e0457b" />
              <path d="M88,24 L112,24 M92,14 L108,14" stroke="#ffd166" strokeWidth="3" />
              <circle cx="100" cy="-8" r="5" fill="#ffd166" />
            </g>
          }
          props={
            <g>
              <path d="M72,140 Q86,150 80,170" stroke="#d0d6de" strokeWidth="2" fill="none" />
              <ellipse cx="116" cy="150" rx="9" ry="6" fill="#d5c07a" opacity="0.6" />
              <path d="M98,110 L90,136" stroke="#2f62b7" strokeWidth="8" strokeLinecap="round" />
            </g>
          }
          armsUp="right"
          front={
            <g>
              <g transform="translate(164,50) rotate(18)">
                <path d="M-14,-18 L14,-18 L10,20 L-10,20 Z" fill="rgba(255,255,255,0.7)" stroke="#bbb" strokeWidth="2" />
                <path d="M-12,-8 L12,-8 L9,18 L-9,18 Z" fill="#f2a900" />
                <ellipse cx="0" cy="-10" rx="13" ry="5" fill="#fffbe8" />
                <text x="0" y="8" fontSize="5" textAnchor="middle" fill="#7a4a10" fontWeight="700">"COFFEE"</text>
              </g>
              <g transform="translate(42,184) rotate(-12)">
                <rect x="-26" y="-18" width="52" height="34" rx="3" fill="#8a929e" />
                <circle cx="-14" cy="-8" r="5" fill="#f25f5c" />
                <rect x="-2" y="-12" width="14" height="8" rx="2" fill="#ffd166" />
                <circle cx="14" cy="6" r="6" fill="#5CD6CE" />
                <path d="M-18,4 l6,6 l8,-10" stroke="#fff" strokeWidth="2" fill="none" />
                <text x="-10" y="12" fontSize="5" fill="#fff" fontWeight="900">RUST</text>
              </g>
            </g>
          }
        />
        <g className="hic">
          <text x="150" y="20" fontSize="14" fill="#fff" fontWeight="900" opacity="0.85">*hic*</text>
        </g>
      </g>
    </g>
  )
}

function BoardMember() {
  return (
    <Person
      skin="#f1d0bd"
      top="suit"
      topColor="#5b5f66"
      bowtie="#7a1f2b"
      eyes="normal"
      mouth="frown"
      brows="bushy"
      browColor="#eeeeee"
      mustache="#eeeeee"
      wrinkles
      hairFront={
        <g>
          {sideHair('#eeeeee')}
          {baldShine}
          <circle cx="112" cy="70" r="10" fill="rgba(200,230,255,0.15)" stroke="#c9a227" strokeWidth="2.5" />
          <path d="M122,72 Q128,100 124,120" stroke="#c9a227" strokeWidth="1" fill="none" />
        </g>
      }
      front={
        <g>
          <path d="M156,190 L162,120" stroke="#3a2a1a" strokeWidth="6" strokeLinecap="round" />
          <path d="M162,120 Q164,110 172,112" stroke="#3a2a1a" strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>
      }
    />
  )
}

function VC() {
  return (
    <Person
      skin="#eec3a2"
      top="fleece"
      topColor="#26324a"
      pants="#4b6a8f"
      shoes="#f2f2f2"
      eyes="normal"
      mouth="grin"
      brows="raised"
      hairFront={
        <g>
          {shortHair('#3a2a1c')}
          <g transform="translate(0,-8)">
            <path d="M74,40 L98,40 L96,50 Q88,54 78,50 Z" fill="#222" />
            <path d="M102,40 L126,40 L122,50 Q112,54 104,50 Z" fill="#222" />
            <path d="M98,42 L102,42" stroke="#222" strokeWidth="2" />
          </g>
        </g>
      }
      hat={
        <g>
          <rect x="64" y="78" width="5" height="10" rx="2.5" fill="#fff" />
          <rect x="131" y="78" width="5" height="10" rx="2.5" fill="#fff" />
        </g>
      }
      front={
        <g>
          <g transform="translate(156,178) rotate(8)">
            <rect x="-14" y="-18" width="28" height="36" fill="#fff" stroke="#aaa" />
            <text x="0" y="-8" fontSize="5" textAnchor="middle" fontWeight="900">TERM SHEET</text>
            {[0, 1, 2, 3].map((i) => <path key={i} d={`M-10,${-2 + i * 5} L10,${-2 + i * 5}`} stroke="#ccc" strokeWidth="2" />)}
            <text x="0" y="16" fontSize="5" textAnchor="middle" fill="#d33" fontWeight="900">3x PREF</text>
          </g>
        </g>
      }
    />
  )
}

function SensitechDirector() {
  return (
    <g transform="translate(-8,-12) scale(1.08)">
      <Person
        skin="#e6b28c"
        top="suit"
        topColor="#4a3a30"
        tie="#e07020"
        eyes="normal"
        mouth="smirk"
        brows="angry"
        mustache="#3a2a1c"
        hairFront={shortHair('#3a2a1c')}
        armsUp="right"
        front={
          <g>
            <rect x="152" y="48" width="6" height="30" rx="2" fill="#333" transform="rotate(30 155 60)" />
            <path d="M166,40 L196,6" stroke="#f33" strokeWidth="2" opacity="0.9" />
            <circle cx="196" cy="6" r="3" fill="#f33" />
          </g>
        }
      />
    </g>
  )
}

function Inspector() {
  return (
    <g transform="translate(-12,-16) scale(1.12)">
      <Person
        skin="#e9c2a4"
        top="suit"
        topColor="#23262d"
        tie="#23262d"
        shirtColor="#e8e8e8"
        eyes="normal"
        mouth="flat"
        brows="angry"
        glasses="square"
        hat={
          <g>
            <ellipse cx="100" cy="42" rx="46" ry="9" fill="#2b2b2b" />
            <path d="M72,42 Q72,12 100,12 Q128,12 128,42 Z" fill="#2b2b2b" />
            <path d="M72,36 L128,36" stroke="#7a1f2b" strokeWidth="5" />
          </g>
        }
        props={
          <g>
            <path d="M120,130 l8,-4 l8,4 l0,10 q-8,8 -16,0 z" fill="#c9a227" stroke="#8a6a10" />
            <text x="128" y="138" fontSize="6" textAnchor="middle" fill="#5a4a10" fontWeight="900">★</text>
          </g>
        }
        armsUp="left"
        front={
          <g transform="translate(40,58)">
            <rect x="-20" y="-24" width="40" height="50" rx="3" fill="#1f3b73" />
            <rect x="-16" y="-24" width="4" height="50" fill="#132850" />
            <text x="2" y="0" fontSize="6" textAnchor="middle" fill="#fff" fontWeight="900">FINDINGS</text>
            <text x="2" y="10" fontSize="6" textAnchor="middle" fill="#fff">VOL. 7</text>
          </g>
        }
      />
    </g>
  )
}

function YesMan() {
  return (
    <g transform="translate(26,56) scale(0.74)">
      <g className="nod">
        <Person
          skin="#f0c8a8"
          top="suit"
          topColor="#6a6f7a"
          tie="#5CD6CE"
          eyes="happy"
          mouth="grin"
          brows="raised"
          hairFront={slickHair('#6b4a2a')}
          armsUp="both"
          front={
            <g>
              <text x="36" y="56" fontSize="20">👍</text>
              <text x="146" y="56" fontSize="20">👍</text>
            </g>
          }
        />
      </g>
    </g>
  )
}

function CEO() {
  // Clean bald head, glasses, barely-there stubble, puffy vest. Insulated against feedback.
  return (
    <g transform="translate(-24,-24) scale(1.24)">
      <Person
        skin="#eab796"
        top="vest"
        topColor="#1c2233"
        shirtColor="#a9c7e8"
        pants="#c2b59b"
        shoes="#5a3a24"
        eyes="normal"
        mouth="smile"
        brows="normal"
        browColor="#6b5444"
        glasses="square"
        stubble="#d4a585"
        hairFront={baldShine}
        props={
          <g>
            <rect x="120" y="126" width="16" height="6" rx="2" fill="#5CD6CE" opacity="0.9" />
          </g>
        }
        armsUp="right"
        front={
          <g>
            <g transform="translate(162,42) rotate(15)">
              <rect x="-5" y="-4" width="10" height="30" rx="4" fill="#222" />
              <ellipse cx="0" cy="-8" rx="9" ry="10" fill="#555" />
              {[-4, 0, 4].map((x) => <path key={x} d={`M${x},-16 L${x},0`} stroke="#777" strokeWidth="1" />)}
            </g>
            <text x="100" y="118" fontSize="0">.</text>
          </g>
        }
      />
    </g>
  )
}

function Peter() {
  // The Saltpeter Guardian: a hulking golem of potassium-nitrate crystals.
  const crystal = (d: string, shade: string, k: number) => <path key={k} d={d} fill={shade} stroke="#8fa3b8" strokeWidth="1.5" strokeLinejoin="round" />
  return (
    <g transform="translate(-30,-40) scale(1.3)">
      <g className="breathe">
        {/* sacks */}
        <g>
          <path d="M8,250 Q2,216 22,208 Q40,202 50,214 Q58,236 50,252 Z" fill="#c8b48a" stroke="#8a7650" strokeWidth="2" />
          <text x="29" y="238" fontSize="9" textAnchor="middle" fill="#6a5630" fontWeight="900">KNO₃</text>
          <path d="M192,252 Q200,220 182,210 Q164,204 154,216 Q148,238 156,252 Z" fill="#c8b48a" stroke="#8a7650" strokeWidth="2" />
          <text x="175" y="240" fontSize="9" textAnchor="middle" fill="#6a5630" fontWeight="900">KNO₃</text>
        </g>
        {/* legs */}
        {crystal('M68,200 L90,196 L94,250 L62,252 Z', '#dfe7ef', 1)}
        {crystal('M110,196 L132,200 L138,252 L106,250 Z', '#cfd9e4', 2)}
        {/* torso */}
        {crystal('M50,110 L100,92 L150,110 L160,170 L134,206 L66,206 L40,170 Z', '#eef3f8', 3)}
        {crystal('M100,92 L150,110 L128,150 L100,130 Z', '#d6e0ea', 4)}
        {crystal('M50,110 L100,92 L100,130 L72,150 Z', '#f8fbfd', 5)}
        {crystal('M72,150 L100,130 L128,150 L118,190 L82,190 Z', '#e3ebf2', 6)}
        {/* glowing core */}
        <path d="M100,140 L112,160 L100,180 L88,160 Z" fill="#ff9a3c" className="glow" />
        {/* arms */}
        {crystal('M44,116 L20,150 L14,196 L34,200 L44,160 L58,136 Z', '#dbe4ed', 7)}
        {crystal('M156,116 L182,146 L186,180 L168,184 L162,152 L142,136 Z', '#d2dce7', 8)}
        {/* spikes */}
        {crystal('M60,112 L52,78 L74,104 Z', '#ffffff', 9)}
        {crystal('M140,112 L150,74 L128,104 Z', '#f2f6fa', 10)}
        {crystal('M84,98 L90,70 L98,94 Z', '#ffffff', 11)}
        {/* pickaxe */}
        <g transform="translate(176,160) rotate(-30)">
          <rect x="-3" y="-70" width="7" height="100" rx="2" fill="#6b4a2a" />
          <path d="M-36,-66 Q0,-86 38,-66 L34,-60 Q0,-76 -32,-60 Z" fill="#7d8894" stroke="#4a5360" strokeWidth="2" />
        </g>
        {/* head */}
        {crystal('M70,60 L84,30 L116,30 L130,60 L120,92 L80,92 Z', '#f4f8fb', 12)}
        {crystal('M84,30 L100,22 L116,30 L100,42 Z', '#ffffff', 13)}
        {/* helmet */}
        <path d="M66,48 Q66,14 100,12 Q134,14 134,48 Z" fill="#f2c230" stroke="#b08a10" strokeWidth="2" />
        <rect x="60" y="44" width="80" height="8" rx="3" fill="#e0b020" stroke="#b08a10" strokeWidth="2" />
        <circle cx="100" cy="30" r="9" fill="#fff6c8" stroke="#b08a10" strokeWidth="2" />
        <path d="M100,30 L60,-10 L140,-10 Z" fill="#fff6c8" opacity="0.18" />
        {/* eyes + stern crystal mustache */}
        <path d="M80,64 L96,68 L94,74 L80,72 Z" fill="#ff7a1a" className="glow" />
        <path d="M120,64 L104,68 L106,74 L120,72 Z" fill="#ff7a1a" className="glow" />
        <path d="M78,80 L100,76 L122,80 L112,86 L100,82 L88,86 Z" fill="#c9d4df" stroke="#8fa3b8" />
        {/* name plate */}
        <rect x="76" y="194" width="48" height="14" rx="2" fill="#6b4a2a" stroke="#3a2a1a" />
        <text x="100" y="204.5" fontSize="9" textAnchor="middle" fill="#f2c230" fontWeight="900" letterSpacing="2">PETER</text>
      </g>
    </g>
  )
}

const ART: Record<string, () => ReactNode> = {
  player: FirmwareDev,
  player_fw: FirmwareDev,
  player_hw: HardwareEngineer,
  player_cal: CalibrationSpecialist,
  sensitech_minion: SensitechMinion,
  temptale: RogueLogger,
  qa_employee: QAEmployee,
  sensitech_rep: SalesRep,
  lead_auditor: LeadAuditor,
  boss_pc: DirectorPC,
  roche_manager: RocheManager,
  consultant: Consultant,
  procurement: Procurement,
  roche_vp: RocheVP,
  boss_cto: CTO,
  board_member: BoardMember,
  vc: VC,
  sensitech_director: SensitechDirector,
  fda_inspector: Inspector,
  yes_man: YesMan,
  boss_ceo: CEO,
  boss_peter: Peter,
  boss_forklift: ForkliftFrank,
  boss_cfo: CfoArt,
  boss_audit: GlobalAudit,
  pallet_golem: PalletGolem,
  office_printer: OfficePrinter,
  paper_minion: PaperMinion,
  recruiter: Recruiter,
  influencer: Influencer,
  consulting_partner: ConsultingPartner,
  junior_consultant: JuniorConsultant,
  comp_intern: Intern,
  comp_duck: Duck,
  comp_qa: FriendlyQA,
  comp_it: ITGuy,
  comp_dog: OfficeDog,
  comp_student: SummerStudent,
}

export function Portrait({ id, size = 180, flip = false }: { id: string; size?: number; flip?: boolean }) {
  const Art = ART[id] ?? FirmwareDev
  const fid = `pf${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="-20 -20 240 290" width={size} height={size * (290 / 240)} className="portrait" aria-hidden>
      <defs>
        <filter id={fid} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          {/* cool rim light (top-left) and soft drop shadow behind the figure */}
          <feDropShadow dx="-2" dy="-1.5" stdDeviation="0.6" floodColor="#cfefff" floodOpacity="0.55" result="rim" />
          <feDropShadow in="rim" dx="3" dy="5" stdDeviation="3" floodColor="#000" floodOpacity="0.4" result="lit" />
          {/* painterly grain, clipped to the figure */}
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.4 0.22" result="grain" />
          <feComposite in="grain" in2="SourceAlpha" operator="in" result="grainIn" />
          <feMerge>
            <feMergeNode in="lit" />
            <feMergeNode in="grainIn" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="100" cy="254" rx="62" ry="9" fill="rgba(0,0,0,0.3)" />
      <g filter={`url(#${fid})`}>
        <g transform={flip ? 'translate(200,0) scale(-1,1)' : undefined}>
          <Art />
        </g>
      </g>
    </svg>
  )
}
