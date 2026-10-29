import { motion, useScroll, useTransform } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { HeroWindow } from '../components/HeroWindow'
import { Depth } from '../components/Mouse'
import { usePauseOffscreen } from '../components/offscreen'
import { Text3D } from '../components/Text3D'
import { person } from '../content'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * Fades its content out only once it starts leaving past the top of the screen.
 * Each column fades on its own, so on phones (where they stack) the window lower
 * down stays clear while it is in the middle of the screen.
 */
function FadeOnLeave({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  // How far the element has moved past the top of the screen, as a share of its height
  const { scrollYProgress: passed } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const opacity = useTransform(passed, [0.3, 0.9], [1, 0])
  return (
    <motion.div ref={ref} style={{ opacity }}>
      {children}
    </motion.div>
  )
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  usePauseOffscreen(ref)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92])

  return (
    // overflow-clip, not -hidden: hidden would make the section a scroll container of its own,
    // and the fades in FadeOnLeave (run by the browser off a view timeline) would follow that
    // section, which never scrolls, instead of the page
    <section ref={ref} id="top" className="relative min-h-[100svh] overflow-clip">
      {/* Own layer, so shrinking it while scrolling doesn't repaint the whole hero */}
      <motion.div
        style={{ scale }}
        className="mx-auto grid min-h-[100svh] max-w-6xl items-center gap-16 px-6 pt-32 pb-24 will-change-transform md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20 lg:pt-24"
      >
        {/* Left: name */}
        <FadeOnLeave>
          <Depth depth={0.3}>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease }}
              className="mb-8 text-xs font-medium tracking-[0.3em] text-mist uppercase"
            >
              Persönliche Website
            </motion.p>
          </Depth>
          <Text3D depth={1.6} className="inline-block">
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
          </Text3D>
        </FadeOnLeave>

        {/* Right: animated window cycling through activities and projects */}
        <FadeOnLeave>
          <Depth depth={0.5}>
            <HeroWindow />
          </Depth>
        </FadeOnLeave>
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
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.8s_ease-in-out_infinite] bg-ink" />
        </span>
      </motion.a>
    </section>
  )
}
