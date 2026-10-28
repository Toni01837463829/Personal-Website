// The particle field behind the page: simulation and drawing. It runs in a worker on an
// OffscreenCanvas (see particles.worker.ts), or on the page where a canvas can't be handed
// to a worker. Either way the page talks to it with the messages below.

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
  // Where and how strongly it is drawn this frame
  cx: number
  cy: number
  alpha: number
}

type Wave = { x: number; y: number; start: number }

export type FieldMessage =
  | { type: 'resize'; w: number; h: number; dpr: number }
  | { type: 'move'; x: number; y: number }
  | { type: 'click'; x: number; y: number }
  // A solid section or an opened-up screenshot fills the screen and hides the field
  | { type: 'covered'; covered: boolean }
  // Weak graphics chip (see lite.ts): left alone, the field redraws only a few times a second
  | { type: 'lite'; on: boolean }

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

// Speeds above are per frame at 60 fps; other frame rates move the dots just as fast
const FRAME_MS = 1000 / 60
// Left alone the dots drift a fraction of a pixel per frame, which looks the same at 30 fps
// for half the work; while the mouse stirs them or a ripple passes, at up to 60 fps
const CALM_MS = 32
const LIVELY_MS = 15
// In lite mode. Every redraw has the whole screen put together again, which is what a weak
// chip can't do 30 times a second; the slow drift and fading barely show the difference
const LITE_CALM_MS = 150

// Colors come from a small palette, in steps across the field and steps toward the ripple
// color, so a frame sets each color once instead of building one for every dot
const ACROSS = 24
const HIT = 8

// A worker without animation frames of its own falls back to a timer
const nextFrame: (cb: (now: number) => void) => number =
  typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb) => setTimeout(() => cb(performance.now()), FRAME_MS)
const cancelNextFrame: (id: number) => void = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

const palette = Array.from({ length: ACROSS * HIT }, (_, k) => {
  const across = Math.floor(k / HIT) / (ACROSS - 1)
  const hit = (k % HIT) / (HIT - 1)
  const [r, g, b] = mix(mix(SLATE, INDIGO, across), RIPPLE, hit * 0.7)
  return `rgb(${r},${g},${b})`
})

/**
 * A dense field of small, crisp, slowly drifting dots that fade in and out. Moving the mouse
 * gently stirs the dots near it along with it, and they settle back once it stops; a click
 * sends a ripple outward that pushes the dots out and back as it passes and briefly shifts
 * their color. Starts drawing with the first resize.
 */
