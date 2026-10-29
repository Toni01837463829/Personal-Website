import { motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { strava, stravaActivities, type Activity } from '../content'
import { km, sportName } from '../format'
import { ActivityCard } from './ActivityCard'
import { glow } from './glow'
import { SportIcon } from './Icons'
import { StravaLogo } from './StravaBadge'
import { useOnScreen, usePointerValue } from './Mouse'

// How far each tile floats in front of the wall, so the grid shows some depth when it tilts
const depths = [30, 10, 45, 15, 55, 20, 40, 5, 25, 50, 12, 35, 22, 60, 8, 42, 18, 52, 28, 14]

const TEASE_UP_MS = 1100
const TEASE_REST_MS = 900

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
// Steps through the tiles in jumps, so the teaser hops around the wall but still visits every tile
const teaseStep = [7, 5, 3, 1].find((s) => gcd(s, stravaActivities.length) === 1)!
const teaseOrder = (turn: number) => (turn * teaseStep) % stravaActivities.length

/**
 * Wall of glass tiles, one per Strava activity, that tilts toward the mouse. Hovering a
 * tile lifts it off the wall with a light that follows the cursor, and a card with its
 * route and numbers pops out beside the wall. Tiles open the activity on Strava.
 * Until the visitor hovers one, the tiles take turns lifting by themselves, so the wall
 * reads as something to play with.
 */
export function ActivityWall() {
  const reduced = useReducedMotion()
  const wall = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(wall)
  const rotateY = usePointerValue(onScreen, (x) => (reduced ? 0 : x * 16))
  const rotateX = usePointerValue(onScreen, (_, y) => (reduced ? 0 : y * -12))

  const [shown, setShown] = useState<Activity | null>(null)
  const [cardY, setCardY] = useState(0)
  // Until the first hover, tiles take turns lifting by themselves, hinting that they react
  const [touched, setTouched] = useState(false)
  const [teaser, setTeaser] = useState<number | null>(null)
  const visible = useInView(wall, { amount: 0.6 })
  const teasing = visible && !touched && !reduced

  useEffect(() => {
    if (!teasing) return
    let turn = 0
    let timer = 0
    const lift = () => {
      setTeaser(teaseOrder(turn++))
      timer = window.setTimeout(rest, TEASE_UP_MS)
    }
    const rest = () => {
      setTeaser(null)
      timer = window.setTimeout(lift, TEASE_REST_MS)
    }
    timer = window.setTimeout(lift, TEASE_REST_MS)
    return () => window.clearTimeout(timer)
  }, [teasing])

  // The card follows the hovered tile up and down a little, from the wall's middle
  const show = (activity: Activity, tile: HTMLElement) => {
    const w = wall.current!.getBoundingClientRect()
    const t = tile.getBoundingClientRect()
    setCardY((t.top + t.height / 2 - (w.top + w.height / 2)) * 0.4)
    setShown(activity)
    setTouched(true)
  }

  return (
    <div ref={wall} style={{ perspective: 1200 }} className="relative z-10 mx-auto w-full max-w-[min(30rem,calc((100svh-19rem)*0.8))]">
      {/* Accent light behind the tiles, glowing through their tinted glass */}
      <div aria-hidden className="absolute -inset-x-[54%] -inset-y-[35%]" style={{ background: glow('var(--accent-a)', 0.23) }} />
      <h4 className="relative mb-5 flex items-center gap-2.5 text-lg font-semibold tracking-tight">
        <StravaLogo className="h-5 w-5 text-[#fc5200]" />
        {strava.heading}
      </h4>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onPointerLeave={() => setShown(null)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setShown(null)}
        className="grid grid-cols-4 gap-2.5 md:gap-3"
      >
        {stravaActivities.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.8, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <ActivityTile
              activity={a}
              depth={depths[i % depths.length]}
              active={shown ? shown.id === a.id : teasing && teaser === i}
              onShow={(tile) => show(a, tile)}
            />
          </motion.div>
        ))}
      </motion.div>

      <ActivityCard activity={shown} y={cardY} />
    </div>
  )
}

const activityUrl = (a: Activity) => `https://www.strava.com/activities/${a.id}`

function ActivityTile({
  activity,
  depth,
  active,
  onShow,
}: {
  activity: Activity
  depth: number
  active: boolean
  onShow: (tile: HTMLElement) => void
}) {
  // The hover light follows the cursor through CSS variables, without re-rendering
  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--gx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--gy', `${e.clientY - r.top}px`)
  }

  return (
    <motion.a
      href={activityUrl(activity)}
      target="_blank"
      rel="noopener noreferrer"
      initial={false}
      animate={active ? { z: depth + 50, scale: 1.05 } : { z: depth, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      onPointerMove={onMove}
      onPointerEnter={(e) => onShow(e.currentTarget)}
      onFocus={(e) => onShow(e.currentTarget)}
      data-active={active || undefined}
      aria-label={`${sportName[activity.sport]}: ${activity.name}, ${km(activity.distance)} km, auf Strava ansehen`}
      className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-[#0c1016]/85 shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_24px_40px_-20px_rgba(0,0,0,.8)] transition-colors duration-300 outline-none data-active:border-(--accent-a)/60"
    >
      <div className="absolute inset-0 bg-linear-to-br from-(--accent-a)/10 via-transparent to-transparent" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-data-active:opacity-100"
        style={{
          background:
            'radial-gradient(110px circle at var(--gx, 50%) var(--gy, 50%), color-mix(in srgb, var(--accent-a) 30%, rgb(255 255 255 / 0.12)), transparent 65%)',
        }}
      />
      <div className="relative flex h-full flex-col items-center justify-center gap-1.5 text-graphite transition-colors duration-300 group-data-active:text-(--accent-a) [&_svg]:h-7 [&_svg]:w-7">
        <SportIcon sport={activity.sport} />
        <span className="text-[10px] font-medium text-mist tabular-nums transition-colors group-data-active:text-ink">
          {km(activity.distance)} km
        </span>
      </div>
    </motion.a>
  )
}
