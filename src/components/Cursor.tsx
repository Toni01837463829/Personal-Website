import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'

/**
 * Custom cursor: a small dot that sits exactly on the pointer and a glassy bubble that
 * trails behind it. The bubble grows over links and buttons and squeezes on click.
 * Only shown on devices with a real mouse.
 */
export function Cursor() {
  const [enabled] = useState(() => window.matchMedia('(pointer: fine)').matches)
  const [visible, setVisible] = useState(false)
  const [overLink, setOverLink] = useState(false)
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
      setOverLink(e.target instanceof Element && !!e.target.closest('a, button'))
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

  const bubble = overLink ? 56 : 34
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <motion.div
        className="absolute top-0 left-0 rounded-full border border-white/70 bg-white/25 shadow-[0_8px_24px_-10px_rgba(17,21,28,.35),inset_0_1px_0_rgba(255,255,255,.6)] backdrop-blur-[3px]"
        style={{ x: bx, y: by, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: bubble,
          height: bubble,
          opacity: visible ? 1 : 0,
          scale: pressed ? 0.8 : 1,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      />
      <motion.div
        className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full bg-ink"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: visible ? 1 : 0, scale: overLink ? 0.5 : 1 }}
        transition={{ duration: 0.2 }}
      />
    </div>
  )
}
