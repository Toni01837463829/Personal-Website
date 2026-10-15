import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import type { ReactNode, PointerEvent } from 'react'

/** A card that tilts toward the mouse like a window pane, with its content floating above it. */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 150, damping: 18 })
  const sy = useSpring(py, { stiffness: 150, damping: 18 })
  const rotateX = useTransform(sy, (v) => (reduced ? 0 : v * -8))
  const rotateY = useTransform(sx, (v) => (reduced ? 0 : v * 10))
  const glareX = useTransform(sx, (v) => `${50 + v * 40}%`)
  const glareY = useTransform(sy, (v) => `${50 + v * 40}%`)
  const glare = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,.55), transparent 55%)`,
  )

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    px.set(((e.clientX - r.left) / r.width) * 2 - 1)
    py.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }
  const onLeave = () => {
    px.set(0)
    py.set(0)
  }

  return (
    <div style={{ perspective: 1000 }} className="h-full">
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className={`relative h-full rounded-3xl border border-stone/70 bg-white/60 shadow-[0_30px_60px_-30px_rgba(28,26,23,.25)] backdrop-blur-sm ${className ?? ''}`}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{ background: glare }}
        />
        <div style={{ transform: 'translateZ(40px)' }} className="relative h-full">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
