import { useEffect } from 'react'
import { DEF } from '../game/cards'
import type { CardInst } from '../game/types'
import { Card } from './Card'

const ORDER = { attack: 0, skill: 1, power: 2, status: 3, curse: 4 }

interface Props {
  title: string
  cards: CardInst[]
  onClose?: () => void
  onPick?: (c: CardInst) => void
  filter?: (c: CardInst) => boolean
  /** @deprecated cards now show their upgraded version in a hover tip instead */
  preview?: 'upgrade'
  sorted?: boolean
}

export function DeckModal({ title, cards, onClose, onPick, filter, sorted = true }: Props) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  const list = (filter ? cards.filter(filter) : cards).slice()
  if (sorted) list.sort((a, b) => ORDER[DEF[a.id].type] - ORDER[DEF[b.id].type] || DEF[a.id].name.localeCompare(DEF[b.id].name))
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal aria-label={title}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{title}</h2>
          <span className="muted">{list.length} cards</span>
          {onClose && (
            <button className="btn ghost" onClick={onClose}>
              Close
            </button>
          )}
        </header>
        <div className="card-grid">
          {list.length === 0 && <p className="muted">Nothing here.</p>}
          {list.map((c) => (
            <Card key={c.uid} id={c.id} upgraded={c.upgraded} rewrite={c.rewrite} small showUpgrade tips="right" onClick={onPick ? () => onPick(c) : undefined} className={onPick ? 'pickable' : ''} />
          ))}
        </div>
      </div>
    </div>
  )
}
