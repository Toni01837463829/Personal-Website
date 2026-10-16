import type { CSSProperties } from 'react'
import { strava, stravaActivities } from '../content'
import { km } from '../format'

// Strava's mark (path from Simple Icons, CC0)
export function StravaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

const orange = '#fc5200'

/** Link to the Strava profile: logo, call to action and the totals of the activities on the wall. */
export function StravaBadge() {
  const distance = stravaActivities.reduce((s, a) => s + a.distance, 0)
  const hours = Math.round(stravaActivities.reduce((s, a) => s + a.movingTime, 0) / 3600)

  return (
    <a
      href={strava.profile}
      target="_blank"
      rel="noopener noreferrer"
      style={{ '--strava': orange } as CSSProperties}
      className="group relative mt-8 flex max-w-md items-center gap-4 overflow-hidden rounded-2xl border border-(--strava)/35 bg-(--strava)/10 p-3.5 pr-5 shadow-[0_24px_60px_-28px_var(--strava)] transition-[border-color,background-color] duration-300 hover:border-(--strava)/70 hover:bg-(--strava)/15"
    >
      {/* Light sweeping across on hover */}
      <span
        aria-hidden
        className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[300%]"
      />
      <span className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-(--strava) text-white shadow-[0_10px_30px_-8px_var(--strava)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
        <StravaLogo className="h-7 w-7" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-lg font-semibold tracking-tight text-ink">{strava.badge}</span>
        <span className="block text-sm text-graphite tabular-nums">
          {stravaActivities.length} Einheiten · {km(distance)} km · {hours} h
        </span>
      </span>
      <span className="relative text-sm font-semibold whitespace-nowrap text-(--strava)">
        Strava <span className="inline-block transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
      </span>
    </a>
  )
}
