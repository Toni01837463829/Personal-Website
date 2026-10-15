import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  a: number // peak opacity
  tint: number // small random offset on top of the screen-wide color gradient
  pulse: number // fade speed
  phase: number
  ox: number // offset from being stirred by the mouse, eases back to 0
  oy: number
}

type Wave = { x: number; y: number; start: number }

// The field shifts from slate (left) to indigo (right); a passing ripple tints toward sky.
const SLATE = [100, 116, 139]
const INDIGO = [118, 128, 230]
const RIPPLE = [14, 165, 233]

const WAVE_SPEED = 0.22 // px per ms
const WAVE_WIDTH = 200 // px, how thick the ripple band is
const WAVE_LIFE = 6500 // ms
const WAVE_PUSH = 22 // px, max displacement

const STIR_RADIUS = 150 // px around the mouse that gets stirred
const STIR_STRENGTH = 0.05 // share of the mouse's movement passed on to nearby dots
const STIR_MAX = 18 // px, how far a dot can be pushed away from its path

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

/**
 * A dense field of small, crisp, slowly drifting dots that fade in and out, behind the
 * whole page. Moving the mouse gently stirs the dots near it along with it, and they
 * settle back once it stops; a click sends a ripple outward that pushes the dots out and
 * back as it passes and briefly shifts their color. Two soft glows behind the field take
 * on the accent of the section in view.
 */
export function Particles({ accent }: { accent: readonly [string, string] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let particles: Particle[] = []
    let waves: Wave[] = []
    let w = 0
    let h = 0
    let frame = 0
    // Mouse position and how far it moved since the last frame
    const mouse = { x: -9999, y: -9999, dx: 0, dy: 0 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(1600, (w * h) / 850))
      particles = Array.from({ length: count }, () => {
        const size = Math.random() ** 3 // mostly tiny, a few bigger
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12 - 0.03,
          r: 0.6 + size * 2.2,
          a: 0.3 + Math.random() * 0.45,
          tint: (Math.random() - 0.5) * 0.35,
          pulse: 0.0003 + Math.random() * 0.0009,
          phase: Math.random() * Math.PI * 2,
          ox: 0,
          oy: 0,
        }
      })
    }

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h)
      waves = waves.filter((wv) => now - wv.start < WAVE_LIFE)
      const stirring = Math.abs(mouse.dx) + Math.abs(mouse.dy) > 0.05

      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < -5) p.x = w + 5
          if (p.x > w + 5) p.x = -5
          if (p.y < -5) p.y = h + 5
          if (p.y > h + 5) p.y = -5

          // Stirred along by a moving mouse, then easing back onto its path
          if (stirring) {
            const sx = p.x + p.ox - mouse.x
            const sy = p.y + p.oy - mouse.y
            const d2 = sx * sx + sy * sy
            if (d2 < STIR_RADIUS * STIR_RADIUS) {
              const fall = 1 - Math.sqrt(d2) / STIR_RADIUS
              const k = fall * fall * STIR_STRENGTH * (0.6 + p.r / 3)
              p.ox = Math.max(-STIR_MAX, Math.min(STIR_MAX, p.ox + mouse.dx * k))
              p.oy = Math.max(-STIR_MAX, Math.min(STIR_MAX, p.oy + mouse.dy * k))
            }
          }
          p.ox *= 0.96
          p.oy *= 0.96
        }

        // Ripple: inside the moving band the dot swings out and back (one sine period),
        // weighted by a bell curve so the band has soft edges, fading as the wave ages.
        let dx = 0
        let dy = 0
        let hit = 0
        for (const wv of waves) {
          const age = now - wv.start
          const ex = p.x - wv.x
          const ey = p.y - wv.y
          const d = Math.hypot(ex, ey) || 1
          const band = (d - age * WAVE_SPEED) / WAVE_WIDTH
          if (band < -2 || band > 2) continue
          const env = Math.exp(-band * band * 2) * (1 - age / WAVE_LIFE) ** 1.5
          const swing = Math.sin(band * Math.PI) * env * WAVE_PUSH
          dx += (ex / d) * swing
          dy += (ey / d) * swing
          hit = Math.max(hit, env)
        }

        const breathe = reduced ? 0.8 : 0.5 + 0.5 * Math.sin(now * p.pulse + p.phase)
        const alpha = Math.min(1, p.a * (0.1 + 0.9 * breathe) + hit * 0.3)
        if (alpha < 0.02) continue

        const across = Math.min(1, Math.max(0, p.x / w + p.tint))
        const [r, g, b] = mix(mix(SLATE, INDIGO, across), RIPPLE, hit * 0.7)
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.beginPath()
        ctx.arc(p.x + p.ox + dx, p.y + p.oy + dy, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      // The movement has been used up; the next pointermove brings new
      mouse.dx = 0
      mouse.dy = 0

      if (!reduced) frame = requestAnimationFrame(draw)
    }

    const onMove = (e: PointerEvent) => {
      if (mouse.x > -9999) {
        mouse.dx += e.clientX - mouse.x
        mouse.dy += e.clientY - mouse.y
      }
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const onClick = (e: PointerEvent) => {
      if (reduced) return
      waves.push({ x: e.clientX, y: e.clientY, start: performance.now() })
      if (waves.length > 4) waves.shift()
    }

    resize()
    frame = requestAnimationFrame(draw)
    const onResize = () => {
      resize()
      if (reduced) draw(performance.now())
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('pointerdown', onClick)
    window.addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointerdown', onClick)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        animate={{ backgroundColor: accent[1] }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full opacity-20 blur-3xl"
      />
      <motion.div
        animate={{ backgroundColor: accent[0] }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
        className="absolute top-1/3 -right-48 h-[40rem] w-[40rem] rounded-full opacity-15 blur-3xl"
      />
      <div className="absolute -bottom-48 left-1/4 h-[34rem] w-[34rem] rounded-full bg-slate-300/40 blur-3xl" />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
