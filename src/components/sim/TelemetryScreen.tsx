import { useInView, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef } from 'react'
import { best, bestSectors, cornerReport, current, currentSectors, delta, fmtLap, idealLap, LAP_M, N, sectors, track, type Lap } from '../../sim/lap'
import { useFrameLoop } from '../../useFrameLoop'
import { Panel } from './Screen'
import { ui } from './ui'

// Lap comparison in the style of a data-analysis tool: stacked channels over distance,
// track map coloured by where time is won or lost, sector breakdown.

const LABEL_W = 92
const PLOT_W = 744
const x = (i: number) => (i / (N - 1)) * PLOT_W

const scaleY = (v: number, h: number, lo: number, hi: number) => h - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * h
const line = (vals: number[], h: number, lo: number, hi: number) =>
  'M' + vals.map((v, i) => `${x(i).toFixed(1)},${scaleY(v, h, lo, hi).toFixed(1)}`).join('L')
const steps = (vals: number[], h: number, lo: number, hi: number) =>
  vals.map((v, i) => (i ? `H${x(i).toFixed(1)}V${scaleY(v, h, lo, hi).toFixed(1)}` : `M0,${scaleY(v, h, lo, hi).toFixed(1)}`)).join('')

type Channel = {
  label: string
  unit: string
  h: number
  lo: number
  hi: number
  grid: number[]
  pick: (lap: Lap) => number[]
  color: string
  fmt: (v: number) => string
  step?: boolean
}

const channels: Channel[] = [
  { label: 'Speed', unit: 'km/h', h: 150, lo: 60, hi: 300, grid: [100, 150, 200, 250], pick: (l) => l.speed, color: 'var(--accent-a)', fmt: (v) => v.toFixed(0) },
  { label: 'Throttle', unit: '%', h: 58, lo: 0, hi: 100, grid: [50], pick: (l) => l.throttle, color: 'var(--accent-a)', fmt: (v) => v.toFixed(0) },
  { label: 'Brake', unit: '%', h: 58, lo: 0, hi: 100, grid: [50], pick: (l) => l.brake, color: ui.loss, fmt: (v) => v.toFixed(0) },
  { label: 'Gear', unit: '', h: 52, lo: 0.5, hi: 6.5, grid: [2, 4, 6], pick: (l) => l.gear, color: 'var(--accent-a)', fmt: (v) => v.toFixed(0), step: true },
  { label: 'Steering', unit: '°', h: 64, lo: -90, hi: 90, grid: [0], pick: (l) => l.steer, color: 'var(--accent-a)', fmt: (v) => v.toFixed(0) },
  { label: 'Lat G', unit: 'g', h: 58, lo: -1.8, hi: 1.8, grid: [0], pick: (l) => l.latG, color: 'var(--accent-a)', fmt: (v) => v.toFixed(2) },
]
const DELTA = { h: 64, lo: -0.15, hi: 0.45 }

// Paths are the same for every render, so build them once
const paths = channels.map((c) => {
  const draw = c.step ? steps : line
  return { best: draw(c.pick(best), c.h, c.lo, c.hi), cur: draw(c.pick(current), c.h, c.lo, c.hi) }
})
const deltaLine = line(delta, DELTA.h, DELTA.lo, DELTA.hi)
const zeroY = scaleY(0, DELTA.h, DELTA.lo, DELTA.hi)
const deltaArea = `${deltaLine}L${PLOT_W},${zeroY}L0,${zeroY}Z`

// Short corner names for the chart and map; a label that would run into the one before
// it is left out
const shortNames: Record<string, string> = {
  'La Source': 'Source',
  'Eau Rouge': 'Eau Rouge',
  'Les Combes': 'Combes',
  Malmedy: 'Malmedy',
  Bruxelles: 'Bruxelles',
  "Speaker's Corner": 'Speaker',
  Pouhon: 'Pouhon',
  Fagnes: 'Fagnes',
  Campus: 'Campus',
  'Paul Frère': 'P. Frère',
  Blanchimont: 'Blanch.',
  'Bus Stop': 'Bus Stop',
}
const short = (name: string) => shortNames[name] ?? name
const turnLabels = cornerReport.reduce<{ name: string; x: number }[]>((out, c) => {
  const last = out[out.length - 1]
  if (!last || x(c.apex) - last.x > 44) out.push({ name: short(c.name), x: x(c.apex) })
  return out
}, [])

