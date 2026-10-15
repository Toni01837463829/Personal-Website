import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { Reveal } from '../components/Reveal'
import { SectionTitle } from '../components/SectionTitle'
import { TiltCard } from '../components/TiltCard'
import { BrowserVisual, DashboardVisual, GarminVisual } from '../components/Visuals'
import { hobbies, projects } from '../content'

const visuals = {
  browser: BrowserVisual,
  dashboard: DashboardVisual,
  garmin: GarminVisual,
}

function ProjectRow({ project, index }: { project: (typeof projects)[number]; index: number }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [80, -80])
  const Visual = visuals[project.visual]
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
          <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">{project.title}</h3>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-graphite">{project.text}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <span key={t} className="glass rounded-full px-3.5 py-1 text-sm text-graphite">
                {t}
              </span>
            ))}
          </div>
          {project.link ? (
            <a
              href={project.link}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-paper transition-transform hover:-translate-y-0.5"
            >
              Projekt ansehen <span aria-hidden>→</span>
            </a>
          ) : (
            <p className="mt-10 text-sm text-mist">Link folgt</p>
          )}
        </Reveal>
      </div>

      <motion.div style={{ y }} className={flipped ? 'md:order-1' : ''}>
        <Reveal delay={0.15}>
          <TiltCard className="p-6 md:p-8">
            <Visual />
          </TiltCard>
        </Reveal>
      </motion.div>
    </article>
  )
}

export function Projects() {
  return (
    <section id="projekte" className="relative mx-auto max-w-6xl px-6 py-40 md:px-10 md:py-56">
      <SectionTitle index="03" kicker="Projekte" title="Was ich gebaut habe" />
      <div className="space-y-44 md:space-y-64">
        {projects.map((p, i) => (
          <ProjectRow key={p.title} project={p} index={i} />
        ))}
      </div>
    </section>
  )
}
