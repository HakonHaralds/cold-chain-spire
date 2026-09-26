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

Dev shortcuts: `?gallery` shows every character; `?fight=boss_cto&act=2&char=hw&comp=office_dog` jumps
straight into a fight; `?setting=wroclaw` previews a backdrop.
Balance checks: `npx tsx scripts/balance.ts` (bot win rates per character, companion, Rewrite, perk and
Performance Review level) and `npx tsx scripts/events-ev.ts` (expected value of every event option).

## Systems

- **Companions:** pick a work buddy at the start of a run (Intern, Rubber Duck, Friendly QA, IT Guy,
  Office Dog, Summer Student). They act every turn and level up after each boss.
- **Branching upgrades:** at the coffee machine, *Refactor* (normal upgrade) or *Rewrite* (upgraded,
  costs 1 less, but shuffles a Bug into your draw pile when played).
- **OKRs:** choose one quarterly objective per act; it pays out the moment you hit it.
- **Tokens:** the currency, in thousands (start with 99k).
- **Relics:** 61 (common, uncommon, rare, boss, shop-only, plus class-specific ones), with drop odds and
  prices by rarity. `MODE=relics npx tsx scripts/balance.ts` measures each relic's win-rate impact.
- **Characters unlock by playing:** start as the Firmware Developer; beat the Act 1 boss with a character
  (or play 3 runs with them) to unlock the next one.
- **Onboarding perks per character:** each win with a character unlocks the next perk on their ladder of 8.
- **Career ladder:** XP from every run unlocks titles, companions, permanent benefits and extra perk slots.
- **Performance Reviews:** 10 stacking difficulty levels, unlocked by career level 3 or your first win.
- **Achievements:** 81, with an unlock banner; browse them in the Compendium along with enemies
  (and their heard quotes), cards and relics.
- **Settings:** each act rolls one of two real locations: M2 or M4, S3 or Wrocław, LogiPharma or
  LOV Week, then the Saltpeter Mine. Some events only happen in specific places.

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
