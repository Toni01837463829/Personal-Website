// A GT3 lap simulated from first principles, so the telemetry on the sim-racing screen
// behaves like the real thing: braking limited by grip and downforce, trail braking from
// the friction circle, power-limited acceleration fighting drag, gears and revs from the
// gearbox. The track is Spa-Francorchamps, from OpenStreetMap (© OpenStreetMap
// contributors, ODbL); elevation is left out. Two laps are driven on it, a best lap and a
// later lap with a few typical mistakes, which the analysis then finds again.

import spa from './spa.json' with { type: 'json' }

const G = 9.81
const DS = 5 // meters between samples

// Car: roughly a GT3 (≈410 kW, 1350 kg with driver)
const MASS = 1350
const POWER = 410_000
const CDA = 1.25 // drag area, m²
const RHO = 1.2
const TYRE_R = 0.34
const WHEELBASE = 2.6
const STEER_RATIO = 13
const GEARS = [9.6, 7.3, 5.9, 4.9, 4.0, 3.31] // overall ratios incl. final drive
const SHIFT_UP = 7600
const SHIFT_DOWN = 6900

const drag = (v: number) => (0.5 * RHO * CDA * v * v) / MASS
const LAT_MECH = 1.35
const LAT_AERO = 0.00008 // extra g per (m/s)² from downforce
const latGrip = (v: number) => G * (LAT_MECH + LAT_AERO * v * v)
const brakeGrip = (v: number) => G * (1.45 + 0.0001 * v * v)
const drive = (v: number) => Math.min(POWER / (MASS * Math.max(v, 5)), 1.0 * G)

export type Corner = { name: string; start: number; end: number }

const START_BEFORE_LA_SOURCE = 250 // meters: the start/finish line sits on the run down to La Source

/**
 * Samples every DS meters around Spa: position for the map, curvature (1/m, + = left) for
 * the physics, and the corners found in it, named after the track section they are in.
 */
function buildTrack() {
  const src = spa.points as [number, number][]
  const sectionAt = (i: number) => [...(spa.names as [number, string][])].reverse().find(([from]) => from <= i)?.[1] as string

  // Walk the closed outline and drop a point every DS meters
  const segLen = src.map((p, i) => Math.hypot(src[(i + 1) % src.length][0] - p[0], src[(i + 1) % src.length][1] - p[1]))
  const total = segLen.reduce((s, l) => s + l, 0)
  const n = Math.round(total / DS)
  const step = total / n
  const pts: [number, number][] = []
  const section: string[] = []
  let seg = 0
  let along = 0 // start of the current segment, in meters
  for (let k = 0; k < n; k++) {
    const at = (k * step - START_BEFORE_LA_SOURCE + total) % total
    if (at < along) {
      seg = 0
      along = 0
    }
    while (along + segLen[seg] < at) along += segLen[seg++]
    const f = (at - along) / segLen[seg]
    const [ax, ay] = src[seg]
    const [bx, by] = src[(seg + 1) % src.length]
    pts.push([ax + (bx - ax) * f, ay + (by - ay) * f])
    section.push(sectionAt(seg))
  }

  // The outline only has a point every ~20 m; smooth it before taking angles
  const wrap = (i: number) => (i + n) % n
  const soft = pts.map((_, i) => {
    let sx = 0
    let sy = 0
    for (let j = -4; j <= 4; j++) {
      sx += pts[wrap(i + j)][0]
      sy += pts[wrap(i + j)][1]
    }
    return [sx / 9, sy / 9] as [number, number]
  })
  const heading = soft.map((_, i) => {
    const [ax, ay] = soft[wrap(i - 2)]
    const [bx, by] = soft[wrap(i + 2)]
    return Math.atan2(by - ay, bx - ax)
  })
  const raw = heading.map((_, i) => {
    let d = heading[wrap(i + 1)] - heading[wrap(i - 1)]
    if (d > Math.PI) d -= 2 * Math.PI
    if (d < -Math.PI) d += 2 * Math.PI
    return d / (2 * DS)
  })
  const centre = smooth(raw, 4)

  // Eau Rouge / Raidillon is a compression: the dip presses the car into the road, which
  // the flat model can't see, so it gets the grip back here
  const grip = section.map((s) => (s === 'Eau Rouge' || s === 'Raidillon' ? 1.9 : 1))

  // Corners: stretches tighter than a 400 m radius, short gaps between them bridged
  const corners: Corner[] = []
  for (let i = 0; i < n; i++) {
    if (Math.abs(centre[i]) < 1 / 400) continue
    const last = corners[corners.length - 1]
    if (last && i - last.end <= 6) last.end = i
    else corners.push({ name: '', start: i, end: i })
  }
  const kept = corners.filter((c) => c.end - c.start >= 3)
  for (const c of kept) c.name = section[Math.round((c.start + c.end) / 2)]

  // The racing line uses the track width: a kink can be nearly straightened, a hairpin
  // hardly at all. Turning by θ on a track W wide allows a radius of about
  // R + W / (1 − cos(θ/2)), so each corner is opened up by that much.
  const W = 7
  const line = centre.slice()
  for (const c of kept) {
    let theta = 0
    for (let i = c.start; i <= c.end; i++) theta += Math.abs(centre[i]) * DS
    const r = ((c.end - c.start + 1) * DS) / theta
    const factor = r / (r + W / (1 - Math.cos(Math.min(theta, Math.PI) / 2)))
    for (let i = c.start; i <= c.end; i++) line[i] *= factor
  }
  const curvature = smooth(line, 3)

  // For the analysis: kinks that are taken flat aren't corners, corners OSM splits in two
  // become one, and they go by the names drivers use
  const rename: Record<string, string> = {
    Raidillon: 'Eau Rouge',
    'Double Gauche': 'Pouhon',
    'Courbe Paul Frère': 'Paul Frère',
    Chicane: 'Bus Stop',
  }
  const named: Corner[] = []
  for (const c of kept) {
    const tightest = Math.max(...line.slice(c.start, c.end + 1).map(Math.abs))
    if (1 / tightest > 600) continue
    const name = rename[c.name] ?? c.name
    const last = named[named.length - 1]
    if (last && last.name === name) last.end = c.end
    else named.push({ ...c, name })
  }

  return { curvature, corners: named, map: pts, grip }
}

