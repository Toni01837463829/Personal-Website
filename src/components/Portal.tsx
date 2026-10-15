import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'

/**
 * A clean white frame around a screenshot that behaves like a portal: on hover the
 * picture drifts slightly inward toward the mouse, soft light rings flow from the rim
 * into the depth and the rim lights up. With a link, clicking opens the site; without
 * one, clicking opens the screenshot up into the middle of the screen.
 */
export function Portal({
  image,
  label,
  href,
  caption,
  onOpenChange,
}: {
  image: string
  label: string
  href?: string
  caption?: string
  /** Called with true while the screenshot is opened up (until it has flown back) */
  onOpenChange?: (open: boolean) => void
}) {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  // Where the card sits on screen; set while the screenshot is opened up
  const [from, setFrom] = useState<DOMRect | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    onOpenChange?.(from !== null)
  }, [from, onOpenChange])

  // Mouse position inside the portal, -1..1, smoothed
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 120, damping: 20 })
  const sy = useSpring(py, { stiffness: 120, damping: 20 })
  const rotateX = useTransform(sy, (v) => (reduced ? 0 : v * -6))
  const rotateY = useTransform(sx, (v) => (reduced ? 0 : v * 8))
  // The picture sits behind the frame, so it shifts the other way (parallax)
  const imgX = useTransform(sx, (v) => (reduced ? 0 : v * -10))
  const imgY = useTransform(sy, (v) => (reduced ? 0 : v * -8))
  const lx = useTransform(sx, (v) => 50 + v * 30)
  const ly = useTransform(sy, (v) => 50 + v * 30)
  const sheen = useMotionTemplate`radial-gradient(circle at ${lx}% ${ly}%, rgba(255,255,255,.28), transparent 45%)`

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    px.set(((e.clientX - r.left) / r.width) * 2 - 1)
    py.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }
  const onLeave = () => {
    setOpen(false)
    px.set(0)
    py.set(0)
  }

  const expand = () => {
    if (!frameRef.current) return
    onLeave()
    setFrom(frameRef.current.getBoundingClientRect())
    setExpanded(true)
  }

  const pull = open && !reduced
  const Tag = href ? motion.a : motion.div
  const linkProps = href
    ? { href, target: '_blank', rel: 'noreferrer', 'aria-label': `${label} öffnen` }
    : {
        role: 'button',
        tabIndex: 0,
        'data-cursor': '⤢',
        'aria-label': `${label} vergrößern`,
        onClick: expand,
        onKeyDown: (e: ReactKeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            expand()
          }
        },
      }

  return (
    <div ref={frameRef} style={{ perspective: 1200 }}>
      <Tag
        {...linkProps}
        onPointerEnter={() => setOpen(true)}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onFocus={() => setOpen(true)}
        onBlur={onLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        animate={{
          y: pull ? -6 : 0,
          boxShadow: open
            ? '0 0 0 6px rgba(255,255,255,.6), 0 0 60px 0 rgba(255,255,255,.95), 0 50px 90px -45px rgba(17,21,28,.5)'
            : '0 0 0 0px rgba(255,255,255,0), 0 0 0 0 rgba(255,255,255,0), 0 30px 80px -40px rgba(17,21,28,.35)',
        }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        className={`relative block rounded-[2rem] bg-white p-2.5 ring-1 ring-stone/60 outline-none ${from ? 'invisible' : ''}`}
      >
        {/* The window into the other side */}
        <div className="relative aspect-video overflow-hidden rounded-[1.4rem] bg-ink">
          <motion.img
            src={image}
            alt={`Vorschau: ${label}`}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover object-top select-none"
            style={{ x: imgX, y: imgY }}
            animate={{ scale: pull ? 1.09 : 1.03 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Soft light that follows the mouse across the glass */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: sheen }}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />

          {/* Light gathering only along the rim, so the page stays readable */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.4rem] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.9),inset_0_0_28px_6px_rgba(255,255,255,.75)]"
            initial={false}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Thin rings flowing from the rim into the depth */}
          {pull && (
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="portal-ring absolute inset-0 rounded-[1.4rem] border border-white/90"
                  style={{ animationDelay: `${i * 0.8}s` }}
                />
              ))}
            </div>
          )}

          {/* Inner rim so the window reads as depth, not a flat picture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.4rem] shadow-[inset_0_0_0_1px_rgba(17,21,28,.08),inset_0_12px_24px_-12px_rgba(17,21,28,.45)]"
          />

          <motion.span
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium whitespace-nowrap text-ink shadow-[0_16px_32px_-14px_rgba(17,21,28,.5)] backdrop-blur-md"
            initial={false}
            animate={{ opacity: open ? 1 : 0, y: open ? 0 : 10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24, delay: open ? 0.1 : 0 }}
          >
            {href ? (
              <>
                Seite betreten <span aria-hidden>↗</span>
              </>
            ) : (
              <>
                Ansehen <span aria-hidden>⤢</span>
              </>
            )}
          </motion.span>
        </div>

        <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1 text-sm text-mist">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7fbf7a]" />
            {caption ?? (href ? new URL(href).hostname.replace(/^www\./, '') : label)}
          </span>
          {href && (
            <motion.span aria-hidden animate={{ x: open ? 3 : 0, y: open ? -3 : 0 }}>
              ↗
            </motion.span>
          )}
        </div>
      </Tag>

      {createPortal(
        <AnimatePresence onExitComplete={() => setFrom(null)}>
          {expanded && from && (
            <Expanded
              image={image}
              label={label}
              caption={caption ?? label}
              from={from}
              onClose={() => setExpanded(false)}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

/**
 * The screenshot opened up: it flies from the card into the middle of the screen,
 * the page behind it blurs, and it flies back on close (Esc, backdrop or button).
 */
function Expanded({
  image,
  label,
  caption,
  from,
  onClose,
}: {
  image: string
  label: string
  caption: string
  from: DOMRect
  onClose: () => void
}) {
  const reduced = useReducedMotion()
  const [hover, setHover] = useState(false)

  // Mouse position on the whole screen, -1..1, smoothed: the card tilts and drifts with it
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 90, damping: 18 })
  const sy = useSpring(py, { stiffness: 90, damping: 18 })
  const rotateX = useTransform(sy, (v) => (reduced ? 0 : v * -9))
  const rotateY = useTransform(sx, (v) => (reduced ? 0 : v * 12))
  const x = useTransform(sx, (v) => (reduced ? 0 : v * 18))
  const y = useTransform(sy, (v) => (reduced ? 0 : v * 12))
  const imgX = useTransform(sx, (v) => (reduced ? 0 : v * -12))
  const imgY = useTransform(sy, (v) => (reduced ? 0 : v * -9))
  const lx = useTransform(sx, (v) => 50 + v * 40)
  const ly = useTransform(sy, (v) => 50 + v * 40)
  const sheen = useMotionTemplate`radial-gradient(circle at ${lx}% ${ly}%, rgba(255,255,255,.22), transparent 45%)`

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const onMove = (e: globalThis.PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1)
      py.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    const overflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointermove', onMove)
    return () => {
      document.documentElement.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointermove', onMove)
    }
  }, [onClose, px, py])

  // Same proportions as the card, popped out in front of the page but not filling it
  const vw = window.innerWidth
  const vh = window.innerHeight
  const ratio = from.height / from.width
  const width = Math.min(vw - 32, 880, (vh * 0.62) / ratio)
  const to = { left: (vw - width) / 2, top: (vh - width * ratio) / 2, width }
  const start = { left: from.left, top: from.top, width: from.width }
  const fly = reduced ? { duration: 0.2 } : { type: 'spring' as const, stiffness: 170, damping: 24 }
  const pull = hover && !reduced

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={label}>
      <motion.div
        className="absolute inset-0 bg-paper/50 backdrop-blur-md"
        data-cursor="✕"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      />
      {/* Flies between the card's place on the page and the middle of the screen */}
      <motion.div
        className="absolute"
        style={{ perspective: 1400 }}
        initial={reduced ? { ...to, opacity: 0 } : start}
        animate={{ ...to, opacity: 1 }}
        exit={reduced ? { opacity: 0 } : start}
        transition={fly}
      >
        {/* Pops toward the viewer, then tilts and drifts with the mouse */}
        <motion.div
          style={{ rotateX, rotateY, x, y, transformStyle: 'preserve-3d' }}
          initial={reduced ? false : { z: -160 }}
          animate={{ z: 0 }}
          exit={reduced ? undefined : { z: -120 }}
          transition={fly}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
        >
          <motion.div
            className="rounded-[2rem] bg-white p-2.5 ring-1 ring-stone/60"
            animate={{
              y: reduced ? 0 : [0, -6, 0],
              boxShadow: hover
                ? '0 0 0 6px rgba(255,255,255,.65), 0 0 80px 0 rgba(255,255,255,.95), 0 70px 120px -50px rgba(17,21,28,.6)'
                : '0 0 0 0px rgba(255,255,255,0), 0 0 50px 0 rgba(255,255,255,.7), 0 60px 110px -50px rgba(17,21,28,.55)',
            }}
            transition={{
              y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
              boxShadow: { type: 'spring', stiffness: 180, damping: 22 },
            }}
          >
            <div className="relative aspect-video overflow-hidden rounded-[1.4rem] bg-ink">
              <motion.img
                src={image}
                alt={label}
                draggable={false}
                className="h-full w-full object-cover object-top select-none"
                style={{ x: imgX, y: imgY }}
                animate={{ scale: pull ? 1.07 : 1.04 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: sheen }} />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[1.4rem] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.9),inset_0_0_28px_6px_rgba(255,255,255,.7)]"
                initial={false}
                animate={{ opacity: hover ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
              {pull && (
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="portal-ring absolute inset-0 rounded-[1.4rem] border border-white/90"
                      style={{ animationDelay: `${i * 0.8}s` }}
                    />
                  ))}
                </div>
              )}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[1.4rem] shadow-[inset_0_0_0_1px_rgba(17,21,28,.08),inset_0_12px_24px_-12px_rgba(17,21,28,.45)]"
              />
            </div>
            <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1 text-sm text-mist">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7fbf7a]" />
                {caption}
              </span>
              <motion.button
                type="button"
                onClick={onClose}
                aria-label="Schließen"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-sand text-graphite transition-colors hover:bg-stone hover:text-ink"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.25 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                ✕
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
