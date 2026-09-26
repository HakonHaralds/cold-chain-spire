import { Person } from './Person'

/* Companion portraits (M6). Same 200×260 canvas conventions as the other portraits. */

const badge = (text: string, color: string) => (
  <g>
    <path d="M90,108 L97,146 M110,108 L103,146" stroke={color} strokeWidth="3" />
    <rect x="89" y="144" width="22" height="26" rx="2" fill="#fff" stroke="#999" />
    <rect x="92" y="148" width="16" height="9" fill="#cfd8e3" />
    <text x="100" y="166" fontSize="5" textAnchor="middle" fill="#333" fontWeight="800">
      {text}
    </text>
  </g>
)

export function Intern() {
  return (
    <Person
      skin="#f3cdb0"
      top="polo"
      topColor="#5cd6ce"
      shirtColor="#e9fbf9"
      pants="#3a4254"
      shoes="#f0f0f0"
      eyes="wide"
      mouth="grin"
      brows="raised"
      iris="#3b6ea5"
      hairFront={
        <path d="M67,70 Q62,34 90,28 Q100,20 112,28 Q138,32 133,70 Q128,48 116,44 Q106,52 96,44 Q82,50 74,48 Q68,56 67,70 Z" fill="#c98b4a" />
      }
      props={badge('INTERN', '#e0457b')}
      armsUp="right"
      front={
        <g transform="translate(160,52) rotate(8)">
          <rect x="-16" y="-22" width="32" height="44" rx="4" fill="#222" />
          <rect x="-13" y="-18" width="26" height="34" rx="2" fill="#dff6ff" />
          <path d="M-9,-10 L9,-10 M-9,-4 L6,-4 M-9,2 L9,2 M-9,8 L3,8" stroke="#2f62b7" strokeWidth="2" />
          <text x="0" y="14" fontSize="5" textAnchor="middle" fill="#e0457b" fontWeight="900">
            JIRA-9001
          </text>
        </g>
      }
    />
  )
}

export function Duck() {
  return (
    <g transform="translate(10,60)" className="hover-bob">
      <ellipse cx="90" cy="178" rx="70" ry="10" fill="rgba(0,0,0,0.25)" />
      {/* body */}
      <path d="M22,120 Q20,170 80,176 Q150,180 160,130 Q164,104 140,110 Q124,114 118,120 Q110,96 80,100 Q40,100 22,120 Z" fill="#ffd23f" stroke="#c99a00" strokeWidth="3" />
      <path d="M40,132 Q70,150 110,138" stroke="#e8b400" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M150,118 Q160,108 170,114" stroke="#c99a00" strokeWidth="3" fill="none" />
      {/* head */}
      <circle cx="78" cy="70" r="40" fill="#ffd23f" stroke="#c99a00" strokeWidth="3" />
      <path d="M50,52 Q62,38 84,40" stroke="#fff4b0" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* beak */}
      <path d="M104,74 Q134,70 136,82 Q132,94 104,90 Z" fill="#ff8c1a" stroke="#c45d00" strokeWidth="2.5" />
      <path d="M106,83 Q120,84 134,82" stroke="#c45d00" strokeWidth="2" fill="none" />
      {/* eye */}
      <ellipse cx="88" cy="62" rx="9" ry="11" fill="#fff" />
      <circle cx="91" cy="63" r="6" fill="#1b1b1b" />
      <circle cx="93" cy="60" r="2" fill="#fff" />
      {/* tiny headset: it is on call */}
      <path d="M44,58 Q48,24 86,28" stroke="#333" strokeWidth="4" fill="none" />
      <rect x="38" y="56" width="12" height="18" rx="4" fill="#333" />
    </g>
  )
}

export function FriendlyQA() {
  return (
    <Person
      skin="#e0a982"
      top="labcoat"
      topColor="#f7f9fb"
      shirtColor="#5cd6ce"
      pants="#394150"
      eyes="happy"
      mouth="smile"
      brows="raised"
      glasses="round"
      hairBack={<path d="M64,86 Q56,40 100,30 Q144,40 136,86 Q140,120 128,126 L72,126 Q60,120 64,86 Z" fill="#2b1a14" />}
      hairFront={<path d="M66,64 Q66,26 100,26 Q134,26 134,64 Q120,40 100,42 Q82,40 66,64 Z" fill="#2b1a14" />}
      armsUp="right"
      front={
        <g>
          <g transform="translate(40,178)">
            <rect x="-14" y="-18" width="28" height="36" rx="3" fill="#b0763a" />
            <rect x="-11" y="-14" width="22" height="29" fill="#fff" />
            {[-8, -1, 6].map((y) => (
              <path key={y} d={`M-8,${y} l3,3 l5,-6`} stroke="#2a9d5c" strokeWidth="2" fill="none" />
            ))}
          </g>
          <text x="152" y="62" fontSize="26">
            👍
          </text>
        </g>
      }
    />
  )
}

