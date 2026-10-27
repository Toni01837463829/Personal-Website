import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { createField, type FieldMessage } from './particleField'

/**
 * A dense field of small, crisp, slowly drifting dots that fade in and out, behind the
 * whole page (see particleField.ts). Two soft glows behind the field take on the accent of
 * the section in view.
 * The dots are drawn in a worker where the browser can hand a canvas over to one, so they
 * never hold up scrolling or anything else on the page; this side only passes on the mouse,
 * clicks, the window size, and whether something solid covers the field.
 */
export function Particles({ accent }: { accent: readonly [string, string] }) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // A canvas can be handed over only once, so each run makes its own
    const canvas = document.createElement('canvas')
    canvas.className = 'absolute inset-0 h-full w-full'
    host.current!.appendChild(canvas)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let send: (msg: FieldMessage) => void
    let stop: () => void
    let worker: Worker | null = null
    if ('transferControlToOffscreen' in HTMLCanvasElement.prototype) {
      try {
        worker = new Worker(new URL('./particles.worker.ts', import.meta.url), { type: 'module' })
      } catch {
        // Browsers without module workers draw on the page instead
      }
    }
    if (worker) {
      const offscreen = canvas.transferControlToOffscreen()
      worker.postMessage({ type: 'init', canvas: offscreen, reduced }, [offscreen])
      send = (msg) => worker.postMessage(msg)
      stop = () => worker.terminate()
    } else {
      const field = createField(canvas, reduced)
      if (!field) return () => canvas.remove()
      send = field.handle
      stop = field.stop
    }

    const resize = () => send({ type: 'resize', w: window.innerWidth, h: window.innerHeight, dpr: Math.min(window.devicePixelRatio || 1, 1.5) })
    // While a solid section or an opened-up screenshot ([data-opaque]) fills the whole
    // screen the field is hidden behind it, so it pauses and leaves the frame to the rest.
    // A pixel of slack, as scroll positions and section edges rarely line up exactly
    let covered = false
    const checkCovered = () => {
      const now = [...document.querySelectorAll('[data-opaque]')].some((el) => {
        const r = el.getBoundingClientRect()
        return r.top <= 1 && r.bottom >= window.innerHeight - 1
      })
      if (now !== covered) send({ type: 'covered', covered: (covered = now) })
    }
    const onResize = () => {
      resize()
      checkCovered()
    }
    const onMove = (e: PointerEvent) => send({ type: 'move', x: e.clientX, y: e.clientY })
    const onClick = (e: PointerEvent) => send({ type: 'click', x: e.clientX, y: e.clientY })

    resize()
    checkCovered()
    // Scrolling is not the only way to get covered: a screenshot opens up without it
    const poll = window.setInterval(checkCovered, 500)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', checkCovered, { passive: true })
    window.addEventListener('pointerdown', onClick)
    window.addEventListener('pointermove', onMove)
    return () => {
      stop()
      canvas.remove()
      window.clearInterval(poll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', checkCovered)
      window.removeEventListener('pointerdown', onClick)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        animate={{ backgroundColor: accent[1] }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full opacity-20 [mask-image:radial-gradient(closest-side,#000,transparent)]"
      />
      <motion.div
        animate={{ backgroundColor: accent[0] }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
        className="absolute top-1/3 -right-48 h-[40rem] w-[40rem] rounded-full opacity-15 [mask-image:radial-gradient(closest-side,#000,transparent)]"
      />
      <div className="absolute -bottom-48 left-1/4 h-[34rem] w-[34rem] rounded-full bg-slate-300/40 [mask-image:radial-gradient(closest-side,#000,transparent)]" />
      <div ref={host} className="absolute inset-0" />
    </div>
  )
}
