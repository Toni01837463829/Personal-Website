// The dot field behind the page (see Particles.tsx), kept free of the DOM so it can run in
// a worker: it draws on any 2D canvas, on its own frame loop, and is told about the mouse,
// the window size and when to hold still.

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number // which of the pre-drawn dot sizes
  a: number // peak opacity
  tint: number // small random offset on top of the screen-wide color gradient
  pulse: number // fade speed
  phase: number
  ox: number // offset from being stirred by the mouse, eases back to 0
  oy: number
}

type Wave = { x: number; y: number; start: number }

export type FieldCanvas = HTMLCanvasElement | OffscreenCanvas

export type Field = {
  resize: (w: number, h: number, dpr: number) => void
  move: (x: number, y: number) => void
  click: (x: number, y: number) => void
  /** Held, the field stands still: while a section covers it, or while the page scrolls */
  hold: (held: boolean) => void
  stop: () => void
}

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

// Every dot is stamped from a sheet of pre-drawn dots: one row per shade (and ripple tint),
// one column per size. Stamping from one image is a handful of draw calls for the GPU, where
// drawing each dot as its own circle was one per dot.
const SHADES = 16
const TINTS = 5
const SIZES = 12
const R_MIN = 0.6
const R_MAX = 2.8

// Calm frames (nothing stirred, no ripple) are drawn at 30 fps: the drift and the fading are
// slow enough that it looks the same, at half the cost
const CALM_FRAME_MS = 1000 / 30

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const radius = (size: number) => R_MIN + (size / (SIZES - 1)) * (R_MAX - R_MIN)

const newCanvas = (w: number, h: number): FieldCanvas => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h)
  return Object.assign(document.createElement('canvas'), { width: w, height: h })
}

