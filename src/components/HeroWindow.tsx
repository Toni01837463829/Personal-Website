import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
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

/** A light macOS-style browser window that pops open and cycles through activities and projects. */
export function HeroWindow() {
  const [index, setIndex] = useState(0)
  // Hold the current slide while the mouse is on the window or a screenshot is opened up
  const [hovered, setHovered] = useState(false)
  const [popout, setPopout] = useState(false)
  const paused = hovered || popout

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => clearTimeout(t)
  }, [index, paused])

  const slide = slides[index]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: 160, filter: 'blur(12px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1.1, delay: 0.5, ease }}
      style={{ transformOrigin: '50% 100%' }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="glass w-full overflow-hidden rounded-2xl bg-white/70!"
    >
      {/* Title bar with traffic lights and tabs */}
      <div className="flex items-center gap-4 border-b border-stone/60 bg-white/60 px-4 pt-3">
        <div className="flex shrink-0 gap-2 pb-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div role="tablist" className="flex min-w-0 flex-1 gap-1">
          {slides.map((s, i) => {
            const active = i === index
            return (
              <button
                key={s.hobby.id}
                role="tab"
                aria-selected={active}
                onClick={() => setIndex(i)}
                title={s.hobby.name}
                className={`relative flex min-w-0 items-center gap-2 rounded-t-lg px-3 pt-1.5 pb-2.5 text-xs transition-[color,background-color,flex-grow] duration-500 ${
                  active ? 'flex-[2] bg-white text-ink' : 'flex-1 text-mist hover:text-graphite'
                }`}
              >
                <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">
                  <HobbyIcon id={s.hobby.id} />
                </span>
                <span className={`truncate ${active ? '' : 'hidden xl:inline'}`}>{s.hobby.name}</span>
                {active && (
                  <motion.span
                    key={`${index}-${paused}`}
                    className="absolute inset-x-2 bottom-0 h-0.5 origin-left rounded-full bg-ink/70"
                    initial={{ scaleX: paused ? 1 : 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: paused ? 0 : SLIDE_MS / 1000, ease: 'linear' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Address bar */}
      <div className="flex items-center gap-3 bg-white px-4 py-2.5">
        <span className="text-sm text-stone">‹ ›</span>
        <div className="flex flex-1 items-center justify-center rounded-md bg-sand/70 py-1 text-xs text-graphite">
          toni.dev/{slide.hobby.id}
        </div>
      </div>

      {/* Page content: slides cross-fade on top of each other */}
      <div className="grid bg-white">
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            className="[grid-area:1/1] px-10 pt-6 pb-10"
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, delay: 0.2, ease } }}
            exit={{ opacity: 0, y: -12, filter: 'blur(6px)', transition: { duration: 0.25, ease } }}
          >
            <p className="text-xs font-medium tracking-[0.2em] text-mist uppercase">{slide.hobby.name}</p>
            <p className="mt-1.5 mb-6 truncate text-lg font-semibold tracking-tight">{slide.title}</p>
            <SlideVisual project={slide.project} onOpenChange={setPopout} />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
