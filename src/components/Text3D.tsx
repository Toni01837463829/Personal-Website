import { motion, useReducedMotion } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { useOnScreen, usePointerValue } from './Mouse'

/**
 * Text that floats in 3D with the mouse: it shifts by `depth` (higher = closer to the
 * viewer) and tilts slightly toward the cursor.
 */
export function Text3D({
  depth = 1,
  tilt = true,
  className = 'block',
  children,
}: {
  depth?: number
  tilt?: boolean
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(ref)
  const reduced = useReducedMotion()
  const k = reduced ? 0 : depth

  const tx = usePointerValue(onScreen, (x) => x * k * 14)
  const ty = usePointerValue(onScreen, (_, y) => y * k * 14)
  const rotateY = usePointerValue(onScreen, (x) => (tilt ? x * k * 6 : 0))
  const rotateX = usePointerValue(onScreen, (_, y) => (tilt ? y * k * -5 : 0))

  return (
    <motion.div ref={ref} className={className} style={{ x: tx, y: ty, rotateX, rotateY, transformPerspective: 900 }}>
      {children}
    </motion.div>
  )
}
