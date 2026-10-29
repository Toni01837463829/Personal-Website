import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from 'react'
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

/** Whether the element is on screen, kept up to date without re-rendering. */
export function useOnScreen(ref: RefObject<Element | null>) {
  const onScreen = useMotionValue(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => onScreen.set(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [ref, onScreen])
  return onScreen
}

/**
 * A value that follows the mouse (mouse -1..1 on both axes → value), but only while
 * `onScreen`: off screen it holds its last value, as moving it would cost a frame that
 * nobody sees.
 */
export function usePointerValue(onScreen: MotionValue<boolean>, map: (x: number, y: number) => number) {
  const { x, y } = usePointer()
  const last = useRef(0)
  return useTransform(() => {
    const px = x.get()
    const py = y.get()
    if (onScreen.get()) last.current = map(px, py)
    return last.current
  })
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
  const ref = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(ref)
  const reduced = useReducedMotion()
  const k = reduced ? 0 : depth * 14
  const tx = usePointerValue(onScreen, (x) => x * k)
  const ty = usePointerValue(onScreen, (_, y) => y * k)
  // Own layer: following the mouse moves it as it is, instead of repainting what is inside
  return (
    <motion.div ref={ref} className={`will-change-transform ${className ?? ''}`} style={{ x: tx, y: ty }}>
      {children}
    </motion.div>
  )
}
