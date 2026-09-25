export interface RelicDef {
  id: string
  name: string
  icon: string
  text: string
  tier: 'starter' | 'common' | 'boss'
}

const defs: RelicDef[] = [
  { id: 'jlink', name: 'J-Link Debugger', icon: '🔗', tier: 'starter', text: 'At the end of your turn, exhaust a Bug from your hand. Whenever you exhaust a Bug, deal 7 damage to a random enemy.' },
  { id: 'soldering_station', name: 'Soldering Station', icon: '🔥', tier: 'starter', text: 'Start each combat with 3 Charge.' },
  { id: 'ref_thermometer', name: 'Reference Thermometer', icon: '🌡️', tier: 'starter', text: 'At the start of each combat, apply 2 Excursion to ALL enemies.' },
  { id: 'saga_card', name: 'Saga Card', icon: '📟', tier: 'common', text: 'At the end of combat, heal 6 HP. It logged every second of it.' },
  { id: 'standing_desk', name: 'Standing Desk', icon: '🧍', tier: 'common', text: 'Draw 2 additional cards on the first turn of each combat.' },
  { id: 'energy_drink', name: 'Energy Drink', icon: '🥤', tier: 'common', text: 'Start each combat with 1 Strength.' },
  { id: 'headphones', name: 'Noise-Cancelling Headphones', icon: '🎧', tier: 'common', text: 'Start each combat with 1 Dexterity.' },
  { id: 'dry_ice', name: 'Dry Ice Pack', icon: '❄️', tier: 'common', text: 'Whenever you apply Excursion, apply 1 more.' },
  { id: 'lanyard', name: 'Company Lanyard', icon: '🪪', tier: 'common', text: 'On pickup, raise Max HP by 10.' },
  { id: 'rubber_duck', name: 'Rubber Duck', icon: '🦆', tier: 'common', text: 'Your first Attack each combat deals 8 additional damage.' },
  { id: 'hoodie', name: 'Company Hoodie', icon: '🧥', tier: 'common', text: 'Start each combat with 10 Block.' },
  { id: 'kanelsnudur', name: 'Cinnamon Bun', icon: '🥐', tier: 'common', text: 'On pickup, heal 20 HP. Friday treats are sacred.' },
  { id: 'espresso', name: 'Espresso Machine', icon: '☕', tier: 'boss', text: 'Gain 1 additional Energy each turn. You can no longer Rest at the coffee machine: you are wired enough already.' },
  { id: 'stock_options', name: 'Stock Options', icon: '📈', tier: 'boss', text: 'Gain 1 additional Energy each turn. Gain 50% less gold from combat. (Vesting schedule applies.)' },
  { id: 'unlimited_pto', name: 'Unlimited PTO', icon: '🏖️', tier: 'boss', text: 'Gain 1 additional Energy each turn. At the start of each combat, shuffle 2 Meeting Invites into your draw pile. (Nobody actually takes it.)' },
  { id: 'corner_office', name: 'Corner Office', icon: '🪟', tier: 'boss', text: 'Draw 1 additional card each turn.' },
  { id: 'gdp_cert', name: 'GDP Certificate', icon: '🏅', tier: 'boss', text: 'At the end of your turn, gain 4 Block.' },
]

export const RELIC: Record<string, RelicDef> = Object.fromEntries(defs.map((d) => [d.id, d]))
export const COMMON_RELICS = defs.filter((d) => d.tier === 'common').map((d) => d.id)
export const BOSS_RELICS = defs.filter((d) => d.tier === 'boss').map((d) => d.id)
