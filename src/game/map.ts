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

export const ACT_NAMES: Record<number, { name: string; sub: string }> = {
  1: { name: 'The Warehouse', sub: 'Pallets, forklifts and legacy loggers' },
  2: { name: 'The Open Office', sub: 'Where focus goes to die' },
  3: { name: 'The Boardroom', sub: 'Mahogany, vests and vision' },
  4: { name: 'The Saltpeter Mine', sub: 'Deep below. Something guards the nitrate.' },
}
