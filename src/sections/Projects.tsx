import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { accentVars } from '../chapters'
import { GarminShowcase } from '../components/GarminShowcase'
import { Depth } from '../components/Mouse'
import { Portal } from '../components/Portal'
import { Reveal } from '../components/Reveal'
import { Rich } from '../components/Rich'
import { Text3D } from '../components/Text3D'
import { SectionTitle } from '../components/SectionTitle'
import { TiltCard } from '../components/TiltCard'
import { BrowserVisual, DashboardVisual } from '../components/Visuals'
import { hobbies, projects } from '../content'

type Project = (typeof projects)[number]

// Drawn previews sit in a tilting glass card; portals and the Garmin devices stand on their own.
const visuals = {
  browser: BrowserVisual,
  dashboard: DashboardVisual,
}

function ProjectVisual({ project }: { project: Project }) {
  if (project.visual === 'garmin') return <GarminShowcase />
  if (project.visual === 'portal') {
    return (
      <Portal
        image={import.meta.env.BASE_URL + project.image}
        href={project.link}
        label={project.title}
        caption={project.caption}
        colors={project.colors}
      />
    )
  }
  const Visual = visuals[project.visual]
  return (
    <TiltCard className="p-6 md:p-8">
      <Visual />
    </TiltCard>
  )
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [80, -80])
  const hobby = hobbies.find((h) => h.id === project.hobby)
  const flipped = index % 2 === 1

  return (
    <article
      ref={ref}
      id={`projekt-${project.hobby}`}
      className="grid scroll-mt-28 items-center gap-16 md:grid-cols-2 md:gap-28"
    >
      <div className={flipped ? 'md:order-2' : ''}>
        <Reveal>
          <p className="mb-6 flex items-center gap-4 text-sm text-mist">
            <span className="text-xs font-medium tabular-nums">0{index + 1}</span>
            <span className="h-px w-8 bg-stone" />
            {hobby?.name}
          </p>
          <Text3D depth={1.1}>
            <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">{project.title}</h3>
          </Text3D>
          <Text3D depth={0.6} tilt={false}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-graphite">
              <Rich text={project.text} />
            </p>
          </Text3D>
          <Depth depth={0.35}>
            <div className="mt-8 flex flex-wrap gap-2">
              {project.tags.map((t) => (
                <span key={t} className="glass rounded-full px-3.5 py-1 text-sm text-graphite">
                  {t}
                </span>
              ))}
            </div>
          </Depth>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-paper transition-transform hover:-translate-y-0.5"
            >
              Projekt ansehen <span aria-hidden>→</span>
            </a>
          )}
        </Reveal>
      </div>

      <motion.div style={{ y }} className={`will-change-transform ${flipped ? 'md:order-1' : ''}`}>
        <Reveal delay={0.15}>
          <ProjectVisual project={project} />
        </Reveal>
      </motion.div>
    </article>
  )
}

export function Projects() {
  return (
    <section id="projekte" style={accentVars('projekte')} className="relative mx-auto max-w-6xl scroll-mt-10 px-6 pt-16 pb-40 md:px-10 md:pt-24 md:pb-56">
      <SectionTitle index="03" kicker="Projekte" title="Was ich gebaut habe" />
      <div className="space-y-44 md:space-y-64">
        {projects.map((p, i) => (
          <ProjectRow key={p.title} project={p} index={i} />
        ))}
      </div>
    </section>
  )
}
