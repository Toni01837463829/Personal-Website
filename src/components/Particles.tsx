import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { glow } from './glow'
import { createField, type Field } from './particleField'
import type { FieldMessage } from './particles.worker'

// While the page scrolls the field holds still, leaving the frame to the scrolling
const SCROLL_HOLD_MS = 150

/**
 * A dense field of small, crisp, slowly drifting dots that fade in and out, behind the
 * whole page. Moving the mouse gently stirs the dots near it along with it, and they
 * settle back once it stops; a click sends a ripple outward that pushes the dots out and
 * back as it passes and briefly shifts their color. Two soft glows behind the field take
 * on the accent of the section in view.
 *
 * The field itself (particleField.ts) runs in a worker where the browser can hand a canvas
 * over to one, so it neither waits for nor slows down the rest of the page.
 */
export function Particles({ accent }: { accent: readonly [string, string] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = ref.current
    if (!box) return
    // A fresh canvas per mount: one that was handed to a worker can't be handed over again
    const canvas = document.createElement('canvas')
    canvas.className = 'absolute inset-0 h-full w-full'
    box.append(canvas)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const size = (): [number, number, number] => [window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio || 1, 2)]

    let worker: Worker | null = null
    let local: Field | null = null
    let send: (message: Exclude<FieldMessage, { type: 'init' }>) => void
    if (typeof canvas.transferControlToOffscreen === 'function') {
      worker = new Worker(new URL('./particles.worker.ts', import.meta.url), { type: 'module' })
      const offscreen = canvas.transferControlToOffscreen()
      worker.postMessage({ type: 'init', canvas: offscreen, reduced, size: size() } satisfies FieldMessage, [offscreen])
      send = (message) => worker!.postMessage(message)
    } else {
      const field = createField(canvas, reduced)
      field.resize(...size())
      local = field
      send = (m) => (m.type === 'resize' ? field.resize(...m.size) : m.type === 'hold' ? field.hold(m.held) : field[m.type](m.x, m.y))
    }

    // Held while a solid section ([data-opaque]) fills the whole screen (the field is hidden
    // behind it) and while the page scrolls
    let held = false
    let covered = false
    let scrolling = 0
    const update = () => {
      const next = covered || scrolling !== 0
      if (next !== held) send({ type: 'hold', held: (held = next) })
    }
    const checkCovered = () => {
      covered = [...document.querySelectorAll('[data-opaque]')].some((el) => {
        const r = el.getBoundingClientRect()
        return r.top <= 1 && r.bottom >= window.innerHeight - 1
      })
    }
    const onScroll = () => {
      checkCovered()
      clearTimeout(scrolling)
      scrolling = window.setTimeout(() => {
        scrolling = 0
        update()
      }, SCROLL_HOLD_MS)
      update()
    }
    const onResize = () => {
      send({ type: 'resize', size: size() })
      checkCovered()
      update()
    }
    const onMove = (e: PointerEvent) => send({ type: 'move', x: e.clientX, y: e.clientY })
    const onClick = (e: PointerEvent) => send({ type: 'click', x: e.clientX, y: e.clientY })

    checkCovered()
    update()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointerdown', onClick)
    window.addEventListener('pointermove', onMove)
    return () => {
      worker?.terminate()
      local?.stop()
      clearTimeout(scrolling)
      canvas.remove()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointerdown', onClick)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  // Large soft lights as gradients (a blur filter this wide would be redrawn with every
  // change around it); the accent ones fade to the new color through a CSS variable
  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        initial={false}
        animate={{ '--glow': accent[1] }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
        className="absolute -top-80 -left-80 h-[56rem] w-[56rem]"
        style={{ background: glow('var(--glow)', 0.2, 'flat') }}
      />
      <motion.div
        initial={false}
        animate={{ '--glow': accent[0] }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
        className="absolute top-[calc(33.333%-10rem)] -right-88 h-[60rem] w-[60rem]"
        style={{ background: glow('var(--glow)', 0.15, 'flat') }}
      />
      <div
        className="absolute -bottom-88 left-[calc(25%-10rem)] h-[54rem] w-[54rem]"
        style={{ background: glow('oklch(86.9% 0.022 252.894)', 0.4, 'flat') }}
      />
    </div>
  )
}
