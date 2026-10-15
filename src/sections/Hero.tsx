import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { HeroWindow } from '../components/HeroWindow'
import { Depth } from '../components/Mouse'
import { person } from '../content'

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={ref} id="top" className="relative min-h-[100svh] overflow-hidden">
      <motion.div
        style={{ scale, opacity }}
        className="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-16 px-6 pt-32 pb-24 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20 lg:pt-24"
      >
        {/* Left: name and tagline */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease }}
            className="mb-8 text-xs font-medium tracking-[0.3em] text-mist uppercase"
          >
            Persönliche Website
          </motion.p>
          <h1 className="text-[min(22vw,9rem)] leading-[0.9] font-semibold tracking-[-0.05em] whitespace-nowrap lg:text-[min(11vw,11rem)]">
            {person.name.split('').map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: '60%', rotateX: -80 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 1.1, delay: 0.1 + i * 0.08, ease }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease }}
            className="mt-10 max-w-md text-lg leading-relaxed text-graphite md:text-xl"
          >
            {person.tagline}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease }}
            className="mt-12 flex flex-wrap gap-3"
          >
            <a
              href="#projekte"
              className="rounded-full bg-ink px-6 py-3 text-sm text-paper transition-transform hover:-translate-y-0.5"
            >
              Projekte ansehen
            </a>
            <a
              href="#kontakt"
              className="glass rounded-full px-6 py-3 text-sm text-ink transition-transform hover:-translate-y-0.5"
            >
              Kontakt
            </a>
          </motion.div>
        </div>

        {/* Right: animated window cycling through activities and projects */}
        <Depth depth={0.5}>
          <HeroWindow />
        </Depth>
      </motion.div>

      {/* Scroll cue */}
      <motion.a
        href="#ueber-mich"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-xs tracking-[0.3em] text-mist uppercase lg:flex"
      >
        Scrollen
        <span className="relative h-10 w-px overflow-hidden bg-stone">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-ink"
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      </motion.a>
    </section>
  )
}