const signed = (v: number, digits = 3) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(digits)}`

/** Index on the analysed lap at a given lap time (binary search). */
function indexAt(t: number) {
  let lo = 0
  let hi = N - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (current.time[mid] < t) lo = mid + 1
    else hi = mid
  }
  return lo
}

export function TelemetryScreen() {
  const id = useId()
  const reduced = useReducedMotion()
  const cursor = useRef<HTMLDivElement>(null)
  const dot = useRef<SVGCircleElement>(null)
  const readouts = useRef<(HTMLSpanElement | null)[]>([])
  const distRef = useRef<HTMLSpanElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const visible = useInView(root)
  const shown = useRef(-1)

  // Moves the cursor to sample i. Text is only touched where it changes, as every change
  // means laying the text out again
  const show = (i: number) => {
    if (i === shown.current || !cursor.current) return
    shown.current = i
    cursor.current.style.transform = `translateX(${x(i)}px)`
    const [mx, my] = mapPoint(i)
    dot.current?.setAttribute('cx', mx.toFixed(1))
    dot.current?.setAttribute('cy', my.toFixed(1))
    // Changes the text node in place rather than replacing it, which is cheaper to lay out
    const set = (el: HTMLElement | null, text: string) => {
      if (!el) return
      if (el.firstChild instanceof Text) {
        if (el.firstChild.data !== text) el.firstChild.data = text
      } else el.textContent = text
    }
    channels.forEach((c, k) => set(readouts.current[k], `${c.fmt(c.pick(current)[i])} / ${c.fmt(c.pick(best)[i])}`))
    set(readouts.current[channels.length], signed(delta[i]))
    set(distRef.current, `${(i * (LAP_M / N)).toFixed(0)} m`)
  }

  // A cursor replays the lap at 4× speed: slow through corners, fast down the straights.
  // It only runs while the screen is in view, and moves at 30 fps (it covers a few px a
  // second, so that looks the same at half the work); with reduced motion it stands still
  const moved = useRef(-Infinity)
  useFrameLoop(visible && !reduced, (t) => {
    if (t - moved.current < 30) return
    moved.current = t
    show(indexAt(((t / 1000) * 4) % current.lapTime))
  })
  useEffect(() => {
    if (reduced) show(Math.round(N * 0.36))
  })


  return (
    <div ref={root} className="flex h-full w-full flex-col gap-3 p-4 text-[12px]" style={{ background: ui.bg, color: ui.text }}>
      {/* Header */}
      <div className="flex items-center gap-5">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: ui.dim }}>
            Telemetry Analysis
          </p>
          <p className="text-[15px] font-semibold">Spa-Francorchamps · GT3 · Race · Dry</p>
        </div>
        <div className="ml-auto flex items-center gap-2" style={{ fontFamily: ui.mono }}>
          <span className="flex items-center gap-2 rounded border px-2.5 py-1" style={{ borderColor: ui.line }}>
            <span className="h-0.5 w-4" style={{ background: 'var(--accent-a)' }} />
            Lap 14 <b>{fmtLap(current.lapTime)}</b>
          </span>
          <span className="flex items-center gap-2 rounded border px-2.5 py-1" style={{ borderColor: ui.line, color: ui.best }}>
            <span className="h-0.5 w-4" style={{ background: ui.best }} />
            Best R9 <b>{fmtLap(best.lapTime)}</b>
          </span>
          <span className="rounded px-2.5 py-1 font-bold" style={{ background: '#ef444422', color: ui.loss }}>
            Δ {signed(current.lapTime - best.lapTime)} s
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        {/* Channels over distance */}
        <Panel
          title="Channels · Lap 14 vs. Best"
          right={
            <span style={{ fontFamily: ui.mono }}>
              Cursor <span ref={distRef}>0 m</span>
            </span>
          }
          className="w-[852px] shrink-0"
        >
          <div className="relative px-2 pt-1">
            {/* Turn and sector markers across all channels */}
            <div className="relative h-4" style={{ marginLeft: LABEL_W, width: PLOT_W }}>
              {turnLabels.map((t) => (
                <span key={t.name} className="absolute -translate-x-1/2 text-[9px] whitespace-nowrap" style={{ left: t.x, color: ui.dim }}>
                  {t.name}
                </span>
              ))}
            </div>
            <svg className="pointer-events-none absolute top-5 bottom-6" style={{ left: 8 + LABEL_W, width: PLOT_W, height: 'calc(100% - 44px)' }}>
              {cornerReport.map((c) => (
                <line key={c.name} x1={x(c.apex)} x2={x(c.apex)} y1="0" y2="100%" stroke="#ffffff10" strokeDasharray="2 3" />
              ))}
              {sectors.slice(0, 2).map((s) => (
                <line key={s} x1={x(s)} x2={x(s)} y1="0" y2="100%" stroke="#ffffff30" />
              ))}
            </svg>

            {channels.map((c, k) => (
              <Strip key={c.label} label={c.label} unit={c.unit} h={c.h} readout={(el) => (readouts.current[k] = el)}>
                {c.grid.map((g) => (
                  <line key={g} x1="0" x2={PLOT_W} y1={scaleY(g, c.h, c.lo, c.hi)} y2={scaleY(g, c.h, c.lo, c.hi)} stroke={ui.grid} />
                ))}
                <path d={paths[k].best} fill="none" stroke={ui.best} strokeOpacity="0.55" strokeWidth="1" />
                <path d={paths[k].cur} fill="none" stroke={c.color} strokeWidth="1.3" />
              </Strip>
            ))}

            <Strip label="Delta" unit="s" h={DELTA.h} readout={(el) => (readouts.current[channels.length] = el)}>
              <defs>
                <clipPath id={`${id}-above`}>
                  <rect x="0" y="0" width={PLOT_W} height={zeroY} />
                </clipPath>
                <clipPath id={`${id}-below`}>
                  <rect x="0" y={zeroY} width={PLOT_W} height={DELTA.h - zeroY} />
                </clipPath>
              </defs>
              <path d={deltaArea} fill={ui.loss} fillOpacity="0.22" clipPath={`url(#${id}-above)`} />
              <path d={deltaArea} fill={ui.gain} fillOpacity="0.25" clipPath={`url(#${id}-below)`} />
              <line x1="0" x2={PLOT_W} y1={zeroY} y2={zeroY} stroke="#ffffff40" />
              <path d={deltaLine} fill="none" stroke={ui.text} strokeWidth="1.2" />
            </Strip>

            {/* Distance axis */}
            <div className="relative mt-1 h-4" style={{ marginLeft: LABEL_W, width: PLOT_W, fontFamily: ui.mono }}>
              {[0, 1000, 2000, 3000, 4000, 5000, 6000].map((m) => (
                <span key={m} className="absolute -translate-x-1/2 text-[9px]" style={{ left: (m / LAP_M) * PLOT_W, color: ui.dim }}>
                  {m}
                </span>
              ))}
              <span className="absolute right-0 text-[9px]" style={{ color: ui.dim }}>
                m
              </span>
            </div>

            <div
              ref={cursor}
              className="pointer-events-none absolute top-5 bottom-6 w-px"
              style={{ left: 8 + LABEL_W, background: '#ffffffaa', boxShadow: '0 0 6px #ffffff55' }}
            />
          </div>
        </Panel>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Panel title="Track · time gained / lost" right={<span className="normal-case tracking-normal">© OpenStreetMap</span>} className="flex-1">
            <TrackMap dotRef={dot} />
          </Panel>

          <Panel title="Sectors">
            <table className="w-full text-right" style={{ fontFamily: ui.mono }}>
              <thead style={{ color: ui.dim }}>
                <tr className="text-[10px]">
                  <th className="py-1 pl-3 text-left font-normal">Sector</th>
                  <th className="font-normal">Best</th>
                  <th className="font-normal">Lap 14</th>
                  <th className="pr-3 font-normal">Δ</th>
                </tr>
              </thead>
              <tbody>
                {bestSectors.map((b, k) => {
                  const d = currentSectors[k] - b
                  return (
                    <tr key={k} className="border-t" style={{ borderColor: ui.line }}>
                      <td className="py-1 pl-3 text-left">S{k + 1}</td>
                      <td style={{ color: ui.best }}>{b.toFixed(3)}</td>
                      <td>{currentSectors[k].toFixed(3)}</td>
                      <td className="pr-3" style={{ color: d > 0 ? ui.loss : ui.gain }}>
                        {signed(d)}
                      </td>
                    </tr>
                  )
                })}
                <tr className="border-t" style={{ borderColor: ui.line, color: ui.dim }}>
                  <td className="py-1 pl-3 text-left">Ideal (mini sectors)</td>
                  <td colSpan={2}>{fmtLap(idealLap)}</td>
                  <td className="pr-3">{signed(idealLap - best.lapTime)}</td>
                </tr>
              </tbody>
            </table>
          </Panel>

        </div>
      </div>
    </div>
  )
}

