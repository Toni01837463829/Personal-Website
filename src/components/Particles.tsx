import { useEffect, useRef } from 'react'

type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number }

/**
 * Slowly drifting dots behind the whole page, plus a few soft color washes so the
 * glass surfaces have something to blur. Purely ambient: ignores the mouse.
 */
export function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let particles: Particle[] = []
    let w = 0
    let h = 0
    let frame = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(90, (w * h) / 16000))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18 - 0.05,
        r: 0.8 + Math.random() * 2.2,
        a: 0.15 + Math.random() * 0.35,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(71, 85, 105, ${p.a})`
        ctx.fill()
      }
      if (!reduced) frame = requestAnimationFrame(draw)
    }

    resize()
    draw()
    const onResize = () => {
      resize()
      if (reduced) draw()
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-sky-200/50 blur-3xl" />
      <div className="absolute top-1/3 -right-48 h-[40rem] w-[40rem] rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute -bottom-48 left-1/4 h-[34rem] w-[34rem] rounded-full bg-slate-300/40 blur-3xl" />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
