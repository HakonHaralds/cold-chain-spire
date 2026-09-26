import { currentSetting } from '../game/map'
import { RELIC } from '../game/relics'
import { fmtTokens } from '../game/tokens'
import { OkrChip } from './OkrChip'
import type { Combat, Run } from '../game/types'

export function TopBar({ run, combat, onDeck, onMenu }: { run: Run; combat: Combat | null; onDeck: () => void; onMenu: () => void }) {
  const hp = combat ? combat.player.hp : run.hp
  const maxHp = combat ? combat.player.maxHp : run.maxHp
  return (
    <header className="topbar">
      <div className="tb-left">
        <span className="tb-stat hp" title="Health">
          ❤️ {hp}/{maxHp}
        </span>
        <span className="tb-stat gold" title="Tokens">
          {fmtTokens(run.gold - (combat?.goldStolen ?? 0))}
        </span>
        <OkrChip run={run} />
        <span className="tb-act">
          Act {run.act}: {currentSetting(run).name} · Floor {run.floor}
        </span>
      </div>
      <div className="tb-relics">
        {run.relics.map((id) => (
          <span key={id} className="relic" tabIndex={0}>
            {RELIC[id].icon}
            <span className="tip">
              <b>{RELIC[id].name}</b>
              <br />
              {RELIC[id].text}
            </span>
          </span>
        ))}
      </div>
      <button className="btn ghost small deck-btn" onClick={onDeck}>
        🃏 Deck ({run.deck.length})
      </button>
      <button className="btn ghost small menu-btn" onClick={onMenu} aria-label="Menu">
        ☰ Menu
      </button>
    </header>
  )
}