function Strip({
  label,
  unit,
  h,
  readout,
  children,
}: {
  label: string
  unit: string
  h: number
  readout: (el: HTMLSpanElement | null) => void
  children: React.ReactNode
}) {
  return (
    <div className="flex items-stretch border-b" style={{ borderColor: ui.line }}>
      <div className="flex shrink-0 flex-col justify-center pr-2" style={{ width: LABEL_W }}>
        <span className="text-[10px] font-semibold" style={{ color: ui.dim }}>
          {label} {unit && <span className="font-normal">[{unit}]</span>}
        </span>
        <span ref={readout} className="text-[11px]" style={{ fontFamily: ui.mono }} />
      </div>
      <svg width={PLOT_W} height={h} className="my-1 block overflow-visible">
        {children}
      </svg>
    </div>
  )
}


// Map: the track scaled into the panel, y flipped so right turns look like right turns
const MAP_W = 360
const MAP_H = 380
const bounds = (() => {
  const xs = track.map.map((p) => p[0])
  const ys = track.map.map((p) => -p[1])
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
})()
const mapScale = Math.min((MAP_W - 40) / (bounds.maxX - bounds.minX), (MAP_H - 30) / (bounds.maxY - bounds.minY))
const offX = (MAP_W - (bounds.maxX - bounds.minX) * mapScale) / 2
const offY = (MAP_H - (bounds.maxY - bounds.minY) * mapScale) / 2
const mapPoint = (i: number): [number, number] => {
  const [px, py] = track.map[i]
  return [offX + (px - bounds.minX) * mapScale, offY + (-py - bounds.minY) * mapScale]
}

