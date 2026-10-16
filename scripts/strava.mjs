// Turns a Strava account export into the small data file the site uses (src/data/strava.json).
//
//   npm run strava [-- path/to/export_folder]
//
// Picks the longest activities per sport (by moving time) and keeps only what the site shows:
// name, date, stats, an elevation profile and the route's shape. Routes lose their first and
// last kilometer and are stored as plain x/y points without any coordinates, so they can't be
// traced back to where an activity started.

import { Decoder, Stream } from '@garmin/fitsdk'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const PICK = { bike: 8, run: 6, swim: 6 }
const TRIM_M = 1000
const BOX = 1000 // routes are scaled to fit 0..BOX on their longer side
const PROFILE_POINTS = 80
const OUT = 'src/data/strava.json'

const dir = process.argv[2] ?? fs.readdirSync('.').find((d) => d.startsWith('export_'))
if (!dir || !fs.existsSync(path.join(dir, 'activities.csv'))) {
  console.error('No Strava export found. Pass the folder: npm run strava -- export_123')
  process.exit(1)
}

const sports = { Radfahrt: 'bike', Lauf: 'run', Schwimmen: 'swim', Ride: 'bike', Run: 'run', Swim: 'swim' }

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += c
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') field += c
  }
  if (field || row.length) rows.push([...row, field])
  return rows
}

// Columns by position: the header names repeat and depend on the account language
const [, ...rows] = parseCsv(fs.readFileSync(path.join(dir, 'activities.csv'), 'utf8'))
const all = rows
  .filter((r) => sports[r[3]])
  .map((r) => ({
    id: r[0],
    sport: sports[r[3]],
    name: r[2],
    date: r[1].replace(/^(\d+)\.(\d+)\.(\d+).*/, '$3-$2-$1'),
    file: r[12],
    movingTime: Math.round(Number(r[16]) || Number(r[5])),
    distance: Math.round(Number(r[17])),
    elevationGain: Number(r[20]) ? Math.round(Number(r[20])) : undefined,
    avgHr: Number(r[31]) ? Math.round(Number(r[31])) : undefined,
  }))

const picked = Object.entries(PICK).flatMap(([sport, n]) =>
  all
    .filter((a) => a.sport === sport)
    .sort((a, b) => b.movingTime - a.movingTime)
    .slice(0, n),
)

const toDeg = (semicircles) => semicircles * (180 / 2 ** 31)

function haversine([lat1, lon1], [lat2, lon2]) {
  const r = (d) => (d * Math.PI) / 180
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2
  return 12742000 * Math.asin(Math.sqrt(a))
}

// Douglas-Peucker: drops points that barely change the line's shape
function simplify(pts, tolerance) {
  if (pts.length < 3) return pts
  const [ax, ay] = pts[0]
  const [bx, by] = pts[pts.length - 1]
  const len = Math.hypot(bx - ax, by - ay) || 1
  let max = 0
  let at = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i]
    const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len
    if (d > max) {
      max = d
      at = i
    }
  }
  if (max <= tolerance) return [pts[0], pts[pts.length - 1]]
  return [...simplify(pts.slice(0, at + 1), tolerance).slice(0, -1), ...simplify(pts.slice(at), tolerance)]
}

function readFit(file) {
  const buf = zlib.gunzipSync(fs.readFileSync(path.join(dir, file)))
  const { messages } = new Decoder(Stream.fromByteArray(buf)).read()
  return messages.recordMesgs ?? []
}

function shapeOf(records) {
  const pts = records
    .filter((r) => r.positionLat != null && r.positionLong != null)
    .map((r) => [toDeg(r.positionLat), toDeg(r.positionLong)])
  if (pts.length < 20) return undefined

  // Distance along the track, then cut the ends
  const along = [0]
  for (let i = 1; i < pts.length; i++) along.push(along[i - 1] + haversine(pts[i - 1], pts[i]))
  const total = along[along.length - 1]
  const kept = pts.filter((_, i) => along[i] >= TRIM_M && along[i] <= total - TRIM_M)
  if (kept.length < 20) return undefined

  // Flat projection around the route's middle, y pointing down, scaled into the box
  const lat0 = kept.reduce((s, p) => s + p[0], 0) / kept.length
  const k = Math.cos((lat0 * Math.PI) / 180)
  const xy = kept.map(([lat, lon]) => [lon * k, -lat])
  const minX = Math.min(...xy.map((p) => p[0]))
  const minY = Math.min(...xy.map((p) => p[1]))
  const span = Math.max(...xy.map((p) => p[0] - minX), ...xy.map((p) => p[1] - minY))
  const scaled = xy.map(([x, y]) => [((x - minX) / span) * BOX, ((y - minY) / span) * BOX])
  return simplify(scaled, 1.5).map(([x, y]) => [Math.round(x), Math.round(y)])
}

function profileOf(records) {
  const alt = records.map((r) => r.enhancedAltitude ?? r.altitude).filter((v) => v != null)
  if (alt.length < PROFILE_POINTS) return undefined
  return Array.from({ length: PROFILE_POINTS }, (_, i) => Math.round(alt[Math.floor((i / (PROFILE_POINTS - 1)) * (alt.length - 1))]))
}

const out = picked
  .map(({ file, ...a }) => {
    const records = file ? readFit(file) : []
    return { ...a, route: shapeOf(records), elevation: a.sport === 'swim' ? undefined : profileOf(records) }
  })
  .sort((a, b) => b.date.localeCompare(a.date))

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(out) + '\n')
console.log(`Wrote ${out.length} activities to ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`)
for (const a of out)
  console.log(
    `  ${a.date}  ${a.sport.padEnd(4)}  ${(a.movingTime / 3600).toFixed(2)} h  ${(a.distance / 1000).toFixed(1)} km  ${a.route?.length ?? '-'} pts  ${a.name}`,
  )
