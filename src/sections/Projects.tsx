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
      className="grid scroll-mt-28 items-center gap-12 md:grid-cols-2 md:gap-20"
    >
      <div className={flipped ? 'md:order-2' : ''}>
        <Reveal>
          <p className="mb-4 flex items-center gap-3 text-sm text-mist">
            <span className="font-serif text-2xl text-stone">0{index + 1}</span>
            <span className="h-px w-8 bg-stone" />
            {hobby?.name}
          </p>
          <h3 className="font-serif text-4xl leading-tight md:text-5xl">{project.title}</h3>
          <p className="mt-5 text-lg text-graphite">{project.text}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <span key={t} className="rounded-full border border-stone px-3 py-1 text-sm text-graphite">
                {t}
              </span>
            ))}
          </div>
          {project.link ? (
            <a
              href={project.link}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-paper transition-transform hover:-translate-y-0.5"
            >
              Projekt ansehen <span aria-hidden>→</span>
            </a>
          ) : (
            <p className="mt-8 text-sm text-mist">Link folgt</p>
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
    <section id="projekte" className="relative mx-auto max-w-6xl px-6 py-32 md:py-44">
      <SectionTitle index="03" kicker="Projekte" title="Was ich gebaut habe" />
      <div className="space-y-36 md:space-y-48">
        {projects.map((p, i) => (
          <ProjectRow key={p.title} project={p} index={i} />
        ))}
      </div>
    </section>
  )
}
