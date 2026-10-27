import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { ui } from './ui'

const SCREEN_W = 1280
const SCREEN_H = 720

/**
 * Lays its content out at a fixed 1280×720 and scales it to whatever box it sits in, so
 * a drawn screen behaves like a screenshot: tiny in the orbit, readable when opened up.
 * Contained, so the live readouts changing only lays out this screen, not the whole page.
 */
export function Screen({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  // The scale follows the box's width as the browser lays it out: the observer reports it
  // right after layout and before the frame is painted, so mounting never forces a layout
  // of its own (and a screen the browser isn't drawing yet isn't measured at all)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      inner.current!.style.transform = `scale(${entry.contentRect.width / SCREEN_W})`
    })
    ro.observe(box.current!)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={box} className="relative h-full w-full overflow-hidden">
      <div
        ref={inner}
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: SCREEN_W, height: SCREEN_H, transform: 'scale(0)', contain: 'strict' }}
      >
        {children}
      </div>
    </div>
  )
}

export function Panel({ title, right, className = '', children }: { title: string; right?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`flex flex-col rounded-md border ${className}`} style={{ background: ui.panel, borderColor: ui.line }}>
      <header
        className="flex items-center justify-between border-b px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase"
        style={{ borderColor: ui.line, color: ui.dim }}
      >
        <span>{title}</span>
        {right}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}