function dotSheet(dpr: number) {
  const cell = Math.ceil(R_MAX * 2 * dpr) + 2
  const sheet = newCanvas(cell * SIZES, cell * SHADES * TINTS)
  const ctx = sheet.getContext('2d') as CanvasRenderingContext2D
  for (let t = 0; t < TINTS; t++)
    for (let s = 0; s < SHADES; s++) {
      const [r, g, b] = mix(mix(SLATE, INDIGO, s / (SHADES - 1)), RIPPLE, (t / (TINTS - 1)) * 0.7)
      ctx.fillStyle = `rgb(${r},${g},${b})`
      for (let z = 0; z < SIZES; z++) {
        ctx.beginPath()
        ctx.arc((z + 0.5) * cell, (t * SHADES + s + 0.5) * cell, radius(z) * dpr, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  // As a finished ImageBitmap where possible: uploaded to the GPU once, not looked at again
  // every time a dot is stamped from it
  return { sheet: sheet instanceof HTMLCanvasElement ? sheet : sheet.transferToImageBitmap(), cell }
}

export function createField(canvas: FieldCanvas, reduced: boolean): Field {
  // Both canvas kinds draw the same; one type keeps the drawing code simple
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null
  // No canvas to draw on (blocked or out of memory): no field, and nothing else breaks
  if (!ctx) return { resize() {}, move() {}, click() {}, hold() {}, stop() {} }
  const raf: (f: (now: number) => void) => number =
    typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f) => setTimeout(() => f(performance.now()), 16) as unknown as number
  const cancel = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout

  let particles: Particle[] = []
  let waves: Wave[] = []
  let w = 0
  let h = 0
  let dpr = 1
  let dots = dotSheet(1)
  let frame = 0
  // Time the field has been moving; it stands still while the field is held
  let clock = 0
  let last = 0
  let held = false
  let settling = false // dots still easing back after being stirred
  // Mouse position and how far it moved since the last frame
  const mouse = { x: -9999, y: -9999, dx: 0, dy: 0 }

  // dt: ms since the last drawn frame; the field moves at the same speed at any frame rate
  const draw = (dt: number) => {
    const step = dt / (1000 / 60)
    const settle = 0.96 ** step
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    waves = waves.filter((wv) => clock - wv.start < WAVE_LIFE)
    const stirring = Math.abs(mouse.dx) + Math.abs(mouse.dy) > 0.05
    const { sheet, cell } = dots
    const half = cell / 2
    settling = false

    for (const p of particles) {
      if (!reduced) {
        p.x += p.vx * step
        p.y += p.vy * step
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
            const k = fall * fall * STIR_STRENGTH * (0.6 + radius(p.size) / 3)
            p.ox = Math.max(-STIR_MAX, Math.min(STIR_MAX, p.ox + mouse.dx * k))
            p.oy = Math.max(-STIR_MAX, Math.min(STIR_MAX, p.oy + mouse.dy * k))
          }
        }
        if (p.ox !== 0 || p.oy !== 0) {
          p.ox *= settle
          p.oy *= settle
          if (Math.abs(p.ox) + Math.abs(p.oy) < 0.05) p.ox = p.oy = 0
          else settling = true
        }
      }

      // Ripple: inside the moving band the dot swings out and back (one sine period),
      // weighted by a bell curve so the band has soft edges, fading as the wave ages.
      let dx = 0
      let dy = 0
      let hit = 0
      for (const wv of waves) {
        const age = clock - wv.start
        const ex = p.x - wv.x
        const ey = p.y - wv.y
        const d = Math.sqrt(ex * ex + ey * ey) || 1
        const band = (d - age * WAVE_SPEED) / WAVE_WIDTH
        if (band < -2 || band > 2) continue
        const env = Math.exp(-band * band * 2) * (1 - age / WAVE_LIFE) ** 1.5
        const swing = Math.sin(band * Math.PI) * env * WAVE_PUSH
        dx += (ex / d) * swing
        dy += (ey / d) * swing
        hit = Math.max(hit, env)
      }

      const breathe = reduced ? 0.8 : 0.5 + 0.5 * Math.sin(clock * p.pulse + p.phase)
      const alpha = Math.min(1, p.a * (0.1 + 0.9 * breathe) + hit * 0.3)
      if (alpha < 0.02) continue

      const across = Math.min(1, Math.max(0, p.x / w + p.tint))
      const row = Math.round(hit * (TINTS - 1)) * SHADES + Math.round(across * (SHADES - 1))
      ctx.globalAlpha = alpha
      ctx.drawImage(sheet, p.size * cell, row * cell, cell, cell, (p.x + p.ox + dx) * dpr - half, (p.y + p.oy + dy) * dpr - half, cell, cell)
    }
    ctx.globalAlpha = 1
    // The movement has been used up; the next pointermove brings new
    mouse.dx = 0
    mouse.dy = 0
  }

  const loop = (now: number) => {
    frame = raf(loop)
    const dt = Math.min(now - last, 50)
    if (held) {
      last = now
      return
    }
    const calm = !settling && waves.length === 0 && Math.abs(mouse.dx) + Math.abs(mouse.dy) <= 0.05
    if (calm && dt < CALM_FRAME_MS - 4) return
    last = now
    clock += dt
    draw(dt)
  }
  if (!reduced) frame = raf(loop)

  return {
    resize(width, height, ratio) {
      w = width
      h = height
      dpr = ratio
      canvas.width = w * dpr
      canvas.height = h * dpr
      dots = dotSheet(dpr)
      const count = Math.round(Math.min(1600, (w * h) / 850))
      particles = Array.from({ length: count }, () => {
        const size = Math.random() ** 3 // mostly tiny, a few bigger
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12 - 0.03,
          size: Math.round(size * (SIZES - 1)),
          a: 0.3 + Math.random() * 0.45,
          tint: (Math.random() - 0.5) * 0.35,
          pulse: 0.0003 + Math.random() * 0.0009,
          phase: Math.random() * Math.PI * 2,
          ox: 0,
          oy: 0,
        }
      })
      if (reduced) draw(0)
    },
    move(x, y) {
      if (mouse.x > -9999) {
        mouse.dx += x - mouse.x
        mouse.dy += y - mouse.y
      }
      mouse.x = x
      mouse.y = y
    },
    click(x, y) {
      if (reduced) return
      waves.push({ x, y, start: clock })
      if (waves.length > 4) waves.shift()
    },
    hold(value) {
      held = value
    },
    stop() {
      cancel(frame)
    },
  }
}
