import { Portrait } from '../art/Portraits'
import { CHARACTERS } from '../game/characters'
import { ENEMY } from '../game/enemies'

/** Rogues' gallery of every character (open with ?gallery). */
export function Gallery() {
  return (
    <div className="gallery">
      {Object.values(CHARACTERS).map((c) => (
        <div key={c.id} className="gallery-item">
          <Portrait id={c.portrait} size={180} />
          <b>{c.name}</b>
          <span className="muted small">{c.title}</span>
        </div>
      ))}
      {Object.values(ENEMY).map((e) => (
        <div key={e.id} className="gallery-item">
          <Portrait id={e.id} size={180} />
          <b>{e.name}</b>
          <span className="muted small">{e.bio}</span>
        </div>
      ))}
    </div>
  )
}
