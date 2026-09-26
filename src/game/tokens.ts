/** The run currency. Stored as full units in Run.gold (e.g. 25000) and shown as "25k tokens". */
export const TOKEN_ICON = '🪙'

/** 25000 → "25k", 1250000 → "1.25M", 950 → "950". */
export function fmtNum(n: number): string {
  const sign = n < 0 ? '-' : ''
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${sign}${trim(a / 1_000_000)}M`
  if (a >= 1_000) return `${sign}${trim(a / 1_000)}k`
  return `${sign}${Math.round(a)}`
}

const trim = (x: number) => (x >= 100 ? Math.round(x).toString() : x.toFixed(2).replace(/\.?0+$/, ''))

/** With icon: "🪙 25k". */
export const fmtTokens = (n: number) => `${TOKEN_ICON} ${fmtNum(n)}`

/** Plain text for sentences: "25k tokens". */
export const tokensText = (n: number) => `${fmtNum(n)} tokens`

/** Round to a tidy token amount (nearest 1k). */
export const roundTokens = (n: number) => Math.round(n / 1000) * 1000
