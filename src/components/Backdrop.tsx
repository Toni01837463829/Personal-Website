import { motion } from 'motion/react'
import { glow } from './glow'

// The lights are muted: the accents are only partly mixed in, the rest is a cool grey
const GREY = 'oklch(86.9% 0.022 252.894)'
const ACCENT_SHARE = '55%'

/**
 * The background of the whole page: three faint lights, two of them in the accent of the
 * section in view (fading to the next one through CSS variables). Gradients rather than a
 * blur filter, which this wide would be redrawn with every change around it.
 */
export function Backdrop({ accent }: { accent: readonly [string, string] }) {
  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{ '--glow-a': accent[0], '--glow-b': accent[1] }}
      transition={{ duration: 1.6, ease: 'easeInOut' }}
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundImage: [
          glow(`color-mix(in oklch, var(--glow-b) ${ACCENT_SHARE}, ${GREY})`, 0.09, 'flat'),
          glow(`color-mix(in oklch, var(--glow-a) ${ACCENT_SHARE}, ${GREY})`, 0.07, 'flat'),
          glow(GREY, 0.18, 'flat'),
        ].join(', '),
        backgroundSize: '56rem 56rem, 60rem 60rem, 54rem 54rem',
        backgroundPosition: '-20rem -20rem, right -22rem top calc(33.333% - 10rem), left calc(25% - 10rem) bottom -22rem',
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}
