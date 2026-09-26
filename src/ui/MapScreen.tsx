import { ENCOUNTERS, ENEMY } from '../game/enemies'
import { currentSetting } from '../game/map'
import type { MapNode, NodeType, Run } from '../game/types'
import { Portrait } from '../art/Portraits'

const ICON: Record<NodeType, string> = { combat: '⚔️', elite: '😈', rest: '☕', shop: '🛒', event: '❓', treasure: '🎁', boss: '👑' }
const LABEL: Record<NodeType, string> = { combat: 'Meeting (enemy)', elite: 'Escalation (elite)', rest: 'Coffee machine (rest)', shop: 'Vending machine (shop)', event: 'Unknown (event)', treasure: 'Supply closet (treasure)', boss: 'Boss' }

export function MapScreen({ run, onEnter }: { run: Run; onEnter: (n: MapNode) => void }) {
  const { nodes, rows } = run.map
  const W = 640
  const rowH = 86
  const H = rows * rowH + 60
  const x = (n: MapNode) => (n.type === 'boss' ? W / 2 : 80 + n.col * 120 + (((n.row * 7 + n.col * 13) % 5) - 2) * 6)
  const y = (n: MapNode) => H - 50 - n.row * rowH
  const current = run.position ? nodes[run.position] : null
  const available = new Set(current ? current.next : Object.values(nodes).filter((n) => n.row === 0).map((n) => n.id))
  const boss = ENEMY[ENCOUNTERS[run.act].boss]
  const act = currentSetting(run)

  return (
    <div className="map-screen">
      <aside className="map-side">
        <h1 className="act-title">Act {run.act}</h1>
        <h2 className="act-name">{act.name}</h2>
        <p className="muted">{act.sub}</p>
        <div className="boss-preview">
          <Portrait id={boss.id} size={150} />
          <div>
            <div className="overline">Boss</div>
            <b>{boss.name}</b>
            {boss.title && <div className="muted small">{boss.title.replace('Boss · ', '')}</div>}
          </div>
        </div>
        <ul className="legend">
          {(Object.keys(ICON) as NodeType[]).map((t) => (
            <li key={t}>
              <span>{ICON[t]}</span> {LABEL[t]}
            </li>
          ))}
        </ul>
      </aside>
      <div className="map-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="map-svg" style={{ maxHeight: H }}>
          {Object.values(nodes).map((n) =>
            n.next.map((k) => {
              const m = nodes[k]
              const traveled = current && (n.id === current.id || false) && available.has(k)
              return <line key={n.id + k} x1={x(n)} y1={y(n)} x2={x(m)} y2={y(m)} className={`map-edge ${traveled ? 'hot' : ''}`} />
            }),
          )}
          {Object.values(nodes).map((n) => {
            const can = available.has(n.id)
            const here = current?.id === n.id
            const r = n.type === 'boss' ? 38 : 24
            return (
              <g
                key={n.id}
                className={`map-node ${can ? 'available' : ''} ${here ? 'here' : ''} type-${n.type}`}
                transform={`translate(${x(n)},${y(n)})`}
                style={{ animationDelay: `${n.row * 60 + n.col * 25}ms` }}
                onClick={() => can && onEnter(n)}
                role={can ? 'button' : undefined}
                tabIndex={can ? 0 : -1}
                onKeyDown={(e) => can && (e.key === 'Enter' || e.key === ' ') && onEnter(n)}
                aria-label={LABEL[n.type]}
              >
                <circle r={r} className="node-bg" />
                <text textAnchor="middle" dy={n.type === 'boss' ? 12 : 8} fontSize={n.type === 'boss' ? 34 : 22}>
                  {ICON[n.type]}
                </text>
                <title>{LABEL[n.type]}</title>
              </g>
            )
          })}
        </svg>
        <p className="map-hint">{available.size ? 'Choose your next stop.' : ''}</p>
      </div>
    </div>
  )
}