export const track = buildTrack()
export const N = track.curvature.length
export const LAP_M = N * DS
export const distance = (i: number) => i * DS

/** Per-sample factors on grip/braking/traction, to make a lap worse (or better) in places. */
type Style = { lat: number[]; brake: number[]; traction: number[] }

function solveLap(style: Style) {
  const { curvature } = track
  // Highest speed each sample allows in steady cornering: v²κ = latGrip(v)
  const limit = curvature.map((k, i) => {
    const kk = Math.abs(k)
    const grip = style.lat[i] * track.grip[i]
    const den = kk - G * LAT_AERO * grip
    return den <= 0 ? 120 : Math.min(120, Math.sqrt((G * LAT_MECH * grip) / den))
  })
  // Longitudinal grip left over while cornering (friction circle)
  const left = (v: number, i: number) => {
    const used = (v * v * Math.abs(curvature[i])) / (latGrip(v) * style.lat[i] * track.grip[i])
    return Math.sqrt(Math.max(0.05, 1 - used * used))
  }

  // Acceleration pass, twice around so the start speed matches the end
  const v = limit.slice()
  let cur = limit[0]
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < N; i++) {
      cur = Math.min(cur, limit[i])
      v[i] = pass ? Math.min(v[i], cur) : cur
      const a = drive(cur) * style.traction[i] * left(cur, i) - drag(cur)
      cur = Math.sqrt(Math.max(1, cur * cur + 2 * a * DS))
    }
  // Braking pass, backwards
  cur = v[0]
  for (let pass = 0; pass < 2; pass++)
    for (let j = N - 1; j >= 0; j--) {
      cur = Math.min(cur, v[j])
      v[j] = cur
      const a = brakeGrip(cur) * style.brake[j] * left(cur, j) + drag(cur)
      cur = Math.sqrt(cur * cur + 2 * a * DS)
    }

  // Channels
  const time: number[] = [0]
  for (let i = 1; i < N; i++) time.push(time[i - 1] + (2 * DS) / (v[i - 1] + v[i]))
  const lapTime = time[N - 1] + (2 * DS) / (v[N - 1] + v[0])

  const throttle: number[] = []
  const brake: number[] = []
  for (let i = 0; i < N; i++) {
    const a = (v[(i + 1) % N] ** 2 - v[i] ** 2) / (2 * DS)
    if (a < -drag(v[i]) - 0.3) {
      brake.push(Math.min(100, ((-a - drag(v[i])) / brakeGrip(v[i])) * 112))
      throttle.push(0)
    } else {
      throttle.push(Math.max(0, Math.min(100, ((a + drag(v[i])) / drive(v[i])) * 100)))
      brake.push(0)
    }
  }

  const gear: number[] = []
  const rpm: number[] = []
  let g = 1
  const revs = (s: number, gi: number) => (s / (2 * Math.PI * TYRE_R)) * 60 * GEARS[gi]
  for (let i = 0; i < N; i++) {
    while (g < 6 && revs(v[i], g - 1) > SHIFT_UP) g++
    while (g > 1 && revs(v[i], g - 2) < SHIFT_DOWN) g--
    gear.push(g)
    rpm.push(Math.max(3200, revs(v[i], g - 1)))
  }

  const steer = curvature.map((k, i) => {
    const latA = v[i] * v[i] * k
    return (Math.atan(WHEELBASE * k) + 0.0022 * latA) * STEER_RATIO * (180 / Math.PI)
  })
  const latG = curvature.map((k, i) => (v[i] * v[i] * k) / G)

  return {
    speed: v.map((s) => s * 3.6),
    time,
    lapTime,
    throttle: smooth(throttle, 3),
    brake: smooth(brake, 2),
    gear,
    rpm,
    steer: smooth(steer, 4),
    latG,
  }
}

