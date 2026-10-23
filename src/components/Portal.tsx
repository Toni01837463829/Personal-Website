import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useInView,
  useTransform,
} from 'motion/react'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

export type PortalColors = [string, string, string]

// Without colors of its own a portal uses the section accent
const accentColors: PortalColors = ['var(--accent-a)', 'var(--accent-b)', 'var(--accent-a)']

const colorVars = (c: PortalColors) => ({ '--p1': c[0], '--p2': c[1], '--p3': c[2] }) as CSSProperties

const PASS_MS = 420 // how long passing through takes before the popout opens

// A screen recording plays as a silent loop in place of a screenshot, only while on screen
const isVideo = (src: string) => /\.(mp4|webm)$/i.test(src)
const videoProps = { muted: true, loop: true, playsInline: true }

function usePlayInView() {
  const ref = useRef<HTMLVideoElement>(null)
  const inView = useInView(ref)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (inView) v.play().catch(() => {})
    else v.pause()
  }, [inView])
  return ref
}

/**
 * A clean white frame around a screenshot that behaves like a portal you get sucked
 * into: on hover the page zooms gently toward the mouse, a soft light tunnel with a hint of
 * the portal's colors closes in around it and faint rings drift into
 * the depth. On click the page rushes at you. With a link that opens the site; without
 * one, the screenshot opens up in front of the page.
 * Instead of a screenshot it can hold any content (children), which gets the same hover
 * effect and opens up the same way. `dark` swaps the white frame for a dark one.
 */