// Track split into short pieces, each coloured by how much time it won or lost
const PIECE = 12
const pieces = Array.from({ length: Math.ceil(N / PIECE) }, (_, k) => {
  const from = k * PIECE
  const to = Math.min(N - 1, from + PIECE)
  const d = delta[to] - delta[from]
  const pts = Array.from({ length: to - from + 1 }, (_, j) => mapPoint(from + j))
  const color = d > 0.004 ? ui.loss : d < -0.004 ? ui.gain : '#5b6573'
  const opacity = Math.min(1, 0.45 + Math.abs(d) * 25)
  return { d: 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L'), color, opacity }
})
const outline = 'M' + track.map.map((_, i) => mapPoint(i).map((v) => v.toFixed(1)).join(',')).join('L') + 'Z'
const center = (() => {
  const pts = track.map.map((_, i) => mapPoint(i))
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
})()

function TrackMap({ dotRef }: { dotRef: React.RefObject<SVGCircleElement | null> }) {
  const [sx, sy] = mapPoint(0)
  return (
    <svg width={MAP_W} height={MAP_H} className="mx-auto block">
      <path d={outline} fill="none" stroke="#05070a" strokeWidth="9" strokeLinejoin="round" />
      {pieces.map((p, k) => (
        <path key={k} d={p.d} fill="none" stroke={p.color} strokeOpacity={p.opacity} strokeWidth="4" strokeLinecap="round" />
      ))}
      <line x1={sx} y1={sy - 7} x2={sx} y2={sy + 7} stroke={ui.text} strokeWidth="2" />
      {track.corners.map((c) => {
        const [ax, ay] = mapPoint(Math.round((c.start + c.end) / 2))
        const dx = ax - center[0]
        const dy = ay - center[1]
        const len = Math.hypot(dx, dy) || 1
        return (
          <text key={c.name} x={ax + (dx / len) * 14} y={ay + (dy / len) * 14 + 3} fontSize="9" fill={ui.dim} textAnchor="middle">
            {short(c.name)}
          </text>
        )
      })}
      <circle ref={dotRef} r="4.5" fill="var(--accent-a)" stroke={ui.bg} strokeWidth="2" />
    </svg>
  )
}
