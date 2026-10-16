import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { useRef, useState, type CSSProperties } from 'react'
import { accentVars } from '../chapters'
import { ActivityWall } from '../components/ActivityWall'
import { HobbyIcon } from '../components/Icons'
import { StravaBadge } from '../components/StravaBadge'
import { Rich } from '../components/Rich'
import { Text3D } from '../components/Text3D'
import { hobbies, projects } from '../content'

const n = hobbies.length
const pad = (i: number) => String(i).padStart(2, '0')

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

  return (
    <section
      id="hobbys"
      ref={ref}
      style={{ ...accentVars('hobbys'), height: `${n * 100}svh` }}
      className="theme-dark relative overflow-clip"
    >
      {/* Snap points: one per screen, where that screen exactly fills the view */}
      {hobbies.map((h, i) => (
        <div key={h.id} aria-hidden className="absolute inset-x-0 h-px snap-start" style={{ top: `${i * 100}svh` }} />
      ))}

      <div className="sticky top-0 h-svh overflow-hidden">
        <motion.div style={{ x, width: `${n * 100}%` }} className="flex h-full">
          {hobbies.map((h, i) => (
            <HobbyScreen key={h.id} hobby={h} index={i} />
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

/** One hobby as a full screen: text on the left, an empty stage on the right for its own visual later. */
function HobbyScreen({ hobby, index }: { hobby: (typeof hobbies)[number]; index: number }) {
  const count = projects.filter((p) => p.hobby === hobby.id).length
  const [a, b] = hobby.colors

  return (
    <article
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
          <p className="mt-6 max-w-md text-lg leading-relaxed text-graphite">
            <Rich text={hobby.text} />
          </p>
          {hobby.id === 'triathlon' && <StravaBadge />}
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

        {hobby.id === 'triathlon' ? (
          <div className="hidden md:block">
            <ActivityWall />
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
}