export function Portal({
  image,
  children,
  dark,
  label,
  href,
  caption,
  colors = accentColors,
  onOpenChange,
}: {
  image?: string
  children?: ReactNode
  dark?: boolean
  label: string
  href?: string
  caption?: string
  colors?: PortalColors
  /** Called with true while the screenshot is opened up (until it has flown back) */
  onOpenChange?: (open: boolean) => void
}) {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [passing, setPassing] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const videoRef = usePlayInView()
  // Where the card sits on screen; set while the screenshot is opened up
  const [from, setFrom] = useState<DOMRect | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    onOpenChange?.(from !== null)
  }, [from, onOpenChange])

  // Mouse position inside the portal, 0..1, smoothed
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const sx = useSpring(px, { stiffness: 140, damping: 20 })
  const sy = useSpring(py, { stiffness: 140, damping: 20 })
  const rotateX = useTransform(sy, (v) => (reduced ? 0 : (v - 0.5) * -10))
  const rotateY = useTransform(sx, (v) => (reduced ? 0 : (v - 0.5) * 12))
  const ox = useTransform(sx, (v) => v * 100)
  const oy = useTransform(sy, (v) => v * 100)
  const origin = useMotionTemplate`${ox}% ${oy}%`
  // Light closing in around the mouse: clear in the middle, tinted toward the edges
  const lightTunnel = useMotionTemplate`radial-gradient(ellipse 70% 70% at ${ox}% ${oy}%, transparent 40%, color-mix(in srgb, var(--p2) 10%, rgba(255,255,255,.25)) 75%, color-mix(in srgb, var(--p1) 12%, rgba(255,255,255,.6)) 100%)`
  const darkTunnel = useMotionTemplate`radial-gradient(ellipse 70% 70% at ${ox}% ${oy}%, transparent 40%, color-mix(in srgb, var(--p2) 16%, transparent) 75%, color-mix(in srgb, var(--p1) 32%, transparent) 100%)`
  const tunnel = dark ? darkTunnel : lightTunnel

  const onEnter = () => setOpen(true)
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }
  const onLeave = () => {
    setOpen(false)
    px.set(0.5)
    py.set(0.5)
  }

  // Passing through: the page rushes at you
  const passThrough = () => {
    if (reduced) return
    setPassing(true)
    window.setTimeout(() => setPassing(false), PASS_MS + 400)
  }

  const expand = () => {
    if (!frameRef.current || (!image && !children)) return
    const rect = frameRef.current.getBoundingClientRect()
    passThrough()
    window.setTimeout(
      () => {
        onLeave()
        setFrom(rect)
        setExpanded(true)
      },
      reduced ? 0 : PASS_MS - 80,
    )
  }

  const pull = open && !reduced
  const Tag = href ? motion.a : motion.div
  const linkProps = href
    ? { href, target: '_blank', rel: 'noreferrer', 'aria-label': `${label} öffnen`, onClick: passThrough }
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
    <div ref={frameRef} style={{ perspective: 1200, ...colorVars(colors) }}>
      <Tag
        {...linkProps}
        onPointerEnter={onEnter}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        animate={{
          scale: pull ? 1.01 : 1,
          boxShadow: dark
            ? open
              ? '0 0 0 4px rgba(255,255,255,.1), 0 0 50px 0 rgba(255,255,255,.08), 0 40px 90px -40px rgba(0,0,0,.9)'
              : '0 0 0 0px rgba(255,255,255,0), 0 0 0 0 rgba(255,255,255,0), 0 30px 80px -40px rgba(0,0,0,.8)'
            : open
              ? '0 0 0 5px rgba(255,255,255,.5), 0 0 40px 0 rgba(255,255,255,.7), 0 40px 90px -40px rgba(17,21,28,.42)'
              : '0 0 0 0px rgba(255,255,255,0), 0 0 0 0 rgba(255,255,255,0), 0 30px 80px -40px rgba(17,21,28,.35)',
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className={`relative block rounded-[2rem] p-2.5 ring-1 outline-none ${dark ? 'bg-[#0c1016] ring-white/10' : 'bg-white ring-stone/60'} ${
          from ? 'invisible' : ''
        }`}
      >
        {/* Dark frames get their own glow in the portal's colors */}
        {dark && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-[2rem]"
            style={{
              boxShadow:
                '0 0 0 1px color-mix(in srgb, var(--p1) 55%, transparent), 0 0 45px -5px color-mix(in srgb, var(--p1) 45%, transparent)',
            }}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
        {/* The window into the other side */}
        <div className={`relative aspect-video overflow-hidden rounded-[1.4rem] ${dark ? 'bg-[#080b10]' : 'bg-ink'}`}>
          {image && isVideo(image) ? (
            <motion.video
              ref={videoRef}
              src={image}
              aria-label={`Vorschau: ${label}`}
              preload="metadata"
              {...videoProps}
              className="h-full w-full object-cover object-top select-none"
              style={{ transformOrigin: origin }}
              animate={{
                scale: passing ? 1.3 : pull ? 1.08 : 1,
              }}
              transition={{
                duration: passing ? PASS_MS / 1000 : 1.1,
                ease: passing ? [0.55, 0, 0.75, 0.2] : [0.22, 1, 0.36, 1],
              }}
            />
          ) : image ? (
            <motion.img
              src={image}
              alt={`Vorschau: ${label}`}
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover object-top select-none"
              style={{ transformOrigin: origin }}
              animate={{
                scale: passing ? 1.3 : pull ? 1.08 : 1,
              }}
              transition={{
                duration: passing ? PASS_MS / 1000 : 1.1,
                ease: passing ? [0.55, 0, 0.75, 0.2] : [0.22, 1, 0.36, 1],
              }}
            />
          ) : (
            <motion.div
              className="h-full w-full"
              style={{ transformOrigin: origin }}
              animate={{ scale: pull ? 1.08 : 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          )}

          {/* Tinted light closing in around the mouse */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: tunnel }}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Glowing rings in the portal's colors flowing into the depth */}
          {pull && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ transformOrigin: origin }}
            >
              {[0, 1, 2].map((i) => {
                const c = `var(--p${(i % 3) + 1})`
                return (
                  <span
                    key={i}
                    className="portal-ring absolute inset-0 rounded-[1.4rem] border"
                    style={{
                      animationDelay: `${i * 1.05}s`,
                      transformOrigin: 'inherit',
                      borderColor: `color-mix(in srgb, ${c} 25%, white)`,
                      boxShadow: `0 0 10px color-mix(in srgb, ${c} 25%, transparent)`,
                    }}
                  />
                )
              })}
            </motion.div>
          )}

          {/* Inner rim so the window reads as depth, not a flat picture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.4rem] shadow-[inset_0_0_0_1px_rgba(17,21,28,.08),inset_0_10px_30px_-10px_rgba(17,21,28,.35)]"
          />

          {(image || children) && (
            <motion.span
              className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium whitespace-nowrap text-ink shadow-[0_20px_40px_-15px_rgba(17,21,28,.45)] backdrop-blur"
              initial={false}
              animate={{ opacity: open && !passing ? 1 : 0, y: open && !passing ? 0 : 8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24, delay: open ? 0.1 : 0 }}
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ background: 'linear-gradient(135deg, var(--p1), var(--p2), var(--p3))' }}
              />
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
          )}
        </div>

        <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1 text-sm text-mist">
          <span className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, var(--p1), var(--p3))' }}
            />
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
              dark={dark}
              label={label}
              caption={caption ?? label}
              colors={colors}
              from={from}
              onClose={() => setExpanded(false)}
            >
              {children}
            </Expanded>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

/**
 * The screenshot opened up: it flies from the card into the middle of the screen, the
 * page behind blurs, and it flies back on close (Esc, backdrop or button). While open
 * it tilts and drifts with the mouse.
 */
function Expanded({
  image,
  children,
  dark,
  label,
  caption,
  colors,
  from,
  onClose,
}: {
  image?: string
  children?: ReactNode
  dark?: boolean
  label: string
  caption: string
  colors: PortalColors
  from: DOMRect
  onClose: () => void
}) {
  const reduced = useReducedMotion()
  const videoRef = usePlayInView()

  // Mouse position on the whole screen, -1..1, smoothed: the card tilts and drifts with it
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 90, damping: 18 })
  const sy = useSpring(py, { stiffness: 90, damping: 18 })
  const rotateX = useTransform(sy, (v) => (reduced ? 0 : v * -9))
  const rotateY = useTransform(sx, (v) => (reduced ? 0 : v * 12))
  const x = useTransform(sx, (v) => (reduced ? 0 : v * 18))
  const y = useTransform(sy, (v) => (reduced ? 0 : v * 12))
  const imgX = useTransform(sx, (v) => (reduced ? 0 : v * -10))
  const imgY = useTransform(sy, (v) => (reduced ? 0 : v * -8))
  const lx = useTransform(sx, (v) => 50 + v * 40)
  const ly = useTransform(sy, (v) => 50 + v * 40)
  const sheen = useMotionTemplate`radial-gradient(circle at ${lx}% ${ly}%, rgba(255,255,255,.18), transparent 45%)`

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
  // Drawn screens are dense, so they get more room than screenshots
  const width = image ? Math.min(vw - 32, 880, (vh * 0.62) / ratio) : Math.min(vw - 32, 1200, (vh * 0.86) / ratio)
  const to = { left: (vw - width) / 2, top: (vh - width * ratio) / 2, width }
  const start = { left: from.left, top: from.top, width: from.width }
  const fly = reduced ? { duration: 0.2 } : { type: 'spring' as const, stiffness: 170, damping: 24 }

  return (
    <div
      className="fixed inset-0 z-[90]"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      style={{ ...colorVars(colors), ...(dark && ({ '--accent-a': colors[0], '--accent-b': colors[1] } as CSSProperties)) }}
    >
      <motion.div
        className={`absolute inset-0 backdrop-blur-md ${dark ? 'bg-[#05070a]/65' : 'bg-paper/50'}`}
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
        >
          <motion.div
            className={`rounded-[2rem] p-2.5 ring-1 ${
              dark
                ? 'theme-dark bg-[#0c1016]! shadow-[0_0_60px_-10px_color-mix(in_srgb,var(--p1)_40%,transparent),0_60px_110px_-50px_rgba(0,0,0,.9)] ring-white/10'
                : 'bg-white shadow-[0_0_50px_rgba(255,255,255,.7),0_60px_110px_-50px_rgba(17,21,28,.55)] ring-stone/60'
            }`}
            animate={{ y: reduced ? 0 : [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className={`relative aspect-video overflow-hidden rounded-[1.4rem] ${dark ? 'bg-[#080b10]' : 'bg-ink'}`}>
              {image && isVideo(image) ? (
                <motion.video
                  ref={videoRef}
                  src={image}
                  aria-label={label}
                  {...videoProps}
                  className="h-full w-full object-cover object-top select-none"
                  style={{ x: imgX, y: imgY }}
                  initial={reduced ? false : { scale: 1.2 }}
                  animate={{ scale: 1.04 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : image ? (
                <motion.img
                  src={image}
                  alt={label}
                  draggable={false}
                  className="h-full w-full object-cover object-top select-none"
                  style={{ x: imgX, y: imgY }}
                  initial={reduced ? false : { scale: 1.2 }}
                  animate={{ scale: 1.04 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : (
                <div className="h-full w-full">{children}</div>
              )}
              <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: sheen }} />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[1.4rem] shadow-[inset_0_0_0_1px_rgba(17,21,28,.08),inset_0_12px_24px_-12px_rgba(17,21,28,.45)]"
              />
            </div>
            <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1 text-sm text-mist">
              <span className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, var(--p1), var(--p3))' }}
                />
                {caption}
              </span>
              <motion.button
                type="button"
                onClick={onClose}
                aria-label="Schließen"
                className={`flex h-7 w-7 items-center justify-center rounded-full text-graphite transition-colors hover:text-ink ${
                  dark ? 'bg-white/10 hover:bg-white/20' : 'bg-sand hover:bg-stone'
                }`}
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
