import type { ReactNode } from 'react'
import type { HobbyId, PathStep, Sport } from '../content'

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

/** Icons for the stations of the timeline in the about section */
export function PathIcon({ kind }: { kind: PathStep['kind'] }) {
  switch (kind) {
    case 'school':
      // graduation cap
      return (
        <svg {...common} aria-hidden>
          <path d="M3 16l17-7 17 7-17 7z" />
          <path d="M11 19.5v7c0 2 4 4 9 4s9-2 9-4v-7M37 16v9" />
        </svg>
      )
    case 'job':
      // briefcase
      return (
        <svg {...common} aria-hidden>
          <rect x="5" y="12" width="30" height="20" rx="3" />
          <path d="M15 12V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M5 20h30M18 20v3h4v-3" />
        </svg>
      )
    case 'military':
      // shield with a star
      return (
        <svg {...common} aria-hidden>
          <path d="M20 5l13 5v9c0 8-6 13-13 16C13 32 7 27 7 19v-9z" />
          <path d="M20 13l2 4.5 4.8.4-3.7 3.1 1.2 4.7-4.3-2.5-4.3 2.5 1.2-4.7-3.7-3.1 4.8-.4z" />
        </svg>
      )
    case 'study':
      // two sparkles, for the AI studies
      return (
        <svg {...common} aria-hidden>
          <path d="M17 6c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10z" />
          <path d="M30 24c.5 3 2 4.5 5 5-3 .5-4.5 2-5 5-.5-3-2-4.5-5-5 3-.5 4.5-2 5-5z" />
        </svg>
      )
  }
}
