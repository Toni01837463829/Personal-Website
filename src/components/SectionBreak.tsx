import { cancelFrame, frame, motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { accentVars, chapter, chapters, type ChapterId } from '../chapters'
import { glow } from './glow'
import { usePointer } from './Mouse'

type Glyph = { ch: string; w: number; angle: number; dot: boolean }
type Ring = ReturnType<typeof layoutRing>

const FONT_FAMILY = '"Inter Variable", system-ui, sans-serif'
const DEG = Math.PI / 180
// How far the canvas reaches past the stage above and below, for letters swinging out of it
const OVERHANG = 64

// The near side: ink with a few px of depth underneath and a soft shadow (like text-extrude in index.css)
const INK = '#11151c'
const DEPTH = ['#afb9c5', '#bbc4cf', '#c7cfd9', '#d3dae3'] // 4 px down … 1 px down
const SHADOW = { color: 'rgba(17, 21, 28, 0.18)', y: 18, blur: 30 }

/**
 * Lays the label out around a cylinder: measures every letter, repeats the label until the
 * ring has roughly the wanted radius, and gives each letter its angle on the ring.
 */
function layoutRing(label: string, vw: number) {
  const fontSize = Math.round(Math.min(104, Math.max(40, vw * 0.065)))
  const target = Math.min(620, Math.max(230, vw * 0.4))
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`
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

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

type Sprite = { img: CanvasImageSource; ox: number; oy: number; k: number }
type Faces = { front: Sprite; shadow?: Sprite; back: Sprite }

/**
 * One face of a letter drawn into its own small canvas, `k` pixels per CSS px. The letter's
 * box is w × h; margins (top, right, bottom, left) leave room for what spills out of it.
 * ox/oy is where the middle of the box ended up, in sprite pixels.
 * Kept as an ImageBitmap where possible: a finished, unchangeable image the GPU uploads once,
 * where a canvas has to be looked at again every time it is drawn from.
 */
function sprite(w: number, h: number, [t, r, b, l]: number[], k: number, paint: (ctx: CanvasRenderingContext2D) => void): Sprite {
  const width = Math.max(1, Math.ceil((w + l + r) * k))
  const height = Math.max(1, Math.ceil((h + t + b) * k))
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(width, height) : Object.assign(document.createElement('canvas'), { width, height })
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.setTransform(k, 0, 0, k, l * k, t * k)
  paint(ctx)
  const img = canvas instanceof HTMLCanvasElement ? canvas : canvas.transferToImageBitmap()
  return { img, ox: (l + w / 2) * k, oy: (t + h / 2) * k, k }
}

/**
 * Renders every distinct letter once: the solid front face, its soft shadow (blurry anyway,
 * so at low resolution) and the hollow back face in the accent color. Each at about the
 * largest size it is shown at, `k` and `backK` pixels per CSS px: front faces come up to the
 * front of the ring, back faces never get closer than its sides.
 */
function makeFaces({ fontSize, glyphs }: Ring, [a, b]: readonly [string, string], k: number, backK: number) {
  const font = `700 ${fontSize}px ${FONT_FAMILY}`
  const probe = document.createElement('canvas').getContext('2d')!
  probe.font = font
  const metrics = probe.measureText('H')
  const ascent = metrics.fontBoundingBoxAscent ?? fontSize * 0.97
  const descent = metrics.fontBoundingBoxDescent ?? fontSize * 0.24
  // line-height 1, line centered in the box: this is where the baseline lands
  const baseline = (fontSize - ascent - descent) / 2 + ascent
  const h = fontSize
  const blur = SHADOW.blur * 1.5 // the shadow fades out within 3 standard deviations (blur / 2 each)
  const shadowK = Math.min(k, 1) / 2

  const faces = new Map<string, Faces>()
  for (const g of glyphs) {
    const key = g.dot ? '•' : g.ch
    if (faces.has(key) || (!g.dot && !g.ch.trim())) continue

    if (g.dot) {
      const d = fontSize * 0.2
      const c = [g.w / 2, h / 2] as const
      faces.set(key, {
        front: sprite(g.w, h, [1, 1, 1, 1], k, (ctx) => {
          const fill = ctx.createLinearGradient(c[0] - d / 2, c[1] - d / 2, c[0] + d / 2, c[1] + d / 2)
          fill.addColorStop(0, a)
          fill.addColorStop(1, b)
          ctx.fillStyle = fill
          ctx.beginPath()
          ctx.arc(c[0], c[1], d / 2, 0, Math.PI * 2)
          ctx.fill()
        }),
        back: sprite(g.w, h, [1, 1, 1, 1], backK, (ctx) => {
          ctx.strokeStyle = rgba(a, 0.5)
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(c[0], c[1], d / 2 - 0.5, 0, Math.PI * 2)
          ctx.stroke()
        }),
      })
      continue
    }

    // Ink can reach past the box (umlauts, side bearings): margins from the real outline
    const ink = probe.measureText(g.ch)
    const m = [
      Math.max(0, ink.actualBoundingBoxAscent - baseline) + 2,
      Math.max(0, ink.actualBoundingBoxRight - g.w) + 2,
      Math.max(0, baseline + ink.actualBoundingBoxDescent - h) + 2,
      Math.max(0, ink.actualBoundingBoxLeft) + 2,
    ]
    faces.set(key, {
      front: sprite(g.w, h, [m[0], m[1], m[2] + DEPTH.length, m[3]], k, (ctx) => {
        ctx.font = font
        DEPTH.forEach((color, i) => {
          ctx.fillStyle = color
          ctx.fillText(g.ch, 0, baseline + DEPTH.length - i)
        })
        ctx.fillStyle = INK
        ctx.fillText(g.ch, 0, baseline)
      }),
      shadow: sprite(
        g.w,
        h,
        [Math.max(0, m[0] + blur - SHADOW.y), m[1] + blur, m[2] + blur + SHADOW.y, m[3] + blur],
        shadowK,
        (ctx) => {
          // Only the shadow: the letter itself is drawn off to the side, its shadow shifted back in
          const away = (g.w + m[1] + m[3] + blur * 2) * 2
          ctx.font = font
          ctx.shadowColor = SHADOW.color
          ctx.shadowBlur = SHADOW.blur * shadowK
          ctx.shadowOffsetX = away * shadowK
          ctx.shadowOffsetY = SHADOW.y * shadowK
          ctx.fillText(g.ch, -away, baseline)
        },
      ),
      back: sprite(g.w, h, m, backK, (ctx) => {
        ctx.font = font
        ctx.lineWidth = 1.5
        ctx.strokeStyle = rgba(a, 0.4)
        ctx.strokeText(g.ch, 0, baseline)
      }),
    })
  }
  return faces
}

/**
 * The band before each section: its name wrapped around a tilted 3D ring that spins as
 * you scroll past and swings toward the mouse. The near side is solid with a bit of depth,
 * the far side shows through, mirrored like glass, as hollow letters in the section accent.
 *
 * The ring is drawn on one canvas: each letter is rendered once, then placed every frame
 * with the same math CSS would use (rotateY(angle) translateZ(radius) on the ring, tilted
 * and turned, scaled, perspective). As separate 3D layers, the letters cost far more.
 */
export function SectionBreak({ to }: { to: ChapterId }) {
  const ref = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const k = reduced ? 0 : 1
  const { label, accent } = chapter(to)
  const index = String(chapters.findIndex((c) => c.id === to)).padStart(2, '0')

  const [ring, setRing] = useState(() => layoutRing(label, window.innerWidth))
  useEffect(() => {
    const update = () => setRing(layoutRing(label, window.innerWidth))
    document.fonts.ready.then(update)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [label])

  const { x: px, y: py } = usePointer()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const rotateY = useTransform([scrollYProgress, px], ([p, m]: number[]) => (40 - p * 160 + m * 18) * k)
  const rotateX = useTransform([scrollYProgress, py], ([p, m]: number[]) => (-8 + (p - 0.5) * 6 + m * 4) * k)
  const opacity = useTransform(scrollYProgress, [0.05, 0.3, 0.7, 0.95], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8])

  const { fontSize, radius } = ring
  const height = fontSize * 1.5 + radius * 0.4

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const perspective = radius * 2.4 + 500
    // Letters at the front are magnified by the perspective; render them for that size
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const zoom = perspective / (perspective - radius)
    const tilt = -3 * DEG
    const cosT = Math.cos(tilt)
    const sinT = Math.sin(tilt)

    // Rendering the letters takes a few dozen ms, so it waits for a quiet moment after the
    // page has loaded, or happens right away if the band shows up before that
    type Letter = { g: Glyph; faces: Faces; z: number; x: number; y: number; ux: number; uy: number; vx: number; vy: number }
    let letters: Letter[] | null = null
    const prepare = () => {
      if (letters) return letters
      const faces = makeFaces(ring, accent, Math.min(4, dpr * zoom), dpr)
      return (letters = ring.glyphs.flatMap((g) => {
        const f = faces.get(g.dot ? '•' : g.ch)
        return f ? [{ g, faces: f, z: 0, x: 0, y: 0, ux: 0, uy: 0, vx: 0, vy: 0 }] : []
      }))
    }
    const idle = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 300))
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout
    const pending = idle(prepare, { timeout: 4000 })

    let visible = false
    const draw = () => {
      if (!visible) return
      const letters = prepare()
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Plain bilinear, like the browser uses for 3D-transformed elements. The smoother
      // settings rescale the letters on every draw, which costs integrated GPUs whole frames;
      // instead each face is rendered at about the largest size it is ever shown (makeFaces)
      ctx.imageSmoothingQuality = 'low'

      const rx = rotateX.get() * DEG
      const ry = rotateY.get() * DEG
      const s = scale.get()
      const cosX = Math.cos(rx)
      const sinX = Math.sin(rx)
      const cosY = Math.cos(ry)
      const sinY = Math.sin(ry)
      // The ring turns around the middle of the stage, which is also the perspective origin
      const cx = w / 2
      const cy = OVERHANG + (h - OVERHANG * 2) / 2
      let X = 0
      let Y = 0
      let Z = 0
      // A point on the ring → the screen: rotateX(rx) rotateY(ry), scale(s), rotate(-3deg), perspective
      const project = (x: number, y: number, z: number) => {
        const x1 = x * cosY + z * sinY
        const z1 = z * cosY - x * sinY
        const y2 = y * cosX - z1 * sinX
        Z = y * sinX + z1 * cosX
        const f = perspective / (perspective - Z)
        const x3 = x1 * s
        const y3 = y2 * s
        X = cx + (x3 * cosT - y3 * sinT) * f
        Y = cy + (x3 * sinT + y3 * cosT) * f
      }

      for (const l of letters) {
        // The letter sits at its angle on the ring, facing out: its middle, and its two axes
        const t = l.g.angle * DEG
        const sin = Math.sin(t)
        const cos = Math.cos(t)
        const mx = radius * sin
        const mz = radius * cos
        const hw = l.g.w / 2
        const hh = fontSize / 2
        project(mx + hw * cos, 0, mz - hw * sin)
        const rx1 = X
        const ry1 = Y
        project(mx - hw * cos, 0, mz + hw * sin)
        l.ux = (rx1 - X) / (2 * hw)
        l.uy = (ry1 - Y) / (2 * hw)
        project(mx, hh, mz)
        const dx1 = X
        const dy1 = Y
        project(mx, -hh, mz)
        l.vx = (dx1 - X) / (2 * hh)
        l.vy = (dy1 - Y) / (2 * hh)
        project(mx, 0, mz)
        l.x = X
        l.y = Y
        l.z = Z
      }
      // Far letters first, so the near ones cover them
      letters.sort((p, q) => p.z - q.z)

      const fade = w * 0.12
      const place = (sp: Sprite, l: Letter) => {
        const a = (dpr * l.ux) / sp.k
        const b = (dpr * l.uy) / sp.k
        const c = (dpr * l.vx) / sp.k
        const d = (dpr * l.vy) / sp.k
        ctx.setTransform(a, b, c, d, dpr * l.x - a * sp.ox - c * sp.oy, dpr * l.y - b * sp.ox - d * sp.oy)
        ctx.drawImage(sp.img, 0, 0)
      }
      for (const l of letters) {
        // Fades out toward the left and right edges of the screen
        ctx.globalAlpha = Math.max(0, Math.min(1, l.x / fade, (w - l.x) / fade))
        if (ctx.globalAlpha === 0) continue
        // Turned toward the viewer (not mirrored on screen): the solid front, otherwise the hollow back
        if (l.ux * l.vy - l.uy * l.vx > 0) {
          if (l.faces.shadow) place(l.faces.shadow, l)
          place(l.faces.front, l)
        } else place(l.faces.back, l)
      }
      ctx.globalAlpha = 1
    }

    // Redraw in the same frame the values change; only while the band is on screen (the
    // margin keeps a band that merely touches the edge of the screen from counting)
    const schedule = () => frame.render(draw)
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        schedule()
      },
      { rootMargin: '-1px 0px' },
    )
    io.observe(canvas)
    const ro = new ResizeObserver(schedule)
    ro.observe(canvas)
    const offs = [rotateX, rotateY, scale].map((v) => v.on('change', schedule))
    return () => {
      cancelIdle(pending)
      io.disconnect()
      ro.disconnect()
      offs.forEach((off) => off())
      cancelFrame(draw)
    }
  }, [ring, accent, radius, fontSize, rotateX, rotateY, scale])

  return (
    <div ref={ref} style={accentVars(to)} aria-hidden className="relative overflow-hidden py-10 select-none md:py-16">
      <motion.div style={{ opacity, height }} className="relative">
        {/* Soft accent glow the ring floats above: a long, flat streak of light under the near side */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: radius * 2.9,
            height: radius * 0.25 + 160,
            marginTop: radius * 0.185,
            background: glow('var(--accent-a)', 0.15 * Math.min(1, radius / 780), 'flat'),
          }}
        />
        <canvas ref={canvasRef} className="absolute inset-x-0 h-[calc(100%+8rem)] w-full" style={{ top: -OVERHANG }} />
      </motion.div>

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
