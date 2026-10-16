import type { ReactNode } from 'react'
import type { HobbyId, Sport } from '../content'

const common = {
  width: 40,
  height: 40,
  viewBox: '0 0 40 40',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function HobbyIcon({ id }: { id: HobbyId }) {
  switch (id) {
    case 'triathlon':
      // swim, bike and run, the three sport icons shrunk into a triangle
      return (
        <svg {...common} aria-hidden>
          <g transform="translate(0 0) scale(0.5)" strokeWidth={common.strokeWidth * 2}>
            {sportShapes.swim}
          </g>
          <g transform="translate(20 0) scale(0.5)" strokeWidth={common.strokeWidth * 2}>
            {sportShapes.run}
          </g>
          <g transform="translate(10 18) scale(0.5)" strokeWidth={common.strokeWidth * 2}>
            {sportShapes.bike}
          </g>
        </svg>
      )
    case 'simracing':
      // steering wheel
      return (
        <svg {...common} aria-hidden>
          <circle cx="20" cy="20" r="14" />
          <circle cx="20" cy="22" r="4" />
          <path d="M6.5 17c5-2 9-2 13.5-2s8.5 0 13.5 2M20 26v8" />
        </svg>
      )
    case 'coding':
      return (
        <svg {...common} aria-hidden>
          <rect x="4" y="7" width="32" height="26" rx="4" />
          <path d="M4 13h32M14 20l-4 4 4 4M26 20l4 4-4 4M22 18l-4 12" />
        </svg>
      )
    case 'feuerwehr':
      // helmet
      return (
        <svg {...common} aria-hidden>
          <path d="M7 27c0-9 6-16 13-16s13 7 13 16" />
          <path d="M4 27h32v3H4zM20 11V7M15 13l2 14M25 13l-2 14" />
        </svg>
      )
  }
}

const sportShapes: Record<Sport, ReactNode> = {
  // swimmer over two waves
  swim: (
    <>
      <circle cx="27" cy="11" r="3" />
      <path d="M8 21l8-6 5 4 5-3" />
      <path d="M4 26c3-3 6-3 9 0s6 3 9 0 6-3 9 0 3 1 5 1M4 32c3-3 6-3 9 0s6 3 9 0 6-3 9 0 3 1 5 1" />
    </>
  ),
  bike: (
    <>
      <circle cx="10" cy="27" r="6" />
      <circle cx="30" cy="27" r="6" />
      <path d="M10 27l6-11h10l4 11M16 16l5 11h-11M19 12h-5M26 16l-1-5h4" />
    </>
  ),
  // running shoe
  run: (
    <>
      <path d="M6 28c0-5 1-9 3-13 2 2 5 3 8 2l3 5c4 1 9 2 12 4 2 1 3 3 3 5H8c-1 0-2-1-2-3z" />
      <path d="M6 31h29M18 19l-2 2M20 22l-2 2M23 23l-1 2" />
    </>
  ),
}

export function SportIcon({ sport }: { sport: Sport }) {
  return (
    <svg {...common} aria-hidden>
      {sportShapes[sport]}
    </svg>
  )
}
