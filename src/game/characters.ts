import type { CharId } from './types'

export type { CharId }

export interface CharacterDef {
  id: CharId
  name: string
  title: string
  hp: number
  relic: string
  deck: string[]
  blurb: string
  mechanic: string
  color: string
  portrait: string
}

const basics = (a: string, b: string) => ['ping', 'ping', 'ping', 'ping', 'insulate', 'insulate', 'insulate', 'insulate', a, b]

export const CHARACTERS: Record<CharId, CharacterDef> = {
  fw: {
    id: 'fw',
    name: 'Firmware Developer',
    title: 'Keeper of the Devicetree',
    hp: 80,
    relic: 'jlink',
    deck: basics('printf', 'breakpoint'),
    blurb: 'Writes C for devices that sleep more than you do. Fluent in Zephyr, Kconfig and quiet despair.',
    mechanic: 'Bugs: many cards add Bug cards to your deck. Debug cards exhaust them for Block, cards and damage.',
    color: '#5cd6ce',
    portrait: 'player_fw',
  },
  hw: {
    id: 'hw',
    name: 'Hardware Engineer',
    title: 'Sniffer of Magic Smoke',
    hp: 82,
    relic: 'soldering_station',
    deck: basics('solder_joint', 'discharge'),
    blurb: 'Has a scar from every PCB revision. Owns more oscilloscope probes than socks.',
    mechanic: 'Charge: build up ⚡ Charge that persists between turns, then Discharge it for huge damage or Block.',
    color: '#f2c230',
    portrait: 'player_hw',
  },
  cal: {
    id: 'cal',
    name: 'Calibration Specialist',
    title: 'Guardian of the Uncertainty Budget',
    hp: 68,
    relic: 'ref_thermometer',
    deck: basics('thermocouple_jab', 'ice_bath'),
    blurb: 'Knows exactly how wrong every thermometer is. Including the one in your car.',
    mechanic: 'Excursion: stack temperature excursions on enemies (damage over time), then cash in with payoff cards.',
    color: '#669ed4',
    portrait: 'player_cal',
  },
}

export const CHARACTER_IDS: CharId[] = ['fw', 'hw', 'cal']
