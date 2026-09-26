import { useState } from 'react'
import { Portrait } from '../art/Portraits'
import { DEF } from '../game/cards'
import { EVENT } from '../game/events'
import { RELIC } from '../game/relics'
import type { CardInst, Run, Screen } from '../game/types'
import { Card } from './Card'
import { DeckModal } from './DeckModal'
import { resetTours } from './Tutorial'
import type { SaveData } from '../game/save'
import { CHARACTERS } from '../game/characters'
import { canRewrite } from '../game/cards'
import { bump } from '../game/stats'
import { fmtTokens, tokensText } from '../game/tokens'

type SetRun = React.Dispatch<React.SetStateAction<Run | null>>
type SetScreen = React.Dispatch<React.SetStateAction<Screen>>

const isUpgradable = (c: CardInst) => !c.upgraded && !['status', 'curse'].includes(DEF[c.id].type)

function RelicBadge({ id, onClick, price, disabled }: { id: string; onClick?: () => void; price?: number; disabled?: boolean }) {
  const r = RELIC[id]
  return (
    <button className="relic-offer" onClick={onClick} disabled={disabled}>
      <span className="relic-big">{r.icon}</span>
      <span>
        <b>{r.name}</b>
        <br />
        <span className="muted small">{r.text}</span>
      </span>
      {price !== undefined && <span className="card-price">{fmtTokens(price)}</span>}
    </button>
  )
}

export function TitleScreen({ onStart, save, onContinue, onCareer, onCompendium, careerLabel }: { onStart: () => void; save: SaveData | null; onContinue: () => void; onCareer: () => void; onCompendium: () => void; careerLabel: string }) {
  const [confirmNew, setConfirmNew] = useState(false)
  const [how, setHow] = useState(false)
  const [replayed, setReplayed] = useState(false)
  return (
    <div className="title-screen">
      <div className="title-lineup">
        {['boss_pc', 'boss_cto', 'boss_peter', 'boss_ceo'].map((id, i) => (
          <div key={id} className="lineup-slot" style={{ animationDelay: `${i * 0.15}s` }}>
            <Portrait id={id} size={i === 2 ? 230 : 190} />
          </div>
        ))}
      </div>
      <h1 className="logo">
        <span className="logo-small">SLAY THE</span>
        COLD CHAIN
      </h1>
      <p className="tagline">A deck-building roguelike about keeping it between 2 and 8 °C — and surviving the org chart.</p>
      <div className="title-actions">
        {save && (
          <button className="btn primary big" onClick={onContinue}>
            Continue
            <span className="continue-sub">
              {CHARACTERS[save.run.character].name} · Act {save.run.act}, floor {save.run.floor}
            </span>
          </button>
        )}
        <button className={`btn ${save ? '' : 'primary'} big`} onClick={() => (save && !confirmNew ? setConfirmNew(true) : onStart())}>
          {save && confirmNew ? 'Abandon saved run & start new?' : save ? 'New run' : 'Start a run'}
        </button>
        <button className="btn ghost" onClick={onCareer} title="Career ladder and unlocks">
          💼 Career
        </button>
        <button className="btn ghost" onClick={onCompendium} title="Enemies, cards, relics and achievements">
          📚 Compendium
        </button>
        <button className="btn ghost" onClick={() => setHow((h) => !h)}>
          How to play
        </button>
        <button className="btn ghost" onClick={() => { resetTours(); setReplayed(true) }} disabled={replayed}>
          {replayed ? 'Tutorial will replay ✔' : 'Replay tutorial'}
        </button>
      </div>
      {how && (
        <div className="how panel">
          <ul>
            <li>Pick a route up the map. Each act ends with a boss.</li>
            <li>In combat you get <b>3 Energy</b> and draw <b>5 cards</b> per turn. Cards cost Energy (top-left number).</li>
            <li>Enemies show their <b>intent</b> above their head — plan around it. Block disappears at the start of your turn.</li>
            <li>After combat, add a card to your deck. Rest at the coffee machine to heal or upgrade a card.</li>
            <li>
              Keys: <kbd>1</kbd>–<kbd>0</kbd> play cards, <kbd>E</kbd> ends your turn, <kbd>Esc</kbd> or right-click cancels targeting.
            </li>
            <li>Survive People & Culture, the CTO and the CEO… then descend into the mine where Peter guards the saltpeter.</li>
          </ul>
        </div>
      )}
      <p className="career-label">{careerLabel}</p>
      <p className="disclaimer">A work of affectionate office satire. Any resemblance to real vests is purely coincidental.</p>
    </div>
  )
}

