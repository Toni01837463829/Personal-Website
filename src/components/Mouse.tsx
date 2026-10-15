import { createContext, useContext, useEffect, type ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'

type Pointer = { x: MotionValue<number>; y: MotionValue<number> }

const PointerContext = createContext<Pointer | null>(null)

/** Tracks the mouse as -1..1 on both axes, smoothed, for the whole page. */
export function PointerProvider({ children }: { children: ReactNode }) {
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 60, damping: 20, mass: 0.6 })
  const y = useSpring(rawY, { stiffness: 60, damping: 20, mass: 0.6 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth) * 2 - 1)
      rawY.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [rawX, rawY])

  return <PointerContext.Provider value={{ x, y }}>{children}</PointerContext.Provider>
}

export function usePointer() {
  const ctx = useContext(PointerContext)
  if (!ctx) throw new Error('usePointer must be used inside PointerProvider')
  return ctx
}

/**
 * Moves its children with the mouse. Higher depth = closer to the viewer = moves more.
 * Negative depth sits behind the page and moves the other way.
 */
export function Depth({
  depth,
  className,
  children,
}: {
  depth: number
  className?: string
  children: ReactNode
}) {
  const { x, y } = usePointer()
  const reduced = useReducedMotion()
  const k = reduced ? 0 : depth * 14
  const tx = useTransform(x, (v) => v * k)
  const ty = useTransform(y, (v) => v * k)
  return (
    <motion.div className={className} style={{ x: tx, y: ty }}>
      {children}
    </motion.div>
  )
}