export function createField(canvas: HTMLCanvasElement | OffscreenCanvas, reduced: boolean) {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
  if (!ctx) return null

  let particles: Particle[] = []
  let waves: Wave[] = []
  let w = 0
  let h = 0
  let frame = 0
  let last = 0 // when the field was last drawn
  let settling = false // stirred dots are still easing back onto their paths
  let covered = false
  let calmMs = CALM_MS
  // Mouse position and how far it moved since the last drawn frame
  const mouse = { x: -9999, y: -9999, dx: 0, dy: 0 }
  // The dots of the frame being drawn, grouped by palette color
  const buckets: Particle[][] = palette.map(() => [])

  const resize = (width: number, height: number, dpr: number) => {
    w = width
    h = height
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const count = Math.round(Math.min(900, (w * h) / 1500))
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
        cx: 0,
        cy: 0,
        alpha: 0,
      }
    })
  }

  // Moves the dots on by `step` frames and draws them
  const render = (now: number, step: number) => {
    ctx.clearRect(0, 0, w, h)
    waves = waves.filter((wv) => now - wv.start < WAVE_LIFE)
    // How far each ripple has traveled and how strong it still is
    const ripples = waves.map((wv) => {
      const age = now - wv.start
      return { x: wv.x, y: wv.y, reach: age * WAVE_SPEED, fade: (1 - age / WAVE_LIFE) ** 1.5 }
    })
    const stirring = Math.abs(mouse.dx) + Math.abs(mouse.dy) > 0.05
    const ease = 0.96 ** step
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
            const k = fall * fall * STIR_STRENGTH * (0.6 + p.r / 3)
            p.ox = Math.max(-STIR_MAX, Math.min(STIR_MAX, p.ox + mouse.dx * k))
            p.oy = Math.max(-STIR_MAX, Math.min(STIR_MAX, p.oy + mouse.dy * k))
          }
        }
        p.ox *= ease
        p.oy *= ease
        if (Math.abs(p.ox) + Math.abs(p.oy) > 0.3) settling = true
      }

      // Ripple: inside the moving band the dot swings out and back (one sine period),
      // weighted by a bell curve so the band has soft edges, fading as the wave ages.
      let dx = 0
      let dy = 0
      let hit = 0
      for (const wv of ripples) {
        const ex = p.x - wv.x
        const ey = p.y - wv.y
        const d = Math.sqrt(ex * ex + ey * ey) || 1
        const band = (d - wv.reach) / WAVE_WIDTH
        if (band < -2 || band > 2) continue
        const env = Math.exp(-band * band * 2) * wv.fade
        const swing = Math.sin(band * Math.PI) * env * WAVE_PUSH
        dx += (ex / d) * swing
        dy += (ey / d) * swing
        hit = Math.max(hit, env)
      }

      const breathe = reduced ? 0.8 : 0.5 + 0.5 * Math.sin(now * p.pulse + p.phase)
      p.alpha = Math.min(1, p.a * (0.1 + 0.9 * breathe) + hit * 0.3)
      if (p.alpha < 0.02) continue

      p.cx = p.x + p.ox + dx
      p.cy = p.y + p.oy + dy
      const across = Math.min(1, Math.max(0, p.x / w + p.tint))
      buckets[Math.round(across * (ACROSS - 1)) * HIT + Math.round(hit * (HIT - 1))].push(p)
    }

    for (let k = 0; k < buckets.length; k++) {
      const bucket = buckets[k]
      if (!bucket.length) continue
      ctx.fillStyle = palette[k]
      for (const p of bucket) {
        ctx.globalAlpha = p.alpha
        // Tiny dots look the same as squares and are much cheaper to draw
        if (p.r < 1.2) {
          ctx.fillRect(p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2)
        } else {
          ctx.beginPath()
          ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      bucket.length = 0
    }
    ctx.globalAlpha = 1
    // The movement has been used up; the next pointermove brings new
    mouse.dx = 0
    mouse.dy = 0
  }

  const tick = (now: number) => {
    frame = nextFrame(tick)
    if (covered) {
      mouse.dx = 0
      mouse.dy = 0
      return
    }
    const lively = waves.length > 0 || settling || mouse.dx !== 0 || mouse.dy !== 0
    if (now - last < (lively ? LIVELY_MS : calmMs)) return
    // After a long gap (covered, tab in the background) the dots don't jump ahead
    const step = Math.min(now - last, 100) / FRAME_MS
    last = now
    render(now, step)
  }

  return {
    handle(msg: FieldMessage) {
      switch (msg.type) {
        case 'resize':
          resize(msg.w, msg.h, msg.dpr)
          if (reduced) render(performance.now(), 0)
          else if (!frame) frame = nextFrame(tick)
          break
        case 'move':
          if (mouse.x > -9999) {
            mouse.dx += msg.x - mouse.x
            mouse.dy += msg.y - mouse.y
          }
          mouse.x = msg.x
          mouse.y = msg.y
          break
        case 'click':
          if (reduced) break
          waves.push({ x: msg.x, y: msg.y, start: performance.now() })
          if (waves.length > 4) waves.shift()
          break
        case 'covered':
          covered = msg.covered
          break
        case 'lite':
          calmMs = msg.on ? LITE_CALM_MS : CALM_MS
          break
      }
    },
    stop() {
      cancelNextFrame(frame)
    },
  }
}