export function RewardScreen({ screen, onTakeCard, onTakeRelic, onDone }: { screen: Extract<Screen, { kind: 'reward' }>; onTakeCard: (id: string) => void; onTakeRelic: (id: string) => void; onDone: () => void }) {
  const [cardTaken, setCardTaken] = useState(screen.cards.length === 0)
  const [relicTaken, setRelicTaken] = useState(false)
  const [bossTaken, setBossTaken] = useState(!!screen.bossRelics && screen.bossRelics.length === 0)
  return (
    <div className="panel-screen">
      <div className="panel reward">
        <h2>Loot</h2>
        <div className="reward-row">
          {fmtTokens(screen.gold)} tokens added
        </div>
        {screen.relic && (
          <div className="reward-row">
            <RelicBadge id={screen.relic} disabled={relicTaken} onClick={() => { onTakeRelic(screen.relic!); setRelicTaken(true) }} />
            {relicTaken && <span className="taken">✔ Taken</span>}
          </div>
        )}
        {screen.bossRelics && screen.bossRelics.length > 0 && (
          <>
            <h3>Choose a boss relic</h3>
            <div className="relic-choice">
              {screen.bossRelics.map((id) => (
                <RelicBadge key={id} id={id} disabled={bossTaken} onClick={() => { onTakeRelic(id); setBossTaken(true) }} />
              ))}
            </div>
          </>
        )}
        <h3>{cardTaken ? 'Card added to your deck' : 'Choose a card'}</h3>
        {!cardTaken && (
          <div className="card-choice">
            {screen.cards.map((id) => (
              <Card key={id} id={id} onClick={() => { onTakeCard(id); setCardTaken(true) }} className="pickable" />
            ))}
          </div>
        )}
        <div className="actions">
          <button className="btn primary" onClick={onDone}>
            {cardTaken ? 'Continue' : 'Skip card & continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function RestScreen({ run, used, onUse, setRun, onDone, healPct = 0.3 }: { run: Run; used: boolean; onUse: () => void; setRun: SetRun; onDone: () => void; healPct?: number }) {
  const [picking, setPicking] = useState(false)
  const [variantFor, setVariantFor] = useState<CardInst | null>(null)
  const [done, setDoneText] = useState<string | null>(used ? 'You already had your coffee.' : null)
  const setDone = (t: string) => {
    setDoneText(t)
    onUse()
  }
  const healAmt = Math.round(run.maxHp * healPct)
  const wired = run.relics.includes('espresso')
  return (
    <div className="panel-screen">
      <div className="panel rest">
        <div className="rest-art">☕</div>
        <h2>The Coffee Machine</h2>
        <p className="muted">It makes a noise like a jet engine. The coffee is excellent. Someone left a Post-it: "DESCALE ME".</p>
        {!done ? (
          <div className="rest-options">
            <button className="btn option" disabled={wired} onClick={() => { setRun({ ...run, hp: Math.min(run.maxHp, run.hp + healAmt), stats: bump(run.stats, { rests: 1 }) }); setDone(`You recover ${healAmt} HP.`) }}>
              <span className="opt-icon">{wired ? '⚡' : '😌'}</span>
              <b>Rest</b>
              <span>{wired ? 'Too wired (Espresso Machine)' : `Heal ${healAmt} HP`}</span>
            </button>
            <button className="btn option" onClick={() => setPicking(true)} disabled={!run.deck.some(isUpgradable)}>
              <span className="opt-icon">🛠️</span>
              <b>Upgrade</b>
              <span>Refactor or Rewrite a card</span>
            </button>
          </div>
        ) : (
          <p className="result">{done}</p>
        )}
        <div className="actions">
          <button className={`btn ${done ? 'primary' : 'ghost'}`} onClick={onDone}>
            {done ? 'Continue' : 'Leave'}
          </button>
        </div>
      </div>
      {picking && (
        <DeckModal
          title="Choose a card to upgrade"
          cards={run.deck}
          filter={isUpgradable}
          preview="upgrade"
          onClose={() => setPicking(false)}
          onPick={(c) => {
            setPicking(false)
            setVariantFor(c)
          }}
        />
      )}
      {variantFor && (
        <UpgradeChoice
          card={variantFor}
          onCancel={() => {
            setVariantFor(null)
            setPicking(true)
          }}
          onPick={(rewrite) => {
            const c = variantFor
            setRun({ ...run, deck: run.deck.map((d) => (d.uid === c.uid ? { ...d, upgraded: true, ...(rewrite ? { rewrite: true } : {}) } : d)), stats: bump(run.stats, { rests: 1, upgrades: 1 }) })
            setVariantFor(null)
            setDone(rewrite ? `${DEF[c.id].name} rewritten: cheaper, but it ships a Bug.` : `${DEF[c.id].name} refactored to ${DEF[c.id].name}+.`)
          }}
        />
      )}
    </div>
  )
}

export function ShopScreen({ run, screen, setRun, setScreen, grantRelic, onDone }: { run: Run; screen: Extract<Screen, { kind: 'shop' }>; setRun: SetRun; setScreen: SetScreen; grantRelic: (r: Run, id: string) => Run; onDone: () => void }) {
  const [removing, setRemoving] = useState(false)
  const removeCost = 75000
  return (
    <div className="panel-screen">
      <div className="panel shop">
        <h2>🛒 The Vending Machine</h2>
        <p className="muted">It only takes exact change and the occasional soul. You have {tokensText(run.gold)}.</p>
        <div className="card-choice wrap">
          {screen.cards.map((s, i) => (
            <div key={s.id} className={`shop-item ${s.sold ? 'sold' : ''}`}>
              <Card
                id={s.id}
                price={s.price}
                playable={!s.sold && run.gold >= s.price}
                onClick={() => {
                  if (s.sold || run.gold < s.price) return
                  setRun({ ...run, gold: run.gold - s.price, deck: [...run.deck, { uid: `${Date.now()}${i}`, id: s.id, upgraded: false }], stats: bump(run.stats, { tokensSpent: s.price, cardsAdded: 1 }) })
                  setScreen({ ...screen, cards: screen.cards.map((x, j) => (j === i ? { ...x, sold: true } : x)) })
                }}
              />
            </div>
          ))}
        </div>
        <div className="relic-choice">
          {screen.relics.map((s, i) => (
            <RelicBadge
              key={s.id}
              id={s.id}
              price={s.price}
              disabled={s.sold || run.gold < s.price}
              onClick={() => {
                setRun(grantRelic({ ...run, gold: run.gold - s.price, stats: bump(run.stats, { tokensSpent: s.price, relicsGained: 1 }) }, s.id))
                setScreen({ ...screen, relics: screen.relics.map((x, j) => (j === i ? { ...x, sold: true } : x)) })
              }}
            />
          ))}
          <button className="relic-offer" disabled={screen.removeUsed || run.gold < removeCost} onClick={() => setRemoving(true)}>
            <span className="relic-big">🗑️</span>
            <span>
              <b>Card removal</b>
              <br />
              <span className="muted small">Delete a card from your deck. {screen.removeUsed ? '(Sold out)' : ''}</span>
            </span>
            <span className="card-price">{fmtTokens(removeCost)}</span>
          </button>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={onDone}>
            Leave
          </button>
        </div>
      </div>
      {removing && (
        <DeckModal
          title="Choose a card to remove"
          cards={run.deck}
          onClose={() => setRemoving(false)}
          onPick={(c) => {
            setRun({ ...run, gold: run.gold - removeCost, deck: run.deck.filter((d) => d.uid !== c.uid), stats: bump(run.stats, { tokensSpent: removeCost, removals: 1 }) })
            setScreen({ ...screen, removeUsed: true })
            setRemoving(false)
          }}
        />
      )}
    </div>
  )
}

export function EventScreen({ run, screen, setRun, setScreen, onDone, onChoice }: { run: Run; screen: Extract<Screen, { kind: 'event' }>; setRun: SetRun; setScreen: SetScreen; onDone: () => void; onChoice?: (option: number, after: Run) => void }) {
  const ev = EVENT[screen.eventId]
  const [removing, setRemoving] = useState(false)
  return (
    <div className="panel-screen">
      <div className="panel event">
        <div className="event-art">{ev.icon}</div>
        <h2>{ev.title}</h2>
        <p>{ev.body}</p>
        {screen.result === null ? (
          <div className="event-options">
            {ev.options.map((o, oi) => {
              const enabled = o.enabled ? o.enabled(run) : true
              return (
                <button
                  key={o.label}
                  className="btn option wide"
                  disabled={!enabled}
                  onClick={() => {
                    const res = o.apply(run)
                    setRun(res.run)
                    onChoice?.(oi, res.run)
                    if (res.text === 'REMOVE') {
                      setRemoving(true)
                      setScreen({ ...screen, result: 'You emerge, shivering, a little lighter.' })
                    } else setScreen({ ...screen, result: res.text })
                  }}
                >
                  <b>[{o.label}]</b> <span>{o.detail}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <>
            <p className="result">{screen.result}</p>
            <div className="actions">
              <button className="btn primary" onClick={onDone} disabled={removing}>
                Continue
              </button>
            </div>
          </>
        )}
      </div>
      {removing && (
        <DeckModal
          title="Choose a card to remove"
          cards={run.deck}
          onPick={(c) => {
            setRun((r) => (r ? { ...r, deck: r.deck.filter((d) => d.uid !== c.uid), stats: bump(r.stats, { removals: 1 }) } : r))
            setRemoving(false)
          }}
        />
      )}
    </div>
  )
}

export function TreasureScreen({ relic, taken, onTake, onDone }: { relic: string; taken: boolean; onTake: () => void; onDone: () => void }) {
  return (
    <div className="panel-screen">
      <div className="panel treasure">
        <div className="event-art">{taken ? '📭' : '🎁'}</div>
        <h2>The Supply Closet</h2>
        <p className="muted">Behind the printer paper and 400 branded pens, something useful.</p>
        <RelicBadge id={relic} disabled={taken} onClick={onTake} />
        <div className="actions">
          <button className="btn primary" onClick={onDone}>
            {taken ? 'Continue' : 'Leave it'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Stats({ run }: { run: Run }) {
  return (
    <ul className="stats">
      <li>
        <b>{run.floor}</b> floors climbed
      </li>
      <li>
        <b>{run.stats.enemiesDefeated}</b> enemies defeated
      </li>
      <li>
        <b>{run.stats.cardsPlayed}</b> cards played
      </li>
      <li>
        <b>{run.stats.damageDealt}</b> damage dealt
      </li>
      <li>
        <b>{run.deck.length}</b> cards in deck
      </li>
    </ul>
  )
}

export function GameOverScreen({ run, onRestart, summary }: { run: Run; onRestart: () => void; summary?: React.ReactNode }) {
  return (
    <div className="panel-screen">
      <div className="panel end lose">
        <h2>You have been restructured.</h2>
        <p className="muted">Your access badge no longer opens the door. HR will be in touch about your laptop.</p>
        <Stats run={run} />
        {summary}
        <div className="actions">
          <button className="btn primary big" onClick={onRestart}>
            Re-apply for the job
          </button>
        </div>
      </div>
    </div>
  )
}

export function VictoryScreen({ run, portrait, onRestart, summary }: { run: Run; portrait: string; onRestart: () => void; summary?: React.ReactNode }) {
  return (
    <div className="panel-screen">
      <div className="panel end win">
        <Portrait id={portrait} size={160} />
        <h2>The Cold Chain Is Unbroken!</h2>
        <p>
          Peter crumbles into a neat pile of fertilizer-grade potassium nitrate. Every shipment arrives between 2 and 8 °C. The CEO announces your achievement at the next all-hands and takes full
          credit. You get a hoodie.
        </p>
        <Stats run={run} />
        {summary}
        <div className="actions">
          <button className="btn primary big" onClick={onRestart}>
            New fiscal year
          </button>
        </div>
      </div>
    </div>
  )
}

/** Branching upgrade (M8): Refactor (the normal +) or Rewrite (+, costs 1 less, ships a Bug when played). */
function UpgradeChoice({ card, onPick, onCancel }: { card: CardInst; onPick: (rewrite: boolean) => void; onCancel: () => void }) {
  const rewriteOk = canRewrite(card.id)
  return (
    <div className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal aria-label="Choose an upgrade">
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'auto' }}>
        <header className="modal-head">
          <h2>How do you want to upgrade {DEF[card.id].name}?</h2>
          <button className="btn ghost" onClick={onCancel}>
            Back
          </button>
        </header>
        <div className="upgrade-choice">
          <div className="upgrade-option current">
            <h3>Current</h3>
            <p>What the card does today.</p>
            <Card id={card.id} tips="none" playable />
          </div>
          <div className="upgrade-arrow" aria-hidden>➜</div>
          <div className="upgrade-option">
            <h3>🛠️ Refactor</h3>
            <p>The clean upgrade. Better numbers, no side effects.</p>
            <Card id={card.id} upgraded diff onClick={() => onPick(false)} className="pickable" tips="none" />
          </div>
          <div className={`upgrade-option ${rewriteOk ? '' : 'disabled'}`}>
            <h3>⚡ Rewrite</h3>
            <p>{rewriteOk ? 'Upgraded and costs 1 less, but every play ships a Bug into your draw pile.' : 'Already free to play: nothing to rewrite.'}</p>
            <Card id={card.id} upgraded diff rewrite={rewriteOk} playable={rewriteOk} onClick={rewriteOk ? () => onPick(true) : undefined} className={rewriteOk ? 'pickable' : ''} tips="none" />
          </div>
        </div>
      </div>
    </div>
  )
}
