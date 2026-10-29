import { motion, useInView, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { lazy, memo, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react'
import { accentVars } from '../chapters'
import { ActivityWall } from '../components/ActivityWall'
import { FeuerwehrShowcase } from '../components/FeuerwehrShowcase'
import { HobbyIcon } from '../components/Icons'
import { usePauseOffscreen } from '../components/offscreen'
import { StravaBadge } from '../components/StravaBadge'
import { TechWall } from '../components/TechWall'
import { Rich } from '../components/Rich'
import { Text3D } from '../components/Text3D'
import { hobbies, projects } from '../content'

const n = hobbies.length
const pad = (i: number) => String(i).padStart(2, '0')

// The sim-racing screen brings a whole simulated lap with it: loaded only when it's needed
const SimRacingShowcase = lazy(() => import('../components/SimRacingShowcase').then((m) => ({ default: m.SimRacingShowcase })))

/**
 * Dark, pinned section: every hobby gets a whole screen in its own color, and scrolling
 * down slides them by from right to left. Each screen takes one viewport height of
 * scrolling, and the page gently snaps so a screen ends up filling the view.
 */
export function Hobbies() {
  const ref = useRef<HTMLElement>(null)
  const [current, setCurrent] = useState(0)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 32, mass: 0.4 })
  // The track is n screens wide; move it by a percentage of its own width
  const x = useTransform(progress, (p) => `${(-p * (n - 1) * 100) / n}%`)
  useMotionValueEvent(scrollYProgress, 'change', (p) => setCurrent(Math.round(p * (n - 1))))

  const [a, b] = hobbies[current].colors

  // The visuals on the right are most of the page's weight, and far below the fold: they
  // come in one by one in quiet moments after loading, or all at once when the section nears
  const near = useInView(ref, { margin: '100% 0px', once: true })
  const [ready, setReady] = useState(0)
  useEffect(() => {
    if (ready >= n) return
    const idle = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 300))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const id = idle(() => setReady((v) => v + 1), { timeout: 4000 })
    return () => cancel(id)
  }, [ready])
  const visuals = near ? n : ready

  return (
    <section
      id="hobbys"
      ref={ref}
      data-opaque
      style={{ ...accentVars('hobbys'), height: `${n * 100}svh` }}
      className="theme-dark relative overflow-clip"
    >
      {/* Snap points: one per screen, where that screen exactly fills the view */}
      {hobbies.map((h, i) => (
        <div key={h.id} aria-hidden className="absolute inset-x-0 h-px snap-start" style={{ top: `${i * 100}svh` }} />
      ))}

      <div className="sticky top-0 h-svh overflow-hidden">
        <motion.div style={{ x, width: `${n * 100}%` }} className="flex h-full will-change-transform">
          {hobbies.map((h, i) => (
            <HobbyScreen key={h.id} hobby={h} index={i} visual={i < visuals} />
          ))}
        </motion.div>

        {/* Section label and progress, fixed on top of the sliding screens */}
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto max-w-6xl px-6 pt-8 md:px-10">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.3em] text-graphite uppercase">
            <motion.span
              animate={{ backgroundColor: a }}
              transition={{ duration: 0.6 }}
              className="h-px w-8"
            />
            Hobbys
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-6xl items-center gap-5 px-6 pb-8 md:px-10">
          <span className="text-sm font-medium tabular-nums">
            {pad(current + 1)}
            <span className="text-mist"> / {pad(n)}</span>
          </span>
          <div className="relative h-px flex-1 bg-stone">
            <motion.div
              style={{ scaleX: progress }}
              animate={{ backgroundImage: `linear-gradient(90deg, ${a}, ${b})` }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 origin-left"
            />
          </div>
          <span className="text-xs tracking-[0.3em] text-mist uppercase">{hobbies[current].name}</span>
        </div>
      </div>
    </section>
  )
}

/**
 * One hobby as a full screen: text on the left, its own visual on the right. Memoized, so
 * the counter changing while scrolling doesn't re-render every screen.
 */
