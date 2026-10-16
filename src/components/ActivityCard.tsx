import { AnimatePresence, motion } from 'motion/react'
import type { Activity } from '../content'
import { duration, km, longDate, pace, sportName } from '../format'
import { SportIcon } from './Icons'

const draw = { duration: 1.1, delay: 0.1, ease: [0.65, 0, 0.35, 1] } as const

/**
 * Card that pops out next to the activity wall while a tile is hovered: the route (or the
 * pool for swims), the main numbers and the elevation profile. Nothing else on the page
 * changes; the card just floats beside the wall, following the hovered tile up and down.
 */
export function ActivityCard({ activity, y }: { activity: Activity | null; y: number }) {
  return (
    <motion.div
      aria-live="polite"
      animate={{ y }}
      transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      className="pointer-events-none absolute top-1/2 right-[calc(100%+1.5rem)] z-20 w-[21rem] -translate-y-1/2"
    >
      <AnimatePresence mode="popLayout">
        {activity && (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, scale: 0.9, x: 32 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{ transformOrigin: 'right center' }}
            className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c1016] p-2.5 shadow-[0_40px_80px_-30px_rgba(0,0,0,.9),inset_0_1px_0_rgba(255,255,255,.08)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/5 bg-[#080b10]">
              <div
                aria-hidden
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--accent-a)_22%,transparent),transparent_65%)]" />
              {activity.route ? <RouteMap id={activity.id} route={activity.route} /> : <Pool />}
            </div>

            <div className="px-2.5 pt-4 pb-2">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-(--accent-a)/15 text-(--accent-a) [&_svg]:h-6 [&_svg]:w-6">
                  <SportIcon sport={activity.sport} />
                </span>
                <div>
                  <p className="text-[11px] font-medium tracking-[0.2em] text-accent uppercase">{sportName[activity.sport]}</p>
                  <p className="text-xs text-mist">{longDate(activity.date)}</p>
                </div>
              </div>

              <h3 className="mt-3 text-xl font-semibold tracking-tight">{activity.name}</h3>

              <dl className="mt-3 grid grid-cols-2 gap-2">
                <Stat label="Distanz" value={`${km(activity.distance)} km`} big />
                <Stat label="Zeit" value={duration(activity.movingTime)} big />
                <Stat label="Tempo" value={pace(activity)} />
                {activity.elevationGain ? (
                  <Stat label="Höhenmeter" value={`${activity.elevationGain.toLocaleString('de-AT')} m`} />
                ) : (
                  activity.avgHr && <Stat label="Ø Puls" value={`${activity.avgHr} bpm`} />
                )}
              </dl>

              {activity.elevation && <Profile id={activity.id} values={activity.elevation} />}

              <p className="mt-3 border-t border-white/5 pt-3 text-[11px] text-mist">
                Klicken öffnet die Aktivität auf <span className="font-semibold text-[#fc5200]">Strava</span> ↗
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
      <dt className="text-[10px] tracking-[0.2em] text-mist uppercase">{label}</dt>
      <dd className={`mt-1 font-semibold tracking-tight tabular-nums ${big ? 'text-xl' : 'text-sm'}`}>{value}</dd>
    </div>
  )
}

/** The route drawing itself in, glowing in the hobby's colors. */
function RouteMap({ id, route }: { id: string; route: [number, number][] }) {
  const w = Math.max(...route.map((p) => p[0]))
  const h = Math.max(...route.map((p) => p[1]))
  const pad = 90
  const size = Math.max(w, h) + pad * 2
  const d = 'M' + route.map((p) => p.join(' ')).join('L')
  const [start, end] = [route[0], route[route.length - 1]]

  return (
    <svg
      viewBox={`${(w - size) / 2} ${(h - size) / 2} ${size} ${size}`}
      className="relative h-full w-full"
      aria-label="Streckenverlauf"
      role="img"
    >
      <defs>
        <linearGradient id={`route-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent-b)" />
          <stop offset="1" stopColor="var(--accent-a)" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <motion.path
        d={d}
        fill="none"
        stroke="var(--accent-a)"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.35}
        filter={`url(#glow-${id})`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={draw}
      />
      <motion.path
        d={d}
        fill="none"
        stroke={`url(#route-${id})`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={draw}
      />
      <circle cx={start[0]} cy={start[1]} r="13" fill="#0c1016" stroke="var(--accent-b)" strokeWidth="5" />
      <motion.circle
        cx={end[0]}
        cy={end[1]}
        r="13"
        fill="var(--accent-a)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: draw.delay + draw.duration, type: 'spring', stiffness: 300, damping: 15 }}
      />
    </svg>
  )
}

/** Pool swims have no GPS: lanes with a line swimming lengths across them instead. */
function Pool() {
  const lanes = 6
  const top = 220
  const lane = 560 / lanes
  const d = Array.from({ length: lanes }, (_, i) => {
    const y = top + lane * (i + 0.5)
    const [a, b] = i % 2 ? [860, 140] : [140, 860]
    return `${i ? 'L' : 'M'}${a} ${y}L${b} ${y}`
  }).join('')

  return (
    <svg viewBox="0 0 1000 1000" className="relative h-full w-full" aria-label="Schwimmbecken" role="img">
      <rect x="100" y={top} width="800" height={lane * lanes} rx="24" fill="rgb(255 255 255 / 0.02)" stroke="rgb(255 255 255 / 0.12)" strokeWidth="3" />
      {Array.from({ length: lanes - 1 }, (_, i) => (
        <line
          key={i}
          x1="100"
          x2="900"
          y1={top + lane * (i + 1)}
          y2={top + lane * (i + 1)}
          stroke="rgb(255 255 255 / 0.1)"
          strokeWidth="3"
          strokeDasharray="4 14"
        />
      ))}
      <motion.path
        d={d}
        fill="none"
        stroke="var(--accent-a)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={draw}
      />
    </svg>
  )
}

/** Elevation over the activity as a soft area chart. */
function Profile({ id, values }: { id: string; values: number[] }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100} ${30 - ((v - min) / range) * 26}`)
  const line = 'M' + pts.join('L')

  return (
    <div className="pt-4">
      <div className="flex items-baseline justify-between text-[11px] tracking-[0.2em] text-mist uppercase">
        <span>Höhenprofil</span>
        <span className="tracking-normal normal-case tabular-nums">
          {min}–{max} m
        </span>
      </div>
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="mt-2 h-10 w-full" aria-hidden>
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent-a)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--accent-a)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={`${line}L100 32L0 32Z`}
          fill={`url(#area-${id})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke="var(--accent-a)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={draw}
        />
      </svg>
    </div>
  )
}
