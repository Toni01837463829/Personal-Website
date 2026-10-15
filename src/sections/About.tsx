import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { Depth } from '../components/Mouse'
import { Reveal } from '../components/Reveal'
import { SectionTitle } from '../components/SectionTitle'
import { about } from '../content'

export function About() {
  const timeline = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: timeline, offset: ['start 80%', 'end 50%'] })
  const line = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section id="ueber-mich" className="relative mx-auto max-w-6xl px-6 py-40 md:px-10 md:py-56">
      <SectionTitle index="01" kicker="Über mich" title="Wer ich bin" />

      <div className="grid gap-20 md:grid-cols-[1.2fr_1fr] md:gap-32">
        <div className="max-w-xl space-y-8 text-lg leading-loose text-graphite md:text-xl">
          {about.text.map((p, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <p>{p}</p>
            </Reveal>
          ))}
        </div>

        <div ref={timeline} className="relative pl-10">
          <span className="absolute top-2 bottom-2 left-[7px] w-px bg-stone" />
          <motion.span
            style={{ scaleY: line }}
            className="absolute top-2 bottom-2 left-[7px] w-px origin-top bg-ink"
          />
          <p className="mb-10 text-xs font-medium tracking-[0.25em] text-mist uppercase">Mein Weg</p>
          <div className="space-y-12">
            {about.path.map((step, i) => (
              <Reveal key={step.place} delay={0.15 + i * 0.15} className="relative">
                <span className="absolute top-3 -left-10 h-[15px] w-[15px] rounded-full border border-ink/60 bg-white" />
                <Depth depth={0.8 + i * 0.6}>
                  <div className="glass rounded-2xl p-8">
                    {step.years && <p className="mb-2 text-sm text-mist">{step.years}</p>}
                    <h3 className="text-xl font-semibold tracking-tight">{step.place}</h3>
                    <p className="mt-2 text-graphite">{step.detail}</p>
                  </div>
                </Depth>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
