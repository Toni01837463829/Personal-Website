import type { Activity, Sport } from './content'

// Number, date and time formats for the Strava activities, in Austrian German.

export const sportName: Record<Sport, string> = { swim: 'Schwimmen', bike: 'Radfahrt', run: 'Lauf' }

const num = (v: number, digits: number) =>
  v.toLocaleString('de-AT', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** 130 km, 67,8 km, 3,3 km */
export const km = (meters: number) => num(meters / 1000, meters >= 100_000 ? 0 : 1)

/** 4:33 h or 54 min */
export function duration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h ? `${h}:${String(m).padStart(2, '0')} h` : `${m} min`
}

const minSec = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`

/** How fast, the way each sport counts it: km/h on the bike, min/km running, min/100 m swimming */
export function pace(a: Activity) {
  if (a.sport === 'bike') return `${num((a.distance / a.movingTime) * 3.6, 1)} km/h`
  if (a.sport === 'run') return `${minSec(a.movingTime / (a.distance / 1000))} /km`
  return `${minSec(a.movingTime / (a.distance / 100))} /100 m`
}

/** 18. Juli 2026 */
export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('de-AT', { day: 'numeric', month: 'long', year: 'numeric' })
