import type { Combat, Run, Screen } from './types'

const KEY = 'ccs-save-v1'

export interface SaveData {
  version: 1
  savedAt: number
  run: Run
  screen: Screen
  combat: Combat | null
  lastEvents: string[]
}

/** Only save at points that are safe to resume from: never mid enemy turn or mid victory screen. */
export function saveable(screen: Screen, combat: Combat | null): boolean {
  if (screen.kind === 'title' || screen.kind === 'charselect' || screen.kind === 'gameover' || screen.kind === 'victory') return false
  if (screen.kind === 'combat') return !!combat && combat.phase === 'player'
  return true
}

export function writeSave(data: Omit<SaveData, 'version' | 'savedAt'>) {
  try {
    const combat = data.combat ? { ...data.combat, floats: [], fx: [], speech: null, anim: {} } : null
    localStorage.setItem(KEY, JSON.stringify({ ...data, combat, version: 1, savedAt: Date.now() }))
  } catch {
    /* storage full or blocked: the run just isn't persisted */
  }
}

export function readSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as SaveData
    if (d.version !== 1 || !d.run?.character || !d.run.map) return null
    return d
  } catch {
    return null
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
