import { DEF, KEYWORDS, cardCost, keywordsIn } from '../game/cards'

interface Props {
  id: string
  upgraded?: boolean
  playable?: boolean
  selected?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  small?: boolean
  price?: number
  style?: React.CSSProperties
  className?: string
  hotkey?: number
  uid?: string
  /** Where keyword tips appear when hovered. */
  tips?: 'right' | 'left' | 'above' | 'none'
  /** Maps a base damage number to the final number (Strength, Weak, Vulnerable). */
  dmgMod?: (base: number) => number
}

/** Highlight "Deal N damage" numbers that are changed by modifiers: green if higher, red if lower. */
function withDamage(text: string, mod: (n: number) => number) {
  // Skip "per X" damage: modifiers apply to the total, so the badge on the enemy shows that instead.
  const parts = text.split(/(\b[Dd]eal \d+ damage(?! (?:for|per)\b))/)
  return parts.map((p, i) => {
    const m = p.match(/^([Dd]eal )(\d+)( damage)$/)
    if (!m) return p
    const base = Number(m[2])
    const v = mod(base)
    return (
      <span key={i}>
        {m[1]}
        <b className={v > base ? 'dmg-up' : v < base ? 'dmg-down' : ''}>{v}</b>
        {m[3]}
      </span>
    )
  })
}

const TYPE_LABEL: Record<string, string> = { attack: 'Attack', skill: 'Skill', power: 'Power', status: 'Status', curse: 'Curse' }
const CLS_LABEL: Record<string, string> = { fw: 'Firmware', hw: 'Hardware', cal: 'Calibration' }

export function Card({ id, upgraded = false, playable = true, selected, onClick, small, price, style, className = '', hotkey, uid, tips = 'right', dmgMod }: Props) {
  const d = DEF[id]
  if (!d) return null
  const cost = cardCost(id, upgraded)
  const text = d.text(upgraded)
  const kws = [...keywordsIn(text), ...(d.exhaust?.(upgraded) && !/Exhaust/.test(text) ? ['Exhaust'] : [])]
  return (
    <button
      type="button"
      data-uid={uid}
      className={`card card-${d.type} rarity-${d.rarity} cls-${d.cls} ${small ? 'card-small' : ''} ${selected ? 'selected' : ''} ${playable ? '' : 'unplayable'} ${className}`}
      onClick={onClick}
      style={style}
      title={CLS_LABEL[d.cls] ? `${CLS_LABEL[d.cls]} card` : undefined}
      aria-label={`${d.name}${upgraded ? ' upgraded' : ''}, cost ${cost}. ${text}`}
    >
      <span className="card-shine" aria-hidden />
      {cost >= 0 && <span className={`card-cost ${upgraded && d.costUp !== undefined ? 'up' : ''}`}>{cost}</span>}
      {hotkey !== undefined && <span className="card-hotkey">{hotkey}</span>}
      <span className={`card-name ${upgraded ? 'up' : ''}`}>
        {d.name}
        {upgraded ? '+' : ''}
      </span>
      <span className="card-art">
        <span className="card-rays" aria-hidden />
        <span className="card-icon">{d.icon}</span>
      </span>
      <span className="card-type">
        {TYPE_LABEL[d.type]}
      </span>
      <span className="card-text"><span>{dmgMod ? withDamage(text, dmgMod) : text}</span></span>
      {d.flavor && !small && <span className="card-flavor">{d.flavor}</span>}
      {price !== undefined && <span className="card-price">🪙 {price}</span>}
      {tips !== 'none' && kws.length > 0 && (
        <span className={`card-tips tips-${tips}`} aria-hidden>
          {kws.map((k) => (
            <span key={k} className="card-tip">
              <b>{k}</b>
              {KEYWORDS[k]}
            </span>
          ))}
        </span>
      )}
    </button>
  )
}
