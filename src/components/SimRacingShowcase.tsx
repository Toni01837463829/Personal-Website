import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { hobbies, projects, simracing } from '../content'
import { useFrameLoop } from '../useFrameLoop'
import { glow } from './glow'
import { Portal, type PortalColors } from './Portal'
import { Screen } from './sim/Screen'
import { SetupScreen } from './sim/SetupScreen'
import { TelemetryScreen } from './sim/TelemetryScreen'

// The drawn screens take the sim-racing colors, also when opened up outside the section
const [simA, simB] = hobbies.find((h) => h.id === 'simracing')!.colors
const simColors: PortalColors = [simA, simB, simA]

const SLIDE_MS = 5000
const TURN_S = 40 // seconds for one full orbit

/**
 * The games circle slowly around a box in the middle that swipes through telemetry, car
 * setup and my dashboard. The orbit is a tilted ring: games at the front are bigger and
 * brighter than the ones at the back. Hovering a game pauses it.
 */
export function SimRacingShowcase() {
  const reduced = useReducedMotion()
  const angle = useMotionValue(0)
  const paused = useRef(false)
  const ref = useRef<HTMLDivElement>(null)
  // Off screen (another hobby in view) the orbit stands still and costs nothing
  const visible = useInView(ref)

  useFrameLoop(visible && !reduced, (_, delta) => {
    if (!paused.current) angle.set(angle.get() + (delta / 1000) * ((2 * Math.PI) / TURN_S))
  })

  return (
    <div ref={ref} className="relative mx-auto aspect-[100/96] w-full max-w-[38rem]">
      <div aria-hidden className="absolute -inset-[32%]" style={{ background: glow('var(--accent-a)', 0.2) }} />
      {/* The ring the games travel on */}
      <div aria-hidden className="absolute inset-x-[4%] inset-y-[6%] rounded-[50%] border border-white/[0.06]" />

      {simracing.games.map((g, i) => (
        <OrbitCover key={g.name} game={g} angle={angle} offset={(i * Math.PI) / 2} onHover={(h) => (paused.current = h)} />
      ))}

      <div className="absolute top-1/2 left-1/2 z-10 w-[58%] -translate-x-1/2 -translate-y-1/2">
        <Slides />
      </div>
    </div>
  )
}

function OrbitCover({
  game,
  angle,
  offset,
  onHover,
}: {
  game: (typeof simracing.games)[number]
  angle: MotionValue<number>
  offset: number
  onHover: (hovered: boolean) => void
}) {
  // Positions on an ellipse; sin > 0 is the front of the ring (bottom of the screen).
  // A layer the size of the whole showcase is shifted by a share of its own size, so the
  // orbit only moves a transform and never touches layout.
  const x = useTransform(angle, (a) => `${46 * Math.cos(a + offset)}%`)
  const y = useTransform(angle, (a) => `${44 * Math.sin(a + offset)}%`)
  const front = useTransform(angle, (a) => (Math.sin(a + offset) + 1) / 2)
  const scale = useTransform(front, (f) => 0.82 + f * 0.18)
  const opacity = useTransform(front, (f) => 0.55 + f * 0.45)
  const zIndex = useTransform(front, (f) => (f > 0.5 ? 20 : 0))

  return (
    <motion.div style={{ x, y, zIndex }} className="pointer-events-none absolute inset-0">
      <motion.div
        style={{ scale, opacity }}
        whileHover={{ scale: 1.1, opacity: 1 }}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        // Its own layer: circling then only moves it, instead of repainting it every frame
        className="group pointer-events-auto absolute top-1/2 left-1/2 w-[28%] -translate-x-1/2 -translate-y-1/2 will-change-[transform,opacity]"
      >
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1016] shadow-[0_24px_40px_-20px_rgba(0,0,0,.9)] transition-[border-color,box-shadow] duration-300 group-hover:border-(--accent-a)/60 group-hover:shadow-[0_20px_50px_-15px_color-mix(in_srgb,var(--accent-a)_50%,transparent)]">
          <img
            src={import.meta.env.BASE_URL + game.image}
            alt={game.name}
            width={460}
            height={215}
            loading="lazy"
            draggable={false}
            className="aspect-[460/215] w-full object-cover select-none"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

/** The box in the middle: swipes through the slides on its own, the tabs above pick one. */
function Slides() {
  const [index, setIndex] = useState(0)
  const [hover, setHover] = useState(false)
  const [opened, setOpened] = useState(false) // a slide is opened up in front of the page
  const [run, setRun] = useState(0) // restarts the timer bar when a tab is picked
  const ref = useRef<HTMLDivElement>(null)
  // Also holds still while another hobby is on screen
  const inView = useInView(ref)
  const hold = hover || !inView
  const slide = simracing.slides[index]

  useEffect(() => {
    if (hold || opened) return
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % simracing.slides.length), SLIDE_MS)
    return () => window.clearTimeout(t)
  }, [index, hold, opened, run])

  const pick = (i: number) => {
    setIndex(i)
    setRun((r) => r + 1)
  }

  return (
    <div ref={ref} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <div role="tablist" aria-label="Sim-Racing" className="mb-3 flex justify-center gap-1.5">
        {simracing.slides.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === index}
            onClick={() => pick(i)}
            className={`relative overflow-hidden rounded-full border bg-[#0c1016]/80 px-3 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
              i === index ? 'border-(--accent-a)/50 text-ink' : 'border-white/10 text-mist hover:text-ink'
            }`}
          >
            {i === index && !hold && !opened && (
              <motion.span
                key={`${index}-${run}`}
                aria-hidden
                className="absolute inset-0 origin-left bg-(--accent-a)/15"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }}
              />
            )}
            <span className="relative">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="relative">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 60, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            // Swiping moves the drawn screen as it is, instead of repainting it every frame
            className="will-change-transform"
          >
            <Portal
              dark
              image={slide.image && import.meta.env.BASE_URL + slide.image}
              label={slide.label}
              caption={slide.caption}
              onOpenChange={setOpened}
              colors={(projects.find((p) => slide.image && p.image === slide.image)?.colors as PortalColors | undefined) ?? simColors}
            >
              {!slide.image && <Screen>{slide.id === 'telemetry' ? <TelemetryScreen /> : <SetupScreen />}</Screen>}
            </Portal>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
