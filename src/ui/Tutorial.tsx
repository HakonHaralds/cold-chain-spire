import { useEffect, useLayoutEffect, useState } from 'react'

export interface TourStep {
  sel: string
  title: string
  body: string
}

const KEY = 'ccs-tutorial-v1'

function readDone(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}
export function tourDone(id: string) {
  return !!readDone()[id]
}
export function markTour(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readDone(), [id]: true }))
  } catch {
    /* storage unavailable: tutorial just shows again next time */
  }
}
export function resetTours() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export const TOURS: Record<string, TourStep[]> = {
  map: [
    { sel: '.map-node.available', title: 'Choose your path', body: 'Each circle is a stop on this floor. Glowing ones are reachable: click one to go there. You can only move upward.' },
    { sel: '.legend', title: 'What the icons mean', body: 'Meetings are fights, Escalations are tough elites, the coffee machine lets you rest, the vending machine is a shop, and ❓ is a random event.' },
    { sel: '.boss-preview', title: 'The boss', body: 'Every act ends with a boss. Build your deck along the way so you are ready for them.' },
    { sel: '.tb-left', title: 'Health and gold', body: 'Your HP carries over between fights. Gold buys cards, relics and card removals in shops.' },
    { sel: '.tb-relics', title: 'Relics', body: 'Relics are passive bonuses. Hover them to read what they do. Your starting relic is unique to your character.' },
    { sel: '.deck-btn', title: 'Your deck', body: 'Click to see every card you own. A lean deck draws your best cards more often.' },
  ],
  combat: [
    { sel: '.player-side .fighter-info', title: 'This is you', body: 'Your HP and Block. Block absorbs damage but disappears at the start of your next turn.' },
    { sel: '.energy-orb', title: 'Energy', body: 'You get Energy every turn. Each card costs the number in its top-left corner.' },
    { sel: '.hand', title: 'Your hand', body: 'Hover a card to enlarge it and see keyword explanations. Click to play it. Attacks that need a target: click the card, then click an enemy. Number keys work too.' },
    { sel: '.enemy:not(.dead) .intent', title: 'Enemy intent', body: 'This shows what the enemy will do next turn. ⚔️ is an attack with its damage; 🛡️ is defending; ✨ and 🌀 are buffs and debuffs. Plan around it!' },
    { sel: '.enemy:not(.dead) .fighter-info', title: 'Enemy health and effects', body: 'Enemies have HP, Block and status effects too. Hover a status icon to see what it does.' },
    { sel: '.piles', title: 'Discard and exhaust', body: 'Played cards go to the discard pile and are reshuffled into your draw pile when it runs out. Exhausted cards are gone for the rest of the fight.' },
    { sel: '.end-turn', title: 'End your turn', body: 'When you are out of Energy or good moves, end your turn (or press E). Unplayed cards are discarded and enemies act.' },
  ],
  reward: [{ sel: '.card-choice', title: 'Grow your deck', body: 'Pick one card to add to your deck, or skip if none of them fit. Not every card makes your deck better!' }],
}

export function Tour({ id, onDone }: { id: string; onDone: () => void }) {
  const steps = TOURS[id]
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[i]

  useLayoutEffect(() => {
    let raf = 0
    const measure = () => {
      const el = document.querySelector(step.sel)
      setRect(el ? el.getBoundingClientRect() : null)
    }
    // Re-measure for a moment: layouts animate in.
    const until = performance.now() + 700
    const loop = () => {
      measure()
      if (performance.now() < until) raf = requestAnimationFrame(loop)
    }
    loop()
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [step.sel])

  const next = () => {
    if (i + 1 >= steps.length) finish()
    else setI(i + 1)
  }
  const finish = () => {
    markTour(id)
    onDone()
  }
  const skipAll = () => {
    for (const t of Object.keys(TOURS)) markTour(t)
    onDone()
  }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') skipAll()
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  })

  const pad = 10
  const hole = rect ? { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : null
  // Put the tip on whichever side has room.
  let tipStyle: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }
  if (hole) {
    const below = window.innerHeight - (hole.top + hole.height)
    const cx = Math.min(Math.max(hole.left + hole.width / 2, 180), window.innerWidth - 180)
    if (below > 220) tipStyle = { left: cx, top: hole.top + hole.height + 14, transform: 'translateX(-50%)' }
    else if (hole.top > 220) tipStyle = { left: cx, top: hole.top - 14, transform: 'translate(-50%,-100%)' }
    else tipStyle = { left: Math.max(16, hole.left - 360), top: hole.top, transform: 'none' }
  }

  return (
    <div className="tour" onClick={next} role="dialog" aria-modal aria-label={step.title}>
      {hole ? <div className="tour-hole" style={hole} /> : <div className="tour-dim" />}
      <div className="tour-tip" style={tipStyle} onClick={(e) => e.stopPropagation()} key={i}>
        <div className="overline">
          Tutorial · {i + 1}/{steps.length}
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="tour-actions">
          <button className="btn ghost small" onClick={skipAll}>
            Skip tutorial
          </button>
          <button className="btn primary small" onClick={next} autoFocus>
            {i + 1 >= steps.length ? 'Got it!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
