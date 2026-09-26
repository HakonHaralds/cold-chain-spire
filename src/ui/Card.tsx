import { DEF, KEYWORDS, cardCost, keywordsIn } from '../game/cards'
import { fmtTokens } from '../game/tokens'
import './run.css'

interface Props {
  id: string
  upgraded?: boolean
  /** Rewrite variant of the upgrade: costs 1 less, ships a Bug. */
  rewrite?: boolean
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
  /** Highlight numbers that changed versus the un-upgraded card. */
  diff?: boolean
  /** For un-upgraded cards, add a hover tip describing the upgraded version. */
  showUpgrade?: boolean
  /** The cost right now, if an effect changes it (e.g. the CFO's Cost Cutting). */
  costNow?: number
  /** Frozen by the CFO: shown with an ice overlay, unplayable this turn. */
  frozen?: boolean
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

/** Highlight numbers that differ from the base (un-upgraded) text. */
function withDiff(text: string, base: string) {
  const a = text.split(/(\d+)/)
  const b = base.split(/(\d+)/)
  if (a.length < b.length) return text
  return a.map((part, i) => (i % 2 === 1 && part !== b[i] ? <b key={i} className="dmg-up">{part}</b> : part))
}

const TYPE_LABEL: Record<string, string> = { attack: 'Attack', skill: 'Skill', power: 'Power', status: 'Status', curse: 'Curse' }
const CLS_LABEL: Record<string, string> = { fw: 'Firmware', hw: 'Hardware', cal: 'Calibration' }

export function Card({ id, upgraded = false, rewrite = false, playable = true, selected, onClick, small, price, style, className = '', hotkey, uid, tips = 'right', dmgMod, diff, showUpgrade, costNow, frozen }: Props) {
  const d = DEF[id]
  if (!d) return null
  const baseCost = cardCost(id, upgraded, rewrite)
  const cost = costNow ?? baseCost
  const text = d.text(upgraded) + (rewrite ? ' Shuffle a Bug into your draw pile.' : '')
  const kws = [...keywordsIn(text), ...(d.exhaust?.(upgraded) && !/Exhaust/.test(text) ? ['Exhaust'] : [])]
  return (
    <button
      type="button"
      data-uid={uid}
      className={`card card-${d.type} rarity-${d.rarity} cls-${d.cls} ${rewrite ? 'is-rewrite' : ''} ${small ? 'card-small' : ''} ${selected ? 'selected' : ''} ${playable ? '' : 'unplayable'} ${frozen ? 'is-frozen' : ''} ${className}`}
      onClick={onClick}
      style={style}
      title={CLS_LABEL[d.cls] ? `${CLS_LABEL[d.cls]} card` : undefined}
      aria-label={`${d.name}${rewrite ? ' rewritten' : upgraded ? ' upgraded' : ''}, cost ${cost}. ${text}`}
    >
      <span className="card-shine" aria-hidden />
      {cost >= 0 && <span className={`card-cost ${cost > baseCost ? 'taxed' : rewrite ? 'rw' : upgraded && d.costUp !== undefined ? 'up' : ''}`} title={cost > baseCost ? 'Cost Cutting: +1 while the CFO has Block' : undefined}>{cost}</span>}
      {frozen && (
        <span className="card-frozen" aria-hidden>
          <span>🧊 FROZEN</span>
          <small>Budget Freeze: can't be played this turn</small>
        </span>
      )}
      {rewrite && <span className="card-ribbon">REWRITE</span>}
      {hotkey !== undefined && <span className="card-hotkey">{hotkey}</span>}
      <span className={`card-name ${rewrite ? 'rw' : upgraded ? 'up' : ''}`}>
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
      <span className="card-text"><span>{dmgMod ? withDamage(text, dmgMod) : diff && upgraded ? withDiff(text, d.text(false)) : text}</span></span>
      {d.flavor && !small && <span className="card-flavor">{d.flavor}</span>}
      {price !== undefined && <span className="card-price">{fmtTokens(price)}</span>}
      {tips !== 'none' && (kws.length > 0 || upgraded || showUpgrade) && (
        <span className={`card-tips tips-${tips}`} aria-hidden>
          {upgraded && d.type !== 'status' && d.type !== 'curse' && (
            <span className="card-tip card-tip-base">
              <b>Before upgrade{d.cost >= 0 ? ` · cost ${d.cost}` : ''}</b>
              {d.text(false)}
            </span>
          )}
          {!upgraded && showUpgrade && d.type !== 'status' && d.type !== 'curse' && (
            <span className="card-tip card-tip-up">
              <b>When upgraded{cardCost(id, true) !== d.cost ? ` · cost ${cardCost(id, true)}` : ''}</b>
              {d.text(true)}
            </span>
          )}
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
