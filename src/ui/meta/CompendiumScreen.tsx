import { useState } from 'react'
import { Portrait } from '../../art/Portraits'
import { ALL_CARDS } from '../../game/cards'
import { ENEMY } from '../../game/enemies'
import { RELIC } from '../../game/relics'
import { ACHIEVEMENTS, COLLECTIBLE_CARDS } from '../../meta/achievements'
import { TIER_XP } from '../../meta/career'
import { loadMeta } from '../../meta/profile'
import { Card } from '../Card'
import './meta.css'

type Tab = 'enemies' | 'cards' | 'relics' | 'achievements'

const CLASS_LABEL: Record<string, string> = { fw: 'Firmware Developer', hw: 'Hardware Engineer', cal: 'Calibration Specialist', neutral: 'Office (everyone)' }
const TIER_ORDER = { normal: 0, minion: 1, elite: 2, boss: 3 }

export function CompendiumScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('enemies')
  const m = loadMeta()
  const enemies = Object.values(ENEMY).sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])
  const seenEnemies = enemies.filter((e) => (m.compendium.enemies[e.id]?.seen ?? 0) > 0).length
  const cardsSeen = COLLECTIBLE_CARDS.filter((id) => m.compendium.cards.includes(id)).length
  const relicIds = Object.keys(RELIC)
  const relicsSeen = relicIds.filter((id) => m.compendium.relics.includes(id)).length
  const achDone = ACHIEVEMENTS.filter((a) => m.achievements[a.id]).length
  const tabs: [Tab, string, string][] = [
    ['enemies', 'Bestiary', `${seenEnemies}/${enemies.length}`],
    ['cards', 'Cards', `${cardsSeen}/${COLLECTIBLE_CARDS.length}`],
    ['relics', 'Relics', `${relicsSeen}/${relicIds.length}`],
    ['achievements', 'Achievements', `${achDone}/${ACHIEVEMENTS.length}`],
  ]
  return (
    <div className="meta-screen">
      <header className="meta-head">
        <button className="btn ghost" onClick={onBack}>
          ← Back
        </button>
        <h1>Compendium</h1>
        <nav className="meta-tabs" role="tablist">
          {tabs.map(([id, label, count]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={`meta-tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
              {label} <span className="muted small">{count}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="meta-body">
        {tab === 'enemies' && (
          <div className="bestiary">
            {enemies.map((e) => {
              const rec = m.compendium.enemies[e.id]
              const seen = (rec?.seen ?? 0) > 0
              const lines = m.compendium.lines[e.id] ?? []
              return (
                <article key={e.id} className={`beast panel ${seen ? '' : 'unseen'} tier-${e.tier}`}>
                  <div className="beast-art">
                    <Portrait id={e.id} size={130} />
                  </div>
                  <div className="beast-info">
                    <h3>{seen ? e.name : '???'}</h3>
                    <div className="overline">{e.tier === 'normal' ? 'Enemy' : e.tier}</div>
                    {seen ? (
                      <>
                        <p className="muted small">{e.bio}</p>
                        <div className="small">
                          Encountered {rec!.seen}× · Defeated {rec!.defeated}×
                        </div>
                        {lines.length > 0 && (
                          <ul className="quotes">
                            {lines.slice(0, 4).map((l) => (
                              <li key={l}>“{l}”</li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <p className="muted small">Not yet encountered.</p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {tab === 'cards' &&
          (['fw', 'hw', 'cal', 'neutral'] as const).map((cls) => {
            const list = ALL_CARDS.filter((d) => d.rarity !== 'special' && d.cls === cls)
            return (
              <section key={cls} className="comp-section">
                <h2>
                  {CLASS_LABEL[cls]} <span className="muted small">{list.filter((d) => m.compendium.cards.includes(d.id)).length}/{list.length}</span>
                </h2>
                <div className="comp-cards">
                  {list.map((d) =>
                    m.compendium.cards.includes(d.id) ? (
                      <Card key={d.id} id={d.id} small tips="none" />
                    ) : (
                      <div key={d.id} className="card-unknown" title="Not discovered yet">
                        ?
                      </div>
                    ),
                  )}
                </div>
              </section>
            )
          })}

        {tab === 'relics' && (
          <div className="comp-relics">
            {relicIds.map((id) => {
              const r = RELIC[id]
              const seen = m.compendium.relics.includes(id)
              return (
                <div key={id} className={`comp-relic ${seen ? '' : 'unseen'}`}>
                  <span className="relic-big">{seen ? r.icon : '❔'}</span>
                  <span>
                    <b>{seen ? r.name : '???'}</b>
                    <span className="overline"> {r.tier}</span>
                    <br />
                    <span className="muted small">{seen ? r.text : 'Not discovered yet.'}</span>
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'achievements' && (
          <>
            <div className="ach-progress">
              <div className="xpbar">
                <div className="xpfill" style={{ width: `${(achDone / ACHIEVEMENTS.length) * 100}%` }} />
              </div>
              <span>
                {achDone} / {ACHIEVEMENTS.length} unlocked
              </span>
            </div>
            <div className="ach-grid">
              {ACHIEVEMENTS.map((a) => {
                const at = m.achievements[a.id]
                const secret = a.hidden && !at
                return (
                  <div key={a.id} className={`ach-card tier-${a.tier} ${at ? 'got' : 'locked'}`}>
                    <span className="ach-card-icon">{secret ? '❓' : a.icon}</span>
                    <span className="ach-card-body">
                      <b>{secret ? 'Hidden achievement' : a.name}</b>
                      <span className="small">{secret ? 'Keep playing to discover it.' : a.desc}</span>
                      <span className="overline">
                        {a.category} · {a.tier} · {TIER_XP[a.tier]} XP{at ? ` · ${new Date(at).toLocaleDateString('en-US')}` : ''}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