const HobbyScreen = memo(function HobbyScreen({ hobby, index, visual }: { hobby: (typeof hobbies)[number]; index: number; visual: boolean }) {
  const count = projects.filter((p) => p.hobby === hobby.id).length
  const [a, b] = hobby.colors
  const ref = useRef<HTMLElement>(null)
  usePauseOffscreen(ref)

  return (
    <article
      ref={ref}
      style={{ '--accent-a': a, '--accent-b': b } as CSSProperties}
      className="relative h-full flex-1 overflow-hidden"
    >
      {/* The hobby's color washing in from the corners */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 70% at 15% 10%, color-mix(in srgb, ${a} 28%, transparent), transparent 70%),
            radial-gradient(50% 60% at 95% 100%, color-mix(in srgb, ${b} 22%, transparent), transparent 70%)`,
        }}
      />
      <span
        aria-hidden
        className="text-outline absolute -right-[0.06em] -bottom-[0.2em] text-[clamp(14rem,38vw,34rem)] leading-none font-bold tracking-tighter select-none"
      >
        {pad(index + 1)}
      </span>

      <div className="relative mx-auto grid h-full max-w-6xl items-center gap-12 px-6 pt-28 pb-24 md:grid-cols-[1fr_1.1fr] md:px-10">
        <div>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-(--accent-a)/15 text-(--accent-a)">
              <HobbyIcon id={hobby.id} />
            </span>
            <span className="text-xs font-medium tracking-[0.3em] text-mist uppercase tabular-nums">
              {pad(index + 1)} / {pad(n)}
            </span>
          </div>
          <Text3D depth={0.6} tilt={false} className="mt-10 block">
            <h3 className="bg-linear-to-r from-(--accent-a) to-(--accent-b) bg-clip-text pb-1 text-5xl leading-[1.05] font-semibold tracking-tight text-transparent md:text-7xl">
              {hobby.name}
            </h3>
          </Text3D>
          {hobby.text && (
            <p className="mt-6 max-w-md text-lg leading-relaxed text-graphite">
              <Rich text={hobby.text} />
            </p>
          )}
          {hobby.id === 'triathlon' && <StravaBadge />}
          {hobby.id === 'coding' && <ScrollHint />}
          {count > 0 && (
            <a
              href={`#projekt-${hobby.id}`}
              className="group mt-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-[#05070a] py-2.5 pr-3 pl-5 text-sm font-medium text-ink shadow-[0_12px_30px_-12px_rgba(0,0,0,.9)] transition-colors hover:border-(--accent-a)/60"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 4L1.5 8 5 12M11 4l3.5 4-3.5 4M9.5 2.5l-3 11" />
              </svg>
              {count === 1 ? 'Projekt' : 'Projekte'} ansehen
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-(--accent-a) group-hover:text-white">
                →
              </span>
            </a>
          )}
        </div>

        {!visual ? null : hobby.id === 'triathlon' ? (
          <div className="hidden md:block">
            <ActivityWall />
          </div>
        ) : hobby.id === 'simracing' ? (
          <div className="hidden md:block">
            <Suspense fallback={null}>
              <SimRacingShowcase />
            </Suspense>
          </div>
        ) : hobby.id === 'coding' ? (
          // The logo wall from the hero, with dark cards and soft edges
          <div className="relative hidden aspect-[4/3] md:block">
            <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_50%,#000_55%,transparent_100%)]">
              <TechWall dark />
            </div>
          </div>
        ) : hobby.id === 'feuerwehr' ? (
          <div className="hidden md:block">
            <FeuerwehrShowcase />
          </div>
        ) : (
          // Placeholder stage for the hobby's own visual
          <div className="glass relative hidden aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl md:flex">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--accent-a)_30%,transparent),transparent_65%)]" />
            <div className="relative scale-[3] text-(--accent-a) opacity-70">
              <HobbyIcon id={hobby.id} />
            </div>
          </div>
        )}
      </div>
    </article>
  )
})

/** The last hobby hands over to the projects: an invitation to keep scrolling, with a bobbing arrow. */
function ScrollHint() {
  return (
    <a
      href="#projekte"
      className="group mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-[#05070a] py-2.5 pr-2.5 pl-5 text-sm font-medium text-ink shadow-[0_12px_30px_-12px_rgba(0,0,0,.9)] transition-colors hover:border-(--accent-a)/60"
    >
      Scrollen, um meine Projekte zu sehen
      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/10 transition-colors group-hover:bg-(--accent-a) group-hover:text-white">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="motion-safe:animate-[bob_1.6s_ease-in-out_infinite]"
        >
          <path d="M7 1.5v10M2.5 7.5 7 12l4.5-4.5" />
        </svg>
      </span>
    </a>
  )
}
