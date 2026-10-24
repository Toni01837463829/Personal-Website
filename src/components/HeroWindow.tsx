import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { hobbies, person, projects } from '../content'
import { Portal } from './Portal'
import { HobbyIcon } from './Icons'
import { GarminHeroVisual } from './GarminShowcase'
import { CodingVisual } from './TechWall'
import { BrowserVisual, DashboardVisual } from './Visuals'

const visuals = {
  browser: BrowserVisual,
  dashboard: DashboardVisual,
  garmin: GarminHeroVisual,
}

// One tab per activity; each shows its project, or the logo wall for "Programmieren".
const slides = hobbies.map((h) => {
  const project = projects.find((p) => p.hobby === h.id)
  return { hobby: h, title: project?.title ?? 'Sprachen, Frameworks & Datenbanken', project }
})

function SlideVisual({ project, onOpenChange }: { project?: Project; onOpenChange: (open: boolean) => void }) {
  if (!project) return <CodingVisual github={person.github} />
  if (project.visual === 'portal') {
    // Same height as the other slides, so the window does not jump
    return (
      <div className="flex aspect-[4/3] w-full items-center">
        <div className="w-full">
          <Portal
            image={import.meta.env.BASE_URL + project.image}
            href={project.link}
            label={project.title}
            caption={project.caption}
            colors={project.colors}
            onOpenChange={onOpenChange}
          />
        </div>
      </div>
    )
  }
  const Visual = visuals[project.visual]
  return <Visual />
}

type Project = (typeof projects)[number]

const SLIDE_MS = 4500
const ease = [0.22, 1, 0.36, 1] as const

/**
 * A pane of frosted glass that pops open and cycles through activities and projects.
 * Tabs sit in a glass pill on top, each slide tints the light behind the pane in its
 * hobby's colors. Under the mouse the pane leans toward the cursor by a few degrees and a
 * soft glare follows it, like light catching the glass.
 */
export function HeroWindow() {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  // Hold the current slide while the mouse is on the window or a screenshot is opened up,
  // and while the window is scrolled out of view, so no slides are swapped in for nobody
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref)
  const [hovered, setHovered] = useState(false)
  const [popout, setPopout] = useState(false)
  const paused = hovered || popout || !visible

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => clearTimeout(t)
  }, [index, paused])

  const slide = slides[index]
  const [a, b] = slide.hobby.colors

  // Mouse inside the pane: -0.5..0.5 for the tilt, px for the glare
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const gx = useMotionValue(0)
  const gy = useMotionValue(0)
  const rotateY = useSpring(useTransform(mx, (v) => (reduced ? 0 : v * 5)), { stiffness: 120, damping: 20 })
  const rotateX = useSpring(useTransform(my, (v) => (reduced ? 0 : v * -4)), { stiffness: 120, damping: 20 })

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
    gx.set(e.clientX - r.left)
    gy.set(e.clientY - r.top)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.4, y: 160, filter: 'blur(12px)' }}
      // A filter left on here would stop the glass from blurring what is behind the pane
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      transition={{ duration: 1.1, delay: 0.5, ease }}
      style={{ transformOrigin: '50% 100%' }}
      className="relative w-full"
    >
      {/* Light behind the glass in the colors of the slide, softened by a mask rather than a
          blur, which would have to be redrawn whenever the window moves with the mouse */}
      <motion.div
        aria-hidden
        className="absolute -inset-[12%] rounded-full opacity-25 [mask-image:radial-gradient(closest-side,#000_35%,transparent)]"
        animate={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
        transition={{ duration: 1 }}
      />

      <motion.div
        onPointerEnter={() => setHovered(true)}
        onPointerMove={onMove}
        onPointerLeave={() => {
          setHovered(false)
          mx.set(0)
          my.set(0)
        }}
        style={{ rotateX, rotateY, transformPerspective: 1400 }}
        // The border: a hairline gradient from bright to faint, like light on a glass edge
        className="group relative rounded-[1.75rem] bg-linear-to-br from-white via-white/50 to-white/25 p-px shadow-[0_40px_80px_-40px_rgba(17,21,28,.4)]"
      >
        <div className="relative overflow-hidden rounded-[calc(1.75rem-1px)] bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] backdrop-blur-xl backdrop-saturate-150">
          {/* The glare is drawn once and slides along with the mouse */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-[420px] -left-[420px] z-10 size-[840px] opacity-0 transition-opacity duration-500 will-change-transform group-hover:opacity-100"
            style={{ x: gx, y: gy, background: 'radial-gradient(closest-side, rgb(255 255 255 / 0.32), transparent 60%)' }}
          />

          {/* Tabs in a glass pill, with the address underneath */}
          <div className="px-4 pt-4">
            <div role="tablist" className="flex gap-1 rounded-full bg-white/40 p-1 shadow-[inset_0_1px_2px_rgba(17,21,28,.06)] ring-1 ring-white/70">
              {slides.map((s, i) => {
                const active = i === index
                return (
                  <button
                    key={s.hobby.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setIndex(i)}
                    title={s.hobby.name}
                    style={{ color: active ? s.hobby.colors[0] : undefined }}
                    className={`relative flex min-w-0 items-center justify-center gap-2 overflow-hidden rounded-full px-3 py-1.5 text-xs transition-[color,background-color,box-shadow,flex-grow] duration-500 ${
                      active
                        ? 'flex-[2] bg-white/90 shadow-[0_6px_16px_-8px_rgba(17,21,28,.35)]'
                        : 'flex-1 text-mist hover:bg-white/50 hover:text-graphite'
                    }`}
                  >
                    <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">
                      <HobbyIcon id={s.hobby.id} />
                    </span>
                    <span className={`truncate ${active ? 'text-ink' : 'hidden xl:inline'}`}>{s.hobby.name}</span>
                    {active && (
                      <motion.span
                        key={`${index}-${paused}`}
                        className="absolute inset-x-4 bottom-0.5 h-0.5 origin-left rounded-full bg-current opacity-50"
                        initial={{ scaleX: paused ? 1 : 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: paused ? 0 : SLIDE_MS / 1000, ease: 'linear' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-mist">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                <rect x="1.5" y="4.5" width="7" height="4.5" rx="1" />
                <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" />
              </svg>
              toni.dev/{slide.hobby.id}
            </div>
          </div>

          {/* Page content: slides cross-fade on top of each other */}
          <div className="grid">
            <AnimatePresence initial={false}>
              <motion.div
                key={index}
                className="[grid-area:1/1] px-10 pt-4 pb-10"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2, ease } }}
                exit={{ opacity: 0, y: -12, transition: { duration: 0.25, ease } }}
              >
                <p className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-mist uppercase">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
                  {slide.hobby.name}
                </p>
                <p className="mt-1.5 mb-6 truncate text-lg font-semibold tracking-tight">{slide.title}</p>
                <SlideVisual project={slide.project} onOpenChange={setPopout} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
