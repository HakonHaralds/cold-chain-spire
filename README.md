# Slay the Cold Chain

A Slay-the-Spire-style deck-building roguelike with Hearthstone-flavored cards, about keeping shipments
between 2 and 8 °C and surviving the org chart. React + TypeScript + Vite; all art is hand-built inline SVG.

## Run

```sh
yarn install
yarn dev          # http://localhost:5173
yarn build        # static build in dist/ (open with `yarn preview`)
```

Characters: **Firmware Developer** (Bugs: generate them, then exhaust them for payoffs), **Hardware Engineer**
(Charge: build it up, then discharge it) and **Calibration Specialist** (Excursion: damage over time plus payoffs).
The first run shows a short click-away tutorial per screen; "Replay tutorial" on the title screen resets it.

Dev shortcuts: `?gallery` shows every character; `?fight=boss_cto&act=2&char=hw` jumps straight into a fight.
Balance check: `npx tsx scripts/simulate.ts` (greedy bot vs every elite and boss).

## Deploy

Pushing to `main` auto-deploys to GitHub Pages (`.github/workflows/deploy.yml`), served at
`coldchain.hakonvidir.is` (see `public/CNAME`). The page is marked `noindex` and `robots.txt` disallows
crawlers, but the site is public to anyone with the link.

## Structure

| Path | What |
|---|---|
| `src/game/core.ts` | Combat primitives: damage, block, statuses, draw |
| `src/game/cards.ts` | All cards (basic → rare, statuses, curses) |
| `src/game/enemies.ts` | Enemies, elites, bosses, their move patterns and encounters per act |
| `src/game/combat.ts` | Turn flow: start, play card, end turn, enemy actions |
| `src/game/map.ts` / `events.ts` / `relics.ts` | Map generation, `?` events, relics |
| `src/art/` | SVG character builder (`Person.tsx`) and all portraits |
| `src/ui/` | Screens: title, map, combat, reward, rest, shop, event |

## Acts

1. **The Warehouse**: Sensitech Minions, Rogue Data Loggers, Quality Department, Lead Auditor → **Director of People & Culture**
2. **The Open Office**: Roche Managers, Big Four Consultants, Procurement, Roche VP → **The CTO (After the Launch Party)**
3. **The Boardroom**: Board Members, VCs, Sensitech Regional Director, Regulatory Inspector → **The CEO**
4. **The Saltpeter Mine**: rest, shop → **Peter, the Saltpeter Guardian**
