import { CAREER, CHAR_ORDER, characterName, characterUnlocked, characterUnlockHint, companionUnlocked, levelProgress, PERK, PERK_LADDER, perkSlots, reviewAvailable, type Unlock } from '../../meta/career'
import { loadMeta } from '../../meta/profile'
import { REVIEW_LEVELS } from '../../meta/review'
import { ACHIEVEMENTS } from '../../meta/achievements'
import './meta.css'

const unlockIcon = (u: Unlock) =>
  u.kind === 'perk' ? PERK[u.id]?.icon ?? '🎁' : u.kind === 'companion' ? '🧑‍🤝‍🧑' : u.kind === 'review' ? '⚖️' : u.kind === 'benefit' ? '💼' : u.kind === 'slot' ? '➕' : u.kind === 'character' ? '🧑‍🔧' : '✨'

export function CareerScreen({ onBack }: { onBack: () => void }) {
  const m = loadMeta()
  const p = levelProgress(m.xp)
  const cur = CAREER[p.level - 1]
  const review = reviewAvailable()
  const achCount = Object.keys(m.achievements).length
  return (
    <div className="meta-screen">
      <header className="meta-head">
        <button className="btn ghost" onClick={onBack}>
          ← Back
        </button>
        <h1>Career</h1>
      </header>
      <div className="career-grid">
        <section className="panel career-card">
          <div className="overline">Current title</div>
          <h2 className="career-title">{cur.title}</h2>
          <div className="career-level">Level {p.level}</div>
          <div className="xpbar">
            <div className="xpfill" style={{ width: `${p.pct * 100}%` }} />
          </div>
          <div className="muted small">{p.needed ? `${p.into} / ${p.needed} XP to ${CAREER[p.level].title}` : 'Maximum level reached. Nowhere left to climb.'}</div>
          <div className="career-stats">
            <div>
              <b>{m.runs}</b>runs
            </div>
            <div>
              <b>{m.wins}</b>wins
            </div>
            <div>
              <b>{m.bestFloor}</b>best floor
            </div>
            <div>
              <b>
                {achCount}/{ACHIEVEMENTS.length}
              </b>
              achievements
            </div>
            <div>
              <b>{m.totals.enemiesDefeated}</b>enemies defeated
            </div>
            <div>
              <b>{m.totals.bossesDefeated}</b>bosses defeated
            </div>
            <div>
              <b>{m.totals.cardsPlayed}</b>cards played
            </div>
            <div>
              <b>{m.totals.damageDealt.toLocaleString('en-US')}</b>damage dealt
            </div>
          </div>
          <div className="review-status">
            <div className="overline">Performance Reviews</div>
            {review === 0 ? (
              <p className="muted small">Locked. Reach career level 3 or win a run to unlock difficulty levels.</p>
            ) : (
              <ul className="review-list">
                {REVIEW_LEVELS.map((r) => (
                  <li key={r.level} className={r.level <= review ? 'open' : 'locked'}>
                    <span>{r.level <= review ? r.icon : '🔒'}</span>
                    <b>
                      {r.level}. {r.name}
                    </b>
                    <span className="muted small">{r.desc}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="review-status char-section">
            <div className="overline">Characters · perk slots: {perkSlots()}</div>
            <ul className="char-progress">
              {CHAR_ORDER.map((c) => {
                const open = characterUnlocked(c)
                const wins = m.charWins[c] ?? 0
                return (
                  <li key={c} className={open ? '' : 'locked'}>
                    <b>
                      {open ? '' : '🔒 '}
                      {characterName(c)}
                    </b>
                    {open ? (
                      <span className="muted small">
                        {wins} win{wins === 1 ? '' : 's'} · {Math.min(wins, PERK_LADDER[c].length)}/{PERK_LADDER[c].length} perks
                      </span>
                    ) : (
                      <span className="muted small">{characterUnlockHint(c)}</span>
                    )}
                    {open && (
                      <span className="perk-ladder">
                        {PERK_LADDER[c].map((id, i) => (
                          <span key={id} className={`ladder-perk ${i < wins ? 'got' : i === wins ? 'next' : ''}`} title={`${i < wins ? '' : `Win #${i + 1}: `}${PERK[id].name}: ${PERK[id].desc}`}>
                            {i <= wins ? PERK[id].icon : '?'}
                          </span>
                        ))}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
        <section className="panel career-ladder">
          <div className="overline">The ladder</div>
          <ol>
            {CAREER.map((l) => {
              const got = p.level >= l.level
              return (
                <li key={l.level} className={`${got ? 'got' : ''} ${l.level === p.level ? 'now' : ''}`}>
                  <span className="rung">{got ? '✔' : l.level}</span>
                  <span className="rung-body">
                    <b>{l.title}</b>
                    <span className="muted small">{l.xp} XP</span>
                    <span className="rung-unlocks">
                      {l.unlocks.map((u, i) => (
                        <span key={i} className={`unlock ${got || (u.kind === 'companion' && companionUnlocked(u.id)) ? '' : 'dim'}`} title={u.kind === 'perk' ? PERK[u.id]?.desc : undefined}>
                          {unlockIcon(u)} {u.label}
                        </span>
                      ))}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      </div>
    </div>
  )
}
