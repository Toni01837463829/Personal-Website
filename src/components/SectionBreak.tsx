import { cancelFrame, frame, motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { accentVars, chapter, chapters, type ChapterId } from '../chapters'
import { usePointer } from './Mouse'

type Glyph = { ch: string; w: number; angle: number; dot: boolean }

const FONT = '"Inter Variable", system-ui, sans-serif'
const INK = '#11151c'
// The few px of depth under the solid letters, deepest first
const EXTRUDE = ['#afb9c5', '#bbc4cf', '#c7cfd9', '#d3dae3']
const TILT = -3 // degrees the whole ring leans
// Letters are drawn from pictures this much sharper than the screen, so the ones the
// perspective brings closer stay crisp
const SHARPNESS = 1.5

// One canvas to measure letters with, shared by all the rings
let measurer: CanvasRenderingContext2D | null = null

/**
 * Lays the label out around a cylinder: measures every letter, repeats the label until the
 * ring has roughly the wanted radius, and gives each letter its angle on the ring.
 */
function layoutRing(label: string, vw: number) {
  const fontSize = Math.round(Math.min(104, Math.max(40, vw * 0.065)))
  const target = Math.min(620, Math.max(230, vw * 0.4))
  const ctx = (measurer ??= document.createElement('canvas').getContext('2d')!)
  ctx.font = `700 ${fontSize}px ${FONT}`
  const track = -0.03 * fontSize

  const unit = [...label].map((ch) => ({ ch, w: ctx.measureText(ch).width + track, dot: false }))
  unit.push({ ch: '', w: fontSize * 0.9, dot: true })
  const unitW = unit.reduce((s, g) => s + g.w, 0)
  const repeats = Math.max(2, Math.round((2 * Math.PI * target) / unitW))
  const total = unitW * repeats
  const radius = total / (2 * Math.PI)

  let x = 0
  const glyphs: Glyph[] = Array.from({ length: repeats }, () => unit)
    .flat()
    .map((g) => {
      const angle = ((x + g.w / 2) / total) * 360
      x += g.w
      return { ...g, angle }
    })
  return { fontSize, radius, glyphs }
}

type Ring = ReturnType<typeof layoutRing>

/**
 * The band before each section: its name wrapped around a tilted 3D ring that spins as
 * you scroll past and swings toward the mouse. The near side is solid with a bit of depth,
 * the far side shows through, mirrored like glass, as hollow letters in the section accent.
 * The ring is drawn on a canvas only while the band is near the screen.
 */
export function SectionBreak({ to }: { to: ChapterId }) {
  const ref = useRef<HTMLDivElement>(null)
  const { label, accent } = chapter(to)
  const index = String(chapters.findIndex((c) => c.id === to)).padStart(2, '0')

  const [ring, setRing] = useState(() => layoutRing(label, window.innerWidth))
  useEffect(() => {
    // Only a ring that came out different (the font arrived, the window changed) replaces
    // the old one, as a new ring means drawing its letters again
    const update = () =>
      setRing((old) => {
        const next = layoutRing(label, window.innerWidth)
        return next.fontSize === old.fontSize && next.radius === old.radius && next.glyphs.length === old.glyphs.length ? old : next
      })
    document.fonts.ready.then(update)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [label])

  const near = useInView(ref, { margin: '50% 0px' })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  return (
    <div
      ref={ref}
      style={accentVars(to)}
      aria-hidden
      // Only narrow screens fade the edges: there the ring is wider than the band
      className="relative overflow-hidden py-10 select-none max-md:[mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] md:py-16"
    >
      <div style={{ height: ring.fontSize * 1.5 + ring.radius * 0.4 }} className="relative">
        {near && <SpinningRing ring={ring} accent={accent} progress={scrollYProgress} />}
      </div>

      <div className="relative mt-6 flex items-center justify-center">
        <span className="glass relative rounded-full px-4 py-1.5 text-xs font-medium tracking-[0.3em] uppercase">
          <span className="text-accent tabular-nums">{index}</span>
          <span className="mx-2 text-mist">/</span>
          <span className="text-ink">{label}</span>
        </span>
      </div>
    </div>
  )
}

/** The ring itself, turned by how far the band has scrolled through the screen and by the mouse. */
function SpinningRing({ ring, accent, progress }: { ring: Ring; accent: readonly [string, string]; progress: MotionValue<number> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const k = reduced ? 0 : 1
  const { x: px, y: py } = usePointer()
  const rotateY = useTransform([progress, px], ([p, m]: number[]) => (40 - p * 160 + m * 18) * k)
  const rotateX = useTransform([progress, py], ([p, m]: number[]) => (-8 + (p - 0.5) * 6 + m * 4) * k)
  const opacity = useTransform(progress, [0.05, 0.3, 0.7, 0.95], [0, 1, 1, 0])
  const scale = useTransform(progress, [0, 0.5, 1], [0.8, 1, 0.8])
  // Coming into view it is still fully faded out (opacity), so an old frame never shows
  const visible = useInView(canvas)
  // The letter pictures survive the ring going off screen and coming back
  const sprites = useRef<SpriteCache>(null)

  // Made ahead while the browser has nothing else to do, so the frame the ring first shows
  // up in doesn't have to wait for them
  useEffect(() => {
    const make = () => letters(sprites, ring, accent, Math.min(window.devicePixelRatio || 1, 2))
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(make, { timeout: 2000 })
      return () => cancelIdleCallback(id)
    }
    const t = setTimeout(make, 500)
    return () => clearTimeout(t)
  }, [ring, accent])

  // Redraws in the frame after anything that turns the ring changed, and only while it is on screen
  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!visible || !el || !ctx) return
    const bleed = ring.fontSize
    // The size is read once here and then reported by the observer, so drawing never has
    // to ask for layout
    let w = el.clientWidth
    let h = el.clientHeight
    const draw = () => {
      // Fully faded out at either end of its way through the screen: nothing to draw yet
      const p = progress.get()
      if (p <= 0.05 || p >= 0.95) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
        el.width = Math.round(w * dpr)
        el.height = Math.round(h * dpr)
      }
      paint(ctx, ring, letters(sprites, ring, accent, dpr), { cx: w / 2, cy: bleed + (h - 2 * bleed) / 2, dpr }, scale.get(), rotateX.get(), rotateY.get())
    }
    const schedule = () => frame.render(draw)
    draw()
    const stop = [rotateX.on('change', schedule), rotateY.on('change', schedule), scale.on('change', schedule)]
    const resize = new ResizeObserver(([entry]) => {
      w = entry.contentRect.width
      h = entry.contentRect.height
      schedule()
    })
    resize.observe(el)
    return () => {
      stop.forEach((s) => s())
      resize.disconnect()
      cancelFrame(draw)
    }
  }, [visible, ring, accent, progress, rotateX, rotateY, scale])

  const { fontSize, radius } = ring
  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      {/* Soft accent glow the ring floats above */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 rounded-[50%] bg-(--accent-a) opacity-15 [mask-image:radial-gradient(closest-side,#000,transparent)]"
        style={{ width: radius * 1.8, height: radius * 0.25, marginTop: radius * 0.06 }}
      />
      {/* Reaches a letter's height past the band, for the letters the tilt lifts or drops */}
      <canvas ref={canvas} className="absolute inset-x-0 w-full" style={{ top: -fontSize, height: `calc(100% + ${2 * fontSize}px)` }} />
    </motion.div>
  )
}

/** A letter drawn once, with the center of its box at (x, y); sizes in css px */
type Sprite = { img: HTMLCanvasElement; x: number; y: number; w: number; h: number }
type Sprites = Map<string, { front: Sprite | null; back: Sprite | null }>
type SpriteCache = { ring: Ring; scale: number; set: Sprites } | null

/** The letters of `ring` for this pixel density, made once and then kept in `cache` */
function letters(cache: { current: SpriteCache }, ring: Ring, accent: readonly [string, string], dpr: number) {
  const scale = dpr * SHARPNESS
  if (cache.current?.ring !== ring || cache.current.scale !== scale) {
    cache.current = { ring, scale, set: makeSprites(ring, accent, scale) }
  }
  return cache.current.set
}

const withAlpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${n >> 16} ${(n >> 8) & 255} ${n & 255} / ${a})`
}

/**
 * Every distinct letter twice: the near side (solid ink with its depth underneath) and the
 * far side (a hollow outline in the accent), the way the CSS version styled them.
 */
function makeSprites({ fontSize, glyphs }: Ring, [a, b]: readonly [string, string], scale: number): Sprites {
  const font = `700 ${fontSize}px ${FONT}`
  const probe = document.createElement('canvas').getContext('2d')!
  probe.font = font
  const metrics = probe.measureText('H')
  // Where the baseline sits below the middle of a one-line box (line-height 1)
  const base = (metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2
  const sprites: Sprites = new Map()

  // Draws into a canvas just big enough for [left, top, right, bottom] around the box center
  const sprite = ([l, t, r, btm]: number[], paint: (ctx: CanvasRenderingContext2D) => void): Sprite => {
    const img = document.createElement('canvas')
    img.width = Math.ceil((r - l) * scale)
    img.height = Math.ceil((btm - t) * scale)
    const ctx = img.getContext('2d')!
    ctx.scale(scale, scale)
    ctx.translate(-l, -t)
    paint(ctx)
    return { img, x: -l, y: -t, w: img.width / scale, h: img.height / scale }
  }

  for (const g of glyphs) {
    const key = g.dot ? '' : g.ch
    if (sprites.has(key)) continue
    if (g.dot) {
      const r = fontSize * 0.1
      const box = [-r - 2, -r - 2, r + 2, r + 2]
      const front = sprite(box, (ctx) => {
        const fill = ctx.createLinearGradient(-r, -r, r, r)
        fill.addColorStop(0, a)
        fill.addColorStop(1, b)
        ctx.fillStyle = fill
        ctx.beginPath()
        ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.fill()
      })
      const back = sprite(box, (ctx) => {
        ctx.strokeStyle = withAlpha(a, 0.5)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(0, 0, r - 0.5, 0, Math.PI * 2)
        ctx.stroke()
      })
      sprites.set(key, { front, back })
      continue
    }
    const m = probe.measureText(g.ch)
    if (m.actualBoundingBoxRight + m.actualBoundingBoxLeft <= 0) {
      sprites.set(key, { front: null, back: null })
      continue
    }
    // The letter starts at the left edge of its box, like the text in the CSS version did
    const x = -g.w / 2
    const box = [x - m.actualBoundingBoxLeft - 2, base - m.actualBoundingBoxAscent - 2, x + m.actualBoundingBoxRight + 2, base + m.actualBoundingBoxDescent + EXTRUDE.length + 2]
    const front = sprite(box, (ctx) => {
      ctx.font = font
      EXTRUDE.forEach((color, i) => {
        ctx.fillStyle = color
        ctx.fillText(g.ch, x, base + EXTRUDE.length - i)
      })
      ctx.fillStyle = INK
      ctx.fillText(g.ch, x, base)
    })
    const back = sprite(box, (ctx) => {
      ctx.font = font
      ctx.strokeStyle = withAlpha(a, 0.4)
      ctx.lineWidth = 1.5
      ctx.strokeText(g.ch, x, base)
    })
    sprites.set(key, { front, back })
  }
  return sprites
}

/**
 * Puts every letter where the CSS 3D version had it: perspective from the middle of the
 * band, the ring leaned by TILT, scaled, tilted by rotateX and turned by rotateY, each
 * letter pushed out to the radius at its angle. Each letter is drawn flat with the
 * perspective it has at its center, farthest first. A letter seen from behind comes out
 * mirrored and gets the hollow far-side look.
 */
function paint(
  ctx: CanvasRenderingContext2D,
  { radius, glyphs }: Ring,
  sprites: Sprites,
  { cx, cy, dpr }: { cx: number; cy: number; dpr: number },
  scale: number,
  rotateX: number,
  rotateY: number,
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.imageSmoothingQuality = 'medium'

  const deg = Math.PI / 180
  const d = radius * 2.4 + 500
  const ct = Math.cos(TILT * deg)
  const st = Math.sin(TILT * deg)
  const cx2 = Math.cos(rotateX * deg)
  const sx2 = Math.sin(rotateX * deg)

  const placed = glyphs.map((g) => {
    const phi = (rotateY + g.angle) * deg
    const cos = Math.cos(phi)
    const sin = Math.sin(phi)
    // A point (u, v) in the letter's own box, through every transform onto the canvas
    const project = (u: number, v: number) => {
      const x1 = u * cos + radius * sin
      const z1 = -u * sin + radius * cos
      const y2 = v * cx2 - z1 * sx2
      const z2 = v * sx2 + z1 * cx2
      const x3 = x1 * scale
      const y3 = y2 * scale
      const w = 1 - z2 / d
      return [cx + (x3 * ct - y3 * st) / w, cy + (x3 * st + y3 * ct) / w, z2]
    }
    const [ox, oy, z] = project(0, 0)
    const [ux, uy] = project(1, 0)
    const [vx, vy] = project(0, 1)
    return { g, z, m: [ux - ox, uy - oy, vx - ox, vy - oy, ox, oy] }
  })
  placed.sort((p, q) => p.z - q.z)

  for (const { g, m } of placed) {
    const facing = m[0] * m[3] - m[1] * m[2]
    const pair = sprites.get(g.dot ? '' : g.ch)
    const s = facing > 0 ? pair?.front : pair?.back
    if (!s) continue
    ctx.setTransform(m[0] * dpr, m[1] * dpr, m[2] * dpr, m[3] * dpr, m[4] * dpr, m[5] * dpr)
    ctx.drawImage(s.img, -s.x, -s.y, s.w, s.h)
  }
}
