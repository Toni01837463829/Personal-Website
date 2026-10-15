import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'

// Everything a click does something on. data-cursor marks other clickable areas
// and carries the hint shown inside the bubble (e.g. "⤢" to open up, "✕" to close).
const CLICKABLE = 'a[href], button, [role="button"], [role="tab"], label, select, summary, [data-cursor]'

/** The hint for a clickable element: its data-cursor, or ↗ for links that open a new tab. */
function hintFor(el: Element) {
  const hint = el.getAttribute('data-cursor')
  if (hint !== null) return hint
  if (el instanceof HTMLAnchorElement && el.target === '_blank') return '↗'
  return ''
}

/**
 * Custom cursor: a small dot that sits exactly on the pointer and a glassy bubble that
 * trails behind it. Over anything clickable the bubble grows, takes on the accent color
 * and shows what the click will do; it squeezes on click.
 * Only shown on devices with a real mouse.
 */
export function Cursor() {
  const [enabled] = useState(() => window.matchMedia('(pointer: fine)').matches)
  const [visible, setVisible] = useState(false)
  const [overLink, setOverLink] = useState(false)
  const [hint, setHint] = useState('')
  const [pressed, setPressed] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const bx = useSpring(x, { stiffness: 220, damping: 24, mass: 0.6 })
  const by = useSpring(y, { stiffness: 220, damping: 24, mass: 0.6 })

  useEffect(() => {
    if (!enabled) return
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
      const el = e.target instanceof Element ? e.target.closest(CLICKABLE) : null
      setOverLink(!!el)
      setHint(el ? hintFor(el) : '')
    }
    const onLeave = () => setVisible(false)
    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)
    window.addEventListener('pointermove', onMove)
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  const bubble = overLink ? 58 : 34
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <motion.div
        className={`absolute top-0 left-0 flex items-center justify-center rounded-full border backdrop-blur-[3px] transition-[background-color,border-color,box-shadow] duration-300 ${
          overLink
            ? 'border-[color-mix(in_srgb,var(--accent-a)_55%,transparent)] bg-white/70 shadow-[0_10px_30px_-10px_color-mix(in_srgb,var(--accent-a)_60%,transparent),inset_0_1px_0_rgba(255,255,255,.8)]'
            : 'border-white/70 bg-white/25 shadow-[0_8px_24px_-10px_rgba(17,21,28,.35),inset_0_1px_0_rgba(255,255,255,.6)]'
        }`}
        style={{ x: bx, y: by, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: bubble,
          height: bubble,
          opacity: visible ? 1 : 0,
          scale: pressed ? 0.8 : 1,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <AnimatePresence>
          {overLink && hint && (
            <motion.span
              key={hint}
              className="text-base leading-none text-[var(--accent-a)]"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.18 }}
            >
              {hint}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div
        className={`absolute top-0 left-0 h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
          overLink ? 'bg-[var(--accent-a)]' : 'bg-ink'
        }`}
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: visible ? 1 : 0, scale: overLink ? (hint ? 0 : 1.6) : 1 }}
        transition={{ duration: 0.2 }}
      />
    </div>
  )
}