export function ITGuy() {
  return (
    <Person
      skin="#efc3a1"
      top="hoodie"
      topColor="#3a3f4b"
      pants="#2b3040"
      shoes="#6a4a2a"
      eyes="normal"
      mouth="smirk"
      brows="normal"
      stubble="#5a4030"
      glasses="square"
      hairFront={
        <path d="M68,66 Q64,30 100,28 Q136,30 132,66 Q126,46 110,44 Q100,48 90,44 Q74,46 68,66 Z" fill="#5a4030" />
      }
      hat={
        <g>
          <path d="M66,64 Q64,26 100,24 Q136,26 134,64" stroke="#222" strokeWidth="5" fill="none" />
          <rect x="58" y="58" width="14" height="22" rx="5" fill="#222" />
          <path d="M66,78 Q70,96 88,98" stroke="#222" strokeWidth="3" fill="none" />
          <circle cx="90" cy="98" r="3" fill="#e33" />
        </g>
      }
      armsUp="right"
      front={
        <g transform="translate(162,54) rotate(-18)">
          <rect x="-8" y="-6" width="16" height="22" rx="3" fill="#eee" stroke="#999" />
          <rect x="-5" y="-14" width="3" height="10" fill="#bbb" />
          <rect x="2" y="-14" width="3" height="10" fill="#bbb" />
          <path d="M0,16 Q4,40 -10,60" stroke="#333" strokeWidth="3" fill="none" />
        </g>
      }
    />
  )
}

export function OfficeDog() {
  return (
    <g transform="translate(0,40)">
      <ellipse cx="100" cy="212" rx="70" ry="10" fill="rgba(0,0,0,0.25)" />
      {/* tail */}
      <path d="M40,176 Q10,150 22,120" stroke="#c98b3a" strokeWidth="14" strokeLinecap="round" fill="none" className="wag" />
      {/* body (sitting) */}
      <path d="M50,210 Q36,150 70,120 Q100,98 128,118 Q156,140 150,210 Z" fill="#dca258" stroke="#9a6a2a" strokeWidth="3" />
      <path d="M86,130 Q100,170 96,208" stroke="#f3d3a0" strokeWidth="18" strokeLinecap="round" fill="none" />
      {/* front legs */}
      <rect x="78" y="168" width="16" height="44" rx="7" fill="#dca258" stroke="#9a6a2a" strokeWidth="2.5" />
      <rect x="106" y="168" width="16" height="44" rx="7" fill="#dca258" stroke="#9a6a2a" strokeWidth="2.5" />
      <ellipse cx="86" cy="212" rx="11" ry="6" fill="#f3d3a0" />
      <ellipse cx="114" cy="212" rx="11" ry="6" fill="#f3d3a0" />
      {/* collar + badge */}
      <path d="M72,112 Q100,128 130,112" stroke="#005eb8" strokeWidth="8" fill="none" />
      <circle cx="101" cy="126" r="7" fill="#f2c230" stroke="#b08a10" />
      <text x="101" y="129" fontSize="6" textAnchor="middle" fill="#5a4a10" fontWeight="900">
        SEC
      </text>
      {/* head */}
      <path d="M62,60 Q58,20 100,18 Q142,20 138,60 Q140,100 100,108 Q60,100 62,60 Z" fill="#dca258" stroke="#9a6a2a" strokeWidth="3" />
      {/* ears */}
      <path d="M64,34 Q40,40 46,84 Q56,86 66,62 Z" fill="#b07a38" stroke="#7a5020" strokeWidth="2.5" />
      <path d="M136,34 Q160,40 154,84 Q144,86 134,62 Z" fill="#b07a38" stroke="#7a5020" strokeWidth="2.5" />
      {/* muzzle */}
      <ellipse cx="100" cy="80" rx="24" ry="18" fill="#f3d3a0" />
      <ellipse cx="100" cy="70" rx="9" ry="6" fill="#2b1a14" />
      <path d="M100,76 L100,84 M100,84 Q92,90 86,86 M100,84 Q108,90 114,86" stroke="#2b1a14" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M96,88 Q100,100 106,90" fill="#e8747c" />
      {/* eyes */}
      <circle cx="84" cy="52" r="6" fill="#2b1a14" />
      <circle cx="116" cy="52" r="6" fill="#2b1a14" />
      <circle cx="86" cy="50" r="2" fill="#fff" />
      <circle cx="118" cy="50" r="2" fill="#fff" />
    </g>
  )
}

export function SummerStudent() {
  return (
    <Person
      skin="#c98e66"
      top="fleece"
      topColor="#6a4c93"
      pants="#4b6a8f"
      shoes="#f2f2f2"
      eyes="normal"
      mouth="smile"
      brows="raised"
      glasses="round"
      iris="#3a2a1a"
      hairFront={
        <g fill="#1b1b1b">
          <path d="M66,66 Q60,28 100,24 Q140,28 134,66 Q128,44 100,42 Q72,44 66,66 Z" />
          {[70, 82, 96, 110, 124].map((x) => (
            <circle key={x} cx={x} cy={30 + Math.abs(x - 97) / 4} r="9" />
          ))}
        </g>
      }
      props={
        <g>
          <path d="M60,114 L56,190 M140,114 L144,190" stroke="#2b2b2b" strokeWidth="6" />
        </g>
      }
      armsUp="left"
      front={
        <g transform="translate(40,54) rotate(-10)">
          <rect x="-18" y="-24" width="36" height="46" rx="2" fill="#fff" stroke="#999" />
          <rect x="-18" y="-24" width="36" height="10" fill="#005eb8" />
          <text x="0" y="-17" fontSize="5.5" textAnchor="middle" fill="#fff" fontWeight="900">
            DATASHEET
          </text>
          {[-8, -2, 4, 10, 16].map((y) => (
            <path key={y} d={`M-13,${y} L13,${y}`} stroke="#bbb" strokeWidth="2" />
          ))}
          <path d="M-12,4 L12,4" stroke="#f2c230" strokeWidth="4" opacity="0.7" />
        </g>
      }
    />
  )
}