function smooth(a: number[], r: number) {
  return a.map((_, i) => {
    let s = 0
    let c = 0
    for (let j = i - r; j <= i + r; j++) {
      if (j < 0 || j >= a.length) continue
      s += a[j]
      c++
    }
    return s / c
  })
}

export type Lap = ReturnType<typeof solveLap>

const ones = () => Array<number>(N).fill(1)

// Small, smooth, repeatable wobble: no two laps are driven exactly alike
function wobble(seed: number, amount: number) {
  let x = seed
  const rand = () => ((x = (x * 16807) % 2147483647) / 2147483647) * 2 - 1
  return smooth(
    Array.from({ length: N }, () => rand()),
    12,
  ).map((w) => 1 + w * amount)
}
const zone = (arr: number[], from: number, to: number, f: number) => {
  for (let i = Math.max(0, from); i <= Math.min(N - 1, to); i++) arr[i] = f
}
const corner = (name: string) => track.corners.find((c) => c.name === name)!

export const best = solveLap({ lat: wobble(11, 0.04), brake: wobble(12, 0.1), traction: ones() })

// The analysed lap: brakes too early into La Source, understeers through Pouhon, is lazy
// on the throttle out of Bruxelles, but carries more speed through Fagnes and brakes
// later into the Bus Stop.
const current = (() => {
  const lat = wobble(21, 0.04)
  const brakeF = wobble(22, 0.1)
  const traction = ones()
  const source = corner('La Source')
  const pouhon = corner('Pouhon')
  const bruxelles = corner('Bruxelles')
  const fagnes = corner('Fagnes')
  const busStop = corner('Bus Stop')
  zone(brakeF, source.start - 10, source.start, 0.8)
  zone(lat, pouhon.start, pouhon.end, 0.96)
  zone(traction, bruxelles.end - 4, bruxelles.end + 14, 0.7)
  zone(lat, fagnes.start, fagnes.end, 1.015)
  zone(brakeF, busStop.start - 8, busStop.start, 1.06)
  return solveLap({ lat, brake: brakeF, traction })
})()
export { current }

/** Time gained (−) or lost (+) against the best lap at every sample. */
export const delta = current.time.map((t, i) => t - best.time[i])

// Sector ends: at the end of the Kemmel straight and after Paul Frère
export const sectors = [corner('Les Combes').start - 30, corner('Paul Frère').end + 20, N - 1]

const sectorTimes = (lap: Lap) =>
  sectors.map((end, s) => (s === sectors.length - 1 ? lap.lapTime : lap.time[end]) - (s ? lap.time[sectors[s - 1]] : 0))
export const bestSectors = sectorTimes(best)
export const currentSectors = sectorTimes(current)

/** Theoretical best: the faster of both laps in each of 25 mini-sectors. */
export const idealLap = (() => {
  const parts = 25
  let sum = 0
  for (let k = 0; k < parts; k++) {
    const a = Math.round((k * N) / parts)
    const b = Math.round(((k + 1) * N) / parts)
    const span = (lap: Lap) => (b >= N ? lap.lapTime : lap.time[b]) - lap.time[a]
    sum += Math.min(span(best), span(current))
  }
  return sum
})()

/**
 * Per corner: braking point, minimum speed and time won or lost. Each corner owns the lap
 * from the middle of the straight before it to the middle of the one after, so the
 * corners add up to the whole lap.
 */
export const cornerReport = track.corners.map((c, ci, all) => {
  const prev = all[(ci + all.length - 1) % all.length]
  const next = all[(ci + 1) % all.length]
  const from = ci === 0 ? 0 : Math.round((prev.end + c.start) / 2)
  const to = ci === all.length - 1 ? N - 1 : Math.round((c.end + next.start) / 2)
  const minOf = (lap: Lap) => Math.min(...lap.speed.slice(c.start, c.end + 1))
  // Where the brake first passes 10 %, in meters, between samples
  const brakePoint = (lap: Lap) => {
    for (let i = Math.max(from, 1); i <= c.end; i++)
      if (lap.brake[i] > 10) return (i - 1 + (10 - lap.brake[i - 1]) / (lap.brake[i] - lap.brake[i - 1])) * DS
    return -1
  }
  const bpBest = brakePoint(best)
  const bpCur = brakePoint(current)
  return {
    name: c.name,
    apex: Math.round((c.start + c.end) / 2),
    minBest: minOf(best),
    minCur: minOf(current),
    brakeShift: bpBest < 0 || bpCur < 0 ? 0 : bpBest - bpCur, // meters, + = braked earlier
    timeLost: delta[to] - delta[from],
  }
})

export const fmtLap = (s: number) => {
  const m = Math.floor(s / 60)
  return `${m}:${(s - m * 60).toFixed(3).padStart(6, '0')}`
}
