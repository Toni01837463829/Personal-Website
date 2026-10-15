import { motion, useReducedMotion, useTransform } from 'motion/react'
import type { ReactNode } from 'react'
import { usePointer } from './Mouse'

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
  const { x, y } = usePointer()
  const reduced = useReducedMotion()
  const k = reduced ? 0 : depth

  const tx = useTransform(x, (v) => v * k * 14)
  const ty = useTransform(y, (v) => v * k * 14)
  const rotateY = useTransform(x, (v) => (tilt ? v * k * 6 : 0))
  const rotateX = useTransform(y, (v) => (tilt ? v * k * -5 : 0))

  return (
    <motion.div className={className} style={{ x: tx, y: ty, rotateX, rotateY, transformPerspective: 900 }}>
      {children}
    </motion.div>
  )
}
