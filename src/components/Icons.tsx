import type { HobbyId } from '../content'

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
      // wave, wheel, footstep
      return (
        <svg {...common} aria-hidden>
          <path d="M4 30c3-3 6-3 9 0s6 3 9 0 6-3 9 0 3 1 5 1" />
          <circle cx="13" cy="15" r="7" />
          <circle cx="13" cy="15" r="1" />
          <path d="M28 6c2 0 4 2 4 5s-2 6-4 6-3-2-3-5 1-6 3-6z" />
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
