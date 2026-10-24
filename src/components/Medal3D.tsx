import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'

const SLOW = 40 // degrees per second when left alone
const FAST = 220 // while hovered
const THICKNESS = 7
// Each layer is a masked 3D layer the browser draws every frame the badge turns; at 1px
// apart the edge still looks solid, even close to edge-on
const EDGE_LAYERS = 8

/**
 * A badge photo turned into a coin you can spin: the photo on the front, the stamped
 * relief showing through in reverse on the bronze back, and a metal edge in between, all
 * cut to the badge's outline. It turns slowly on
 * its own, faster while hovered, and can be grabbed and flicked; a flick slows back down.
 */
export function Medal3D({ src, alt, height, ratio }: { src: string; alt: string; height: number; ratio: number }) {
  const reduced = useReducedMotion()
  const angle = useMotionValue(-20)
  const speed = useRef(SLOW)
  const drag = useRef<{ x: number; t: number } | null>(null)
  const [hover, setHover] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // Only spins while on screen
  const visible = useInView(ref)

  useAnimationFrame((_, delta) => {
    if (!visible || reduced || drag.current) return
    // Ease toward the resting speed, so a flick coasts out
    const target = hover ? FAST : SLOW
    speed.current += (target - speed.current) * Math.min(1, delta / 700)
    angle.set(angle.get() + (speed.current * delta) / 1000)
  })

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, t: performance.now() }
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const now = performance.now()
    const dx = e.clientX - drag.current.x
    angle.set(angle.get() + dx * 1.2)
    speed.current = Math.max(-1600, Math.min(1600, ((dx * 1.2) / Math.max(1, now - drag.current.t)) * 1000))
    drag.current = { x: e.clientX, t: now }
  }
  const onUp = () => (drag.current = null)

  const width = Math.round(height * ratio)
  const outline: CSSProperties = {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
  }
  // Light sweeping over the metal as it turns
  const sheen = useTransform(angle, (a) => {
    const p = 50 + Math.sin((a * Math.PI) / 180) * 70
    return `linear-gradient(105deg, transparent ${p - 25}%, rgb(255 236 210 / 0.45) ${p}%, transparent ${p + 25}%)`
  })
  // Shadow narrows when the badge is edge-on
  const shadowScale = useTransform(angle, (a) => 0.25 + Math.abs(Math.cos((a * Math.PI) / 180)) * 0.75)

  return (
    <div
      ref={ref}
      role="img"
      aria-label={alt}
      data-cursor="⟲"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => {
        setHover(false)
        drag.current = null
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      className="relative cursor-grab touch-none select-none active:cursor-grabbing"
      style={{ width, height: height + 18, perspective: 700 }}
    >
      <motion.div className="absolute top-0 left-0" style={{ width, height, rotateY: angle, transformStyle: 'preserve-3d' }}>
        {/* Metal edge: the outline stacked through the thickness */}
        {Array.from({ length: EDGE_LAYERS }, (_, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              ...outline,
              background: `linear-gradient(90deg, #4a2d18, ${i % 2 ? '#8a5a35' : '#73492a'}, #4a2d18)`,
              transform: `translateZ(${-THICKNESS / 2 + (i * THICKNESS) / (EDGE_LAYERS - 1)}px)`,
            }}
          />
        ))}
        {/* Back: a stamped badge shows its relief in reverse, in bare bronze */}
        <div
          className="absolute inset-0"
          style={{
            ...outline,
            background: 'radial-gradient(circle at 35% 30%, #c08a5c, #7a4c2b 60%, #4f301a)',
            transform: `rotateY(180deg) translateZ(${THICKNESS / 2 + 0.5}px)`,
            backfaceVisibility: 'hidden',
          }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            className="h-full w-full -scale-x-100 opacity-70 mix-blend-luminosity"
            style={{ filter: 'grayscale(1) contrast(1.15) brightness(0.8)' }}
          />
        </div>
        {/* Front: the badge itself */}
        <div className="absolute inset-0" style={{ transform: `translateZ(${THICKNESS / 2 + 0.5}px)`, backfaceVisibility: 'hidden' }}>
          <img src={src} alt="" draggable={false} className="h-full w-full" />
          <motion.div className="absolute inset-0 mix-blend-screen" style={{ ...outline, background: sheen }} />
        </div>
      </motion.div>
      {/* On a layer of its own, so narrowing it every frame doesn't repaint and re-blur it */}
      <motion.div
        aria-hidden
        className="absolute bottom-0 left-1/2 h-3 -translate-x-1/2 rounded-[50%] bg-black/60 blur-md will-change-transform"
        style={{ width: width * 0.9, scaleX: shadowScale }}
      />
    </div>
  )
}
