import { useEffect, useState } from 'react'

interface Props {
  onResume: () => void
  onSaveQuit: () => void
  onAbandon: () => void
  canSave: boolean
}

/** Pause menu: resume, save & quit to title, or abandon the run. */
export function GameMenu({ onResume, onSaveQuit, onAbandon, canSave }: Props) {
  const [confirm, setConfirm] = useState(false)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onResume()
      }
    }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  }, [onResume])
  return (
    <div className="modal-backdrop" onClick={onResume} role="dialog" aria-modal aria-label="Menu">
      <div className="panel game-menu" onClick={(e) => e.stopPropagation()}>
        <h2>Paused</h2>
        {!confirm ? (
          <div className="menu-buttons">
            <button className="btn primary" onClick={onResume} autoFocus>
              Resume
            </button>
            <button className="btn" onClick={onSaveQuit}>
              {canSave ? 'Save & quit to title' : 'Quit to title'}
            </button>
            {!canSave && <p className="muted small">Mid-turn: the game resumes from your last save (start of this turn or the previous stop).</p>}
            <button className="btn danger" onClick={() => setConfirm(true)}>
              Abandon run
            </button>
          </div>
        ) : (
          <div className="menu-buttons">
            <p>Abandon this run? Your progress is deleted and cannot be recovered.</p>
            <button className="btn danger" onClick={onAbandon}>
              Yes, abandon it
            </button>
            <button className="btn" onClick={() => setConfirm(false)}>
              Keep playing
            </button>
          </div>
        )}
        <p className="muted small">Progress saves automatically at every stop and at the start of each turn.</p>
      </div>
    </div>
  )
}
