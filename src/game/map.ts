import type { ActMap, MapNode, NodeType } from './types'

const COLS = 5

function rollType(row: number, rows: number): NodeType {
  if (row === 0) return 'combat'
  if (row === rows - 1) return 'rest'
  if (row === Math.floor(rows / 2)) return 'treasure'
  const r = Math.random()
  if (row >= 2 && r < 0.14) return 'elite'
  if (r < 0.3) return 'event'
  if (r < 0.42) return 'rest'
  if (r < 0.52) return 'shop'
  return 'combat'
}

/** Slay-the-Spire style: several random walks up a grid, merged into a DAG. */
export function generateMap(act: number): ActMap {
  if (act === 4) return finalMap()
  const rows = 8
  const nodes: Record<string, MapNode> = {}
  const id = (r: number, c: number) => `${r}-${c}`
  const starts = new Set<number>()
  for (let p = 0; p < 4; p++) {
    let col = Math.floor(Math.random() * COLS)
    if (p < 2) while (starts.has(col) && starts.size < COLS) col = Math.floor(Math.random() * COLS)
    starts.add(col)
    for (let r = 0; r < rows; r++) {
      const key = id(r, col)
      nodes[key] ??= { id: key, row: r, col, type: 'combat', next: [] }
      if (r < rows - 1) {
        const nextCol = Math.max(0, Math.min(COLS - 1, col + Math.floor(Math.random() * 3) - 1))
        const nk = id(r + 1, nextCol)
        if (!nodes[key].next.includes(nk)) nodes[key].next.push(nk)
        col = nextCol
      }
    }
  }
  // Remove crossing edges by keeping order: simple pass that is good enough visually.
  for (const n of Object.values(nodes)) n.type = rollType(n.row, rows)
  // Avoid rest/elite/shop repeating back-to-back on a path.
  for (const n of Object.values(nodes)) {
    for (const k of n.next) {
      const m = nodes[k]
      if (m.type === n.type && ['rest', 'shop', 'elite'].includes(m.type) && m.row !== rows - 1) m.type = 'combat'
    }
  }
  const bossId = 'boss'
  nodes[bossId] = { id: bossId, row: rows, col: 2, type: 'boss', next: [] }
  for (const n of Object.values(nodes)) if (n.row === rows - 1) n.next = [bossId]
  return { nodes, rows: rows + 1, bossId }
}

function finalMap(): ActMap {
  const nodes: Record<string, MapNode> = {
    '0-2': { id: '0-2', row: 0, col: 2, type: 'rest', next: ['1-2'] },
    '1-2': { id: '1-2', row: 1, col: 2, type: 'shop', next: ['boss'] },
    boss: { id: 'boss', row: 2, col: 2, type: 'boss', next: [] },
  }
  return { nodes, rows: 3, bossId: 'boss' }
}

export interface SettingInfo {
  id: string
  act: number
  name: string
  sub: string
  place: string
}

/** Each act rolls one of its settings per run (Run.settings[act - 1]). */
export const SETTINGS: Record<string, SettingInfo> = {
  m2: { id: 'm2', act: 1, name: 'M2: The Logger Warehouse', sub: 'Pallets, forklifts and forty thousand loggers waiting to ship', place: 'Kópavogur' },
  m4: { id: 'm4', act: 1, name: 'M4: Production', sub: 'Pick-and-place, reflow ovens and a very strict ESD policy', place: 'Kópavogur' },
  s3: { id: 's3', act: 2, name: 'S3: The Tower', sub: 'Open-plan floors with a view of Esja and too many meetings', place: 'Kópavogur' },
  wroclaw: { id: 'wroclaw', act: 2, name: 'The Wrocław Office', sub: 'Old-town views, pierogi Fridays and suspicious dwarves', place: 'Wrocław' },
  logipharma: { id: 'logipharma', act: 3, name: 'LogiPharma', sub: 'Booths, badge scanners and a free tote bag for every regret', place: 'The convention' },
  lov: { id: 'lov', act: 3, name: 'LOV Week', sub: 'A banquet hall, round tables and slide 1 of 214', place: 'The banquet hall' },
  mine: { id: 'mine', act: 4, name: 'The Saltpeter Mine', sub: 'Deep below. Something guards the nitrate.', place: 'Underground' },
}

const BY_ACT: Record<number, string[]> = { 1: ['m2', 'm4'], 2: ['s3', 'wroclaw'], 3: ['logipharma', 'lov'], 4: ['mine'] }
export const DEFAULT_SETTINGS = ['m2', 's3', 'logipharma', 'mine']

export function rollSettings(): string[] {
  return [1, 2, 3, 4].map((act) => {
    const opts = BY_ACT[act]
    return opts[Math.floor(Math.random() * opts.length)]
  })
}

export function settingInfo(id: string | undefined): SettingInfo {
  return (id && SETTINGS[id]) || SETTINGS.m2
}

/** The setting for the run's current act (falls back to the default for older saves). */
export function currentSetting(run: { act: number; settings?: string[] }): SettingInfo {
  return settingInfo(run.settings?.[run.act - 1] ?? DEFAULT_SETTINGS[run.act - 1])
}

/** @deprecated Use SETTINGS / currentSetting. Kept for older imports. */
export const ACT_NAMES: Record<number, { name: string; sub: string }> = Object.fromEntries(
  DEFAULT_SETTINGS.map((id, i) => [i + 1, { name: SETTINGS[id].name, sub: SETTINGS[id].sub }]),
)
