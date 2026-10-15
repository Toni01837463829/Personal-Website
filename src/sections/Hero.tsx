import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { Depth } from '../components/Mouse'
import { person } from '../content'

// Little "windows" floating around the name, each at its own depth
const chips = [
  { label: 'HTL Krems', className: 'left-[6%] top-[22%]', depth: 2.2 },
  { label: 'FH OÖ · AI Solutions', className: 'right-[7%] top-[18%]', depth: 3 },
  { label: 'Triathlon', className: 'left-[12%] bottom-[22%]', depth: 1.4 },
  { label: 'Sim-Racing', className: 'right-[14%] bottom-[26%]', depth: 2.6 },
  { label: 'Freiwillige Feuerwehr', className: 'left-[38%] bottom-[12%]', depth: 0.9 },
]

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.86])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])

  return (
    <section ref={ref} id="top" className="relative h-[100svh] overflow-hidden">
      {/* Far layer: huge faint word */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 flex items-center justify-center">
        <Depth depth={-1.5}>
          <span className="font-serif text-[34vw] leading-none text-sand select-none">Servus</span>
        </Depth>
      </motion.div>

      <motion.div style={{ scale, opacity }} className="relative h-full">
        {/* Floating chips */}
        {chips.map((c, i) => (
          <motion.div
            key={c.label}
            className={`absolute hidden md:block ${c.className}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 + i * 0.12, ease }}
          >
            <Depth depth={c.depth}>
              <span className="block rounded-2xl border border-stone/80 bg-white/70 px-5 py-3 text-sm text-graphite shadow-[0_20px_40px_-20px_rgba(28,26,23,.35)] backdrop-blur">
                {c.label}
              </span>
            </Depth>
          </motion.div>
        ))}

        {/* Near layer: name and tagline */}
        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
          <Depth depth={0.6}>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease }}
              className="mb-4 text-sm tracking-[0.3em] text-mist uppercase"
            >
              Persönliche Website
            </motion.p>
          </Depth>
          <Depth depth={1}>
            <h1 className="font-serif text-[22vw] leading-[0.85] md:text-[14rem]">
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
          </Depth>
          <Depth depth={0.4}>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease }}
              className="mt-6 max-w-xl text-lg text-graphite md:text-xl"
            >
              {person.tagline}
            </motion.p>
          </Depth>
        </div>

        {/* Scroll cue */}
        <motion.a
          href="#ueber-mich"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-xs tracking-[0.3em] text-mist uppercase"
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
      </motion.div>
    </section>
  )
}
