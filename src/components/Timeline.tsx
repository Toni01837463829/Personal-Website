import { motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { PathStep } from '../content'
import { PathIcon } from './Icons'

/** Where things sit along the track, in px; measured, so it follows the screen size */
type Geo = { view: number; width: number; lefts: number[]; widths: number[]; years: { x: number; year: number }[] }

const kinds: Record<PathStep['kind'], { label: string; color: string }> = {
  school: { label: 'Schule', color: '#4338ca' },
  job: { label: 'Job', color: '#0284c7' },
  military: { label: 'Dienst', color: '#65a30d' },
  study: { label: 'Studium', color: '#7c3aed' },
}

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

// Once the track starts sliding, the tip of the line stays at this share of the screen width
const LEAD = 0.6
// Lines the first station up with the page's content column (max-w-6xl), leaving room for its card
const PAD = 'max(4.5rem, calc((100vw - 72rem) / 2 + 4.5rem))'
// Anything longer than this is drawn shortened (--long wide) with a break in the line
const LONG = 24
// An ongoing step runs this many months past today, fading out
const TAIL = 2

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** 'YYYY-MM' as a running month number */
const monthOf = (s: string) => {
  const [y, m] = s.split('-').map(Number)
  return y * 12 + m - 1
}
const now = new Date()
const NOW = now.getFullYear() * 12 + now.getMonth()
const name = (m: number) => MONTHS[m % 12]
const year = (m: number) => Math.floor(m / 12)

/** "Sep 2024 – Feb 2025", "Jul – Aug 2024", "2019 – 2024" or "seit Okt 2026" */
function dates(from: number, to: number | null) {
  if (to === null) return `seit ${name(from)} ${year(from)}`
  if (to - from + 1 > LONG) return `${year(from)} – ${year(to)}`
  if (year(from) === year(to)) return `${name(from)} – ${name(to)} ${year(to)}`
  return `${name(from)} ${year(from)} – ${name(to)} ${year(to)}`
}

function duration(months: number) {
  if (months >= 12) {
    const y = Math.round(months / 12)
    return y === 1 ? '1 Jahr' : `${y} Jahre`
  }
  return months === 1 ? '1 Monat' : `${months} Monate`
}

/** A spot on the track: so many shortened stretches plus so many months in from the start */
const at = (long: number, months: number) => `calc(${PAD} + ${long} * var(--long) + ${months} * var(--m))`

type Placed = { step: PathStep; left: string; width: string; months: number; long: boolean; open: boolean; from: number; to: number | null }
type Cell = { left: string; month: number; year: boolean }

/** Lays the steps out along a time axis: one --m per month, long stretches shortened. */
function layout(steps: PathStep[]) {
  const placed: Placed[] = []
  const cells: Cell[] = []
  const breaks: { left: string; start: string; year: number }[] = []
  let long = 0
  let months = 0
  let end: number | null = null

  for (const step of steps) {
    const from = monthOf(step.from)
    const to = step.to ? monthOf(step.to) : null
    // A gap between two steps still takes its months on the axis
    if (end !== null) months += Math.max(0, from - end - 1)
    const last = to ?? Math.max(NOW, from)
    const count = last - from + 1
    const isLong = count > LONG

    if (isLong) {
      breaks.push({ left: `calc(${PAD} + ${long + 0.72} * var(--long) + ${months} * var(--m))`, start: at(long, months), year: year(from) })
      placed.push({ step, left: at(long, months), width: 'var(--long)', months: count, long: true, open: !to, from, to })
      long++
    } else {
      for (let k = 0; k < count; k++) {
        const month = from + k
        // Years are marked at every January, and wherever the month scale (re)starts
        const restart = cells.length === 0 || (k === 0 && placed.at(-1)?.long === true)
        cells.push({ left: at(long, months + k), month, year: month % 12 === 0 || restart })
      }
      const tail = to ? 0 : TAIL
      placed.push({ step, left: at(long, months), width: `calc(${count + tail} * var(--m))`, months: count, long: false, open: !to, from, to })
      months += count + tail
    }
    end = last
  }

  return { placed, cells, breaks, width: `calc(${PAD} * 2 + ${long} * var(--long) + ${months} * var(--m))` }
}

/**
 * My path as a horizontal time axis, pinned while you scroll through it. One width per
 * month with month names and the years marked, so you see at a glance how long each step
 * was; long stretches like school are shortened with a break. As you scroll, each step's
 * stretch fills in its own color and its card grows out of the line, alternating above and
 * below; once the line gets far enough, the track slides along with it. Big hollow
 * numbers in the back show the year the line is at.
 */
export function Timeline({ steps }: { steps: PathStep[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const view = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLOListElement>(null)
  const stations = useRef<(HTMLLIElement | null)[]>([])
  const geo = useMotionValue<Geo>({ view: 1, width: 1, lefts: steps.map(() => Infinity), widths: steps.map(() => 1), years: [] })
  const { placed, cells, breaks, width } = layout(steps)
  // The blinking "now" marks only run while the timeline is on screen
  const live = useInView(view)

  // Measured when the browser has laid the track out (the observer reports right after
  // layout, before painting), so it never forces a layout of its own. While the browser
  // skips the track (content-visibility, far from the screen) there is nothing to measure:
  // the observer reports the track again once it has been laid out
  useLayoutEffect(() => {
    const measure = () => {
      if (!view.current || !track.current) return
      if (track.current.checkVisibility?.({ contentVisibilityAuto: true }) === false) return
      geo.set({
        view: view.current.clientWidth,
        width: track.current.offsetWidth,
        lefts: stations.current.map((s) => s?.offsetLeft ?? 0),
        widths: stations.current.map((s) => s?.offsetWidth ?? 1),
        // Each year label sits in its tick's box, which is placed along the track
        years: [...track.current.querySelectorAll<HTMLElement>('[data-year]')]
          .map((el) => ({ x: el.parentElement!.offsetLeft, year: Number(el.dataset.year) }))
          .sort((a, b) => a.x - b.x),
      })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(view.current!)
    observer.observe(track.current!)
    return () => observer.disconnect()
  }, [geo])

  // Starts drawing while the timeline is still coming up, ends as it is about to leave
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 65%', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 32, mass: 0.4 })
  // How far along the track the line has drawn, in px
  const tip = useTransform(() => {
    const g = geo.get()
    const start = g.lefts[0] - 60
    const end = g.lefts[g.lefts.length - 1] + g.widths[g.widths.length - 1]
    return start + progress.get() * (end - start)
  })
  const x = useTransform(() => {
    const g = geo.get()
    return -Math.min(Math.max(0, g.width - g.view), Math.max(0, tip.get() - g.view * LEAD))
  })

  return (
    <div
      ref={ref}
      // About as much scrolling as the track is long, so the line keeps pace with the wheel
      style={{ height: `calc(35svh + ${width})` }}
      className="relative [--long:9rem] [--m:2.5rem] md:[--long:13rem] md:[--m:3.5rem]"
    >
      {/* Skipped by the browser while away from the screen (content-visibility) */}
      <div ref={view} className="sticky top-0 h-svh overflow-hidden [content-visibility:auto]">
        <Year tip={tip} geo={geo} />
        <p className="absolute inset-x-0 top-28 mx-auto max-w-6xl px-6 text-xs font-medium tracking-[0.25em] text-mist uppercase md:px-10">
          Mein Weg
        </p>

        <motion.ol ref={track} style={{ x, width }} className="relative h-full will-change-transform">
          {/* The axis: a faint line with a tick per month, month names below, years above */}
          <li aria-hidden className="absolute inset-0">
            <div className="absolute inset-x-0 top-1/2 h-px bg-stone [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]" />
            {cells.map((c) => (
              <div key={c.month} className="absolute top-1/2 h-0 w-(--m)" style={{ left: c.left }}>
                <span className={`absolute left-0 w-px -translate-y-1/2 ${c.year ? 'h-4 bg-graphite/50' : 'h-1.5 bg-stone'}`} />
                <span className="absolute top-2.5 inset-x-0 text-center text-[10px] font-medium text-mist">{name(c.month)}</span>
                {c.year && (
                  <span data-year={year(c.month)} className="absolute bottom-2.5 left-0 pl-1.5 text-[11px] font-semibold text-graphite tabular-nums">
                    {year(c.month)}
                  </span>
                )}
              </div>
            ))}
            {breaks.map((b) => (
              <div key={b.year}>
                <div className="absolute top-1/2 h-0" style={{ left: b.start }}>
                  <span className="absolute left-0 h-4 w-px -translate-y-1/2 bg-graphite/50" />
                  <span data-year={b.year} className="absolute bottom-2.5 left-0 pl-1.5 text-[11px] font-semibold text-graphite tabular-nums">
                    {b.year}
                  </span>
                </div>
                {/* Two slanted white cuts through the line: time skipped here. No backing box,
                    so the stretch's hover glow shows around them */}
                <span className="absolute top-1/2 z-10 h-4 w-2.5 -translate-y-1/2" style={{ left: b.left }}>
                  <span className="absolute inset-y-0 left-0 w-[3px] rotate-[20deg] rounded-full bg-white shadow-[0_0_0_1px_rgb(17_21_28/0.15)]" />
                  <span className="absolute inset-y-0 right-0 w-[3px] rotate-[20deg] rounded-full bg-white shadow-[0_0_0_1px_rgb(17_21_28/0.15)]" />
                </span>
              </div>
            ))}
          </li>

          {placed.map((p, i) => (
            <Station
              key={i}
              ref={(el) => {
                stations.current[i] = el
              }}
              placed={p}
              index={i}
              tip={tip}
              geo={geo}
              live={live}
            />
          ))}

          <motion.li
            aria-hidden
            style={{ x: tip }}
            className="absolute top-1/2 left-0 z-20 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--accent-b) shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-b)_20%,transparent),0_0_24px_6px_color-mix(in_srgb,var(--accent-b)_45%,transparent)] will-change-transform"
          />
        </motion.ol>
      </div>
    </div>
  )
}

/** The year the line has got to, big and hollow in the back. */
function Year({ tip, geo }: { tip: MotionValue<number>; geo: MotionValue<Geo> }) {
  const [current, setCurrent] = useState<number | null>(null)
  useMotionValueEvent(tip, 'change', (t) => {
    const reached = geo.get().years.filter((y) => t >= y.x)
    setCurrent(reached.at(-1)?.year ?? geo.get().years[0]?.year ?? null)
  })
  if (current === null) return null

  return (
    <motion.span
      key={current}
      aria-hidden
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="text-outline absolute -right-[0.04em] -bottom-[0.18em] text-[clamp(9rem,26vw,24rem)] leading-none font-bold tracking-tighter select-none"
    >
      {current}
    </motion.span>
  )
}

/**
 * One step: its stretch of the axis filling in its color as the line passes, and a card
 * on a short stem from the middle of it, above the line for even steps and below for odd
 * ones. Hovering the card lifts it, lights it up under the mouse and makes its stretch glow.
 */
function Station({
  placed: { step, left, width, months, open, from, to },
  index,
  tip,
  geo,
  live,
  ref,
}: {
  placed: Placed
  index: number
  tip: MotionValue<number>
  geo: MotionValue<Geo>
  live: boolean
  ref: (el: HTMLLIElement | null) => void
}) {
  const above = index % 2 === 0
  const kind = kinds[step.kind]
  // How much of the stretch the line has covered
  const fill = useTransform(() => {
    const g = geo.get()
    return clamp01((tip.get() - g.lefts[index]) / g.widths[index])
  })
  // 0 while the line is before the step, 1 once it is a bit into it
  const shown = useTransform(() => {
    const g = geo.get()
    return clamp01((tip.get() - g.lefts[index] - Math.min(g.widths[index] / 2, 60) + 40) / 140)
  })
  const node = useTransform(shown, (s) => clamp01(s * 2))
  const stem = useTransform(shown, (s) => clamp01((s - 0.15) / 0.45))
  const cardOpacity = useTransform(shown, (s) => clamp01((s - 0.3) / 0.6))
  const cardY = useTransform(shown, (s) => (1 - s) * (above ? 24 : -24))

  // The light on the card follows the mouse through CSS variables, without re-rendering
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--gx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--gy', `${e.clientY - r.top}px`)
  }

  return (
    <li
      ref={ref}
      style={{ left, width, '--k': kind.color } as CSSProperties}
      className="group/st pointer-events-none absolute inset-y-0"
    >
      {/* The stretch on the axis, with a hair of space to its neighbors */}
      <motion.span
        style={{ scaleX: fill }}
        className={`absolute inset-x-[2px] top-1/2 h-1 origin-left -translate-y-1/2 rounded-full bg-(--k) transition-[height,box-shadow] duration-300 will-change-transform group-hover/st:h-1.5 group-hover/st:shadow-[0_0_14px_var(--k)] ${
          open ? '[mask-image:linear-gradient(90deg,#000_55%,transparent)]' : ''
        }`}
      />
      <motion.span
        style={{ scale: node, opacity: node }}
        className={`absolute top-1/2 z-10 -mt-1.5 h-3 w-3 rounded-full bg-white ring-2 ring-(--k) ${open ? 'left-[calc(var(--m)/2)] -ml-1.5' : 'left-1/2 -ml-1.5'}`}
      >
        {open && live && <span className="absolute -inset-1 animate-ping rounded-full ring-2 ring-(--k)/50" />}
      </motion.span>

      <motion.span
        style={{ scaleY: stem }}
        className={`absolute w-px -translate-x-1/2 ${open ? 'left-[calc(var(--m)/2)]' : 'left-1/2'} ${
          above
            ? 'bottom-[calc(50%+0.5rem)] h-[2.75rem] origin-bottom bg-linear-to-t from-(--k)/60 to-(--k)/0'
            : 'top-[calc(50%+1.6rem)] h-[1.65rem] origin-top bg-linear-to-b from-(--k)/60 to-(--k)/0'
        }`}
      />

      <motion.div
        style={{ opacity: cardOpacity, y: cardY }}
        className={`pointer-events-auto absolute w-60 -translate-x-1/2 will-change-transform md:w-68 ${open ? 'left-[calc(var(--m)/2)]' : 'left-1/2'} ${
          above ? 'bottom-[calc(50%+3.25rem)]' : 'top-[calc(50%+3.25rem)]'
        }`}
      >
        {/* A gradient border in the step's color around a light, slightly see-through face */}
        <div
          onPointerMove={onMove}
          className="rounded-2xl bg-linear-to-br from-(--k)/45 via-white/70 to-(--k)/15 p-px shadow-[0_24px_50px_-30px_color-mix(in_srgb,var(--k)_60%,transparent)] transition-[translate,box-shadow] duration-300 group-hover/st:-translate-y-1 group-hover/st:shadow-[0_30px_60px_-26px_color-mix(in_srgb,var(--k)_75%,transparent)]"
        >
          <div className="relative overflow-hidden rounded-[calc(1rem-1px)] bg-linear-to-br from-white/95 to-white/75 p-5">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,color-mix(in_srgb,var(--k)_16%,transparent),transparent_55%)]" />
            <div
              aria-hidden
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/st:opacity-100"
              style={{ background: 'radial-gradient(160px circle at var(--gx, 50%) var(--gy, 50%), color-mix(in srgb, var(--k) 14%, transparent), transparent 70%)' }}
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-(--k) uppercase">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--k)/10 [&>svg]:h-4 [&>svg]:w-4">
                    <PathIcon kind={step.kind} />
                  </span>
                  {kind.label}
                </span>
                {open ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-(--k)/10 px-2 py-0.5 text-[11px] font-medium text-(--k)">
                    <span className={`h-1.5 w-1.5 rounded-full bg-(--k) ${live ? 'animate-pulse' : ''}`} />
                    Jetzt
                  </span>
                ) : (
                  <span className="rounded-full bg-(--k)/10 px-2 py-0.5 text-[11px] font-medium text-(--k) tabular-nums">
                    {duration(months)}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight md:text-xl">{step.place}</h3>
              <p className="mt-0.5 text-sm text-graphite">{step.detail}</p>
              <p className="mt-3 border-t border-(--k)/10 pt-3 text-xs font-medium text-mist tabular-nums">
                {dates(from, to)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </li>
  )
}
