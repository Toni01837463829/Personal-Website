import { Panel } from './Screen'
import { ui } from './ui'

// A GT3 race setup laid out like a garage screen: tyres per corner with the temperatures
// across the tread after a stint, mechanical grip, dampers, aero, electronics, fuel and
// strategy.

const tyres = [
  { pos: 'FL', cold: 20.6, hot: 26.6, temps: [88, 84, 79], camber: -3.8, toe: -0.06, wear: 96.8, brake: 612 },
  { pos: 'FR', cold: 20.6, hot: 26.9, temps: [91, 86, 80], camber: -3.8, toe: -0.06, wear: 96.4, brake: 640 },
  { pos: 'RL', cold: 20.2, hot: 26.3, temps: [85, 83, 80], camber: -3.0, toe: 0.1, wear: 97.9, brake: 455 },
  { pos: 'RR', cold: 20.2, hot: 26.5, temps: [86, 84, 81], camber: -3.0, toe: 0.1, wear: 97.6, brake: 470 },
]
const HOT_WINDOW: [number, number] = [26.0, 27.0]

type Row = { label: string; value: string; pos?: number } // pos: 0..1 within the allowed range

const mechanical: Row[] = [
  { label: 'ARB front', value: '5', pos: 5 / 10 },
  { label: 'ARB rear', value: '2', pos: 2 / 10 },
  { label: 'Wheel rate front', value: '136 N/mm', pos: 0.36 },
  { label: 'Wheel rate rear', value: '121 N/mm', pos: 0.21 },
  { label: 'Bumpstop rate f / r', value: '500 / 400 N', pos: 0.17 },
  { label: 'Bumpstop range f / r', value: '18 / 39 mm', pos: 0.3 },
  { label: 'Diff preload', value: '80 Nm', pos: 0.21 },
  { label: 'Brake bias', value: '56.8 %', pos: 0.34 },
  { label: 'Brake ducts f / r', value: '3 / 2', pos: 0.5 },
  { label: 'Caster', value: '12.6°', pos: 0.55 },
  { label: 'Steering ratio', value: '13 : 1', pos: 0.4 },
]

const dampers = {
  cols: ['FL', 'FR', 'RL', 'RR'],
  rows: [
    { label: 'Bump', v: [7, 7, 5, 5] },
    { label: 'Fast Bump', v: [6, 6, 8, 8] },
    { label: 'Rebound', v: [10, 10, 11, 11] },
    { label: 'Fast Rebound', v: [8, 8, 9, 9] },
  ],
}

const aero: Row[] = [
  { label: 'Ride height front', value: '53 mm', pos: 0.08 },
  { label: 'Ride height rear', value: '69 mm', pos: 0.48 },
  { label: 'Rake', value: '16 mm' },
  { label: 'Rear wing', value: '8', pos: 8 / 12 },
  { label: 'Splitter', value: '0', pos: 0 },
]

const electronics: Row[] = [
  { label: 'TC 1', value: '3', pos: 3 / 11 },
  { label: 'TC 2 (Cut)', value: '4', pos: 4 / 11 },
  { label: 'ABS', value: '3', pos: 3 / 11 },
  { label: 'Engine map', value: '1', pos: 0 },
]

const FUEL_PER_LAP = 2.94
const strategy: Row[] = [
  { label: 'Fuel load', value: '72 L', pos: 0.6 },
  { label: 'Consumption', value: `${FUEL_PER_LAP.toFixed(2)} L/lap` },
  { label: 'Range', value: `${Math.floor(72 / FUEL_PER_LAP)} laps` },
  { label: 'Tyre set / pads', value: '3 / 1' },
]

// 70 °C blue → 85 °C green → 100 °C red
function heat(t: number) {
  const f = Math.max(0, Math.min(1, (t - 70) / 30))
  const hue = f < 0.5 ? 210 - f * 2 * 90 : 120 - (f - 0.5) * 2 * 120
  return `hsl(${hue} 70% 45%)`
}

export function SetupScreen() {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-4 text-[12px]" style={{ background: ui.bg, color: ui.text }}>
      <div className="flex items-center gap-5">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: ui.dim }}>
            Car Setup
          </p>
          <p className="text-[15px] font-semibold">Spa-Francorchamps · GT3 · Race · Dry</p>
        </div>
        <div className="ml-auto flex items-center gap-2" style={{ fontFamily: ui.mono, color: ui.dim }}>
          <span className="rounded border px-2.5 py-1" style={{ borderColor: ui.line }}>
            race_dry_v7.json
          </span>
          <span className="rounded border px-2.5 py-1" style={{ borderColor: ui.line }}>
            Track 31 °C · Air 22 °C
          </span>
          <span className="rounded border px-2.5 py-1" style={{ borderColor: ui.line }}>
            Data after 12 laps
          </span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[420px_1fr_1fr] gap-3">
        <Panel title="Tyres" right={<span style={{ fontFamily: ui.mono }}>Hot target 26.0–27.0 psi</span>}>
          <div className="flex h-full flex-col">
            <div className="grid grid-cols-2 gap-2 p-2">
              {tyres.map((t) => (
                <TyreCard key={t.pos} {...t} />
              ))}
            </div>
            <PressureChart />
          </div>
        </Panel>

        <div className="flex min-h-0 flex-col gap-3">
          <Panel title="Mechanical">
            <Rows rows={mechanical} />
          </Panel>
          <Panel title="Dampers · clicks" className="flex-1">
            <table className="w-full text-right" style={{ fontFamily: ui.mono }}>
              <thead style={{ color: ui.dim }}>
                <tr className="text-[10px]">
                  <th />
                  {dampers.cols.map((c) => (
                    <th key={c} className="py-1 pr-3 font-normal">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dampers.rows.map((r) => (
                  <tr key={r.label} className="border-t" style={{ borderColor: ui.line }}>
                    <td className="py-[5px] pl-3 text-left" style={{ fontFamily: 'inherit', color: ui.dim }}>
                      {r.label}
                    </td>
                    {r.v.map((v, k) => (
                      <td key={k} className="pr-3">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Panel title="Aero">
              <Rows rows={aero} compact />
            </Panel>
            <Panel title="Electronics">
              <Rows rows={electronics} compact />
            </Panel>
          </div>
          <Panel title="Fuel & Strategy">
            <Rows rows={strategy} compact />
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Rows({ rows, compact }: { rows: Row[]; compact?: boolean }) {
  return (
    <ul className="px-3 py-1">
      {rows.map((r) => (
        <li key={r.label} className={`flex items-center gap-3 ${compact ? 'py-[3px]' : 'py-[4px]'}`}>
          <span className="flex-1 truncate" style={{ color: ui.dim }}>
            {r.label}
          </span>
          {r.pos !== undefined && !compact && (
            <span className="relative h-1 w-20 rounded-full" style={{ background: ui.grid }}>
              <span className="absolute top-1/2 h-2.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm" style={{ left: `${r.pos * 100}%`, background: ui.text }} />
            </span>
          )}
          <span className="shrink-0 text-right" style={{ fontFamily: ui.mono, minWidth: compact ? 0 : 96 }}>
            {r.value}
          </span>
        </li>
      ))}
    </ul>
  )
}

function TyreCard({ pos, cold, hot, temps, camber, toe, wear, brake }: (typeof tyres)[number]) {
  const inWindow = hot >= HOT_WINDOW[0] && hot <= HOT_WINDOW[1]
  // Inner edge faces the middle of the car: right for left tyres, left for right tyres
  const left = pos.endsWith('L')
  const order = left ? [2, 1, 0] : [0, 1, 2]
  const labels = ['I', 'M', 'O']
  return (
    <div className="rounded border p-2.5" style={{ borderColor: ui.line, background: '#0c1117' }}>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold">{pos}</span>
        <span className="text-[10px]" style={{ color: ui.dim, fontFamily: ui.mono }}>
          Wear {wear.toFixed(1)} %
        </span>
      </div>

      <div className="mt-2 flex gap-0.5">
        {order.map((k) => (
          <div key={k} className="flex-1 rounded-sm py-1.5 text-center" style={{ background: heat(temps[k]) }}>
            <div className="text-[13px] font-semibold text-white" style={{ fontFamily: ui.mono }}>
              {temps[k]}
            </div>
            <div className="text-[9px] text-white/70">{labels[k]}</div>
          </div>
        ))}
      </div>

      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-2 gap-y-[3px] text-[11px]" style={{ fontFamily: ui.mono }}>
        <dt style={{ color: ui.dim, fontFamily: 'Inter Variable, sans-serif' }}>Cold → hot (psi)</dt>
        <dd>
          {cold.toFixed(1)} → <span style={{ color: inWindow ? ui.gain : ui.loss }}>{hot.toFixed(1)}</span>
        </dd>
        <dt style={{ color: ui.dim, fontFamily: 'Inter Variable, sans-serif' }}>Camber</dt>
        <dd>{camber.toFixed(1)}°</dd>
        <dt style={{ color: ui.dim, fontFamily: 'Inter Variable, sans-serif' }}>Toe</dt>
        <dd>
          {toe > 0 ? '+' : ''}
          {toe.toFixed(2)}°
        </dd>
        <dt style={{ color: ui.dim, fontFamily: 'Inter Variable, sans-serif' }}>Brake disc</dt>
        <dd>{brake} °C</dd>
      </dl>
    </div>
  )
}

// Hot pressures lap by lap: they climb from cold and settle once the tyres are in the window
const LAPS = 12
const pressureLaps = tyres.map((t, k) =>
  Array.from({ length: LAPS }, (_, lap) => t.hot - (t.hot - (t.cold + 3.2)) * Math.exp(-lap / 1.7) + Math.sin(lap * 1.9 + k) * 0.05),
)
const PC = { w: 388, h: 118, lo: 23.5, hi: 27.5 }
const pcX = (lap: number) => 26 + (lap / (LAPS - 1)) * (PC.w - 34)
const pcY = (v: number) => 8 + (1 - (v - PC.lo) / (PC.hi - PC.lo)) * (PC.h - 26)
const tyreColors = ['#22c55e', '#38bdf8', '#a3acb8', '#f59e0b']

function PressureChart() {
  return (
    <div className="mt-auto border-t px-2 pt-2 pb-1" style={{ borderColor: ui.line }}>
      <div className="flex items-center justify-between px-1 text-[10px]" style={{ color: ui.dim }}>
        <span className="font-semibold tracking-[0.14em] uppercase">Hot pressure · stint</span>
        <span className="flex gap-2.5" style={{ fontFamily: ui.mono }}>
          {tyres.map((t, k) => (
            <span key={t.pos} className="flex items-center gap-1">
              <span className="h-0.5 w-3" style={{ background: tyreColors[k] }} />
              {t.pos}
            </span>
          ))}
        </span>
      </div>
      <svg width={PC.w} height={PC.h} className="block">
        <rect x={pcX(0)} y={pcY(HOT_WINDOW[1])} width={pcX(LAPS - 1) - pcX(0)} height={pcY(HOT_WINDOW[0]) - pcY(HOT_WINDOW[1])} fill="#22c55e14" />
        {[24, 25, 26, 27].map((v) => (
          <g key={v}>
            <line x1={pcX(0)} x2={pcX(LAPS - 1)} y1={pcY(v)} y2={pcY(v)} stroke={ui.grid} />
            <text x="2" y={pcY(v) + 3} fontSize="9" fill={ui.dim} fontFamily={ui.mono}>
              {v}
            </text>
          </g>
        ))}
        {pressureLaps.map((laps, k) => (
          <path
            key={k}
            d={'M' + laps.map((v, lap) => `${pcX(lap).toFixed(1)},${pcY(v).toFixed(1)}`).join('L')}
            fill="none"
            stroke={tyreColors[k]}
            strokeWidth="1.4"
          />
        ))}
        {[1, 4, 8, 12].map((lap) => (
          <text key={lap} x={pcX(lap - 1)} y={PC.h - 3} fontSize="9" fill={ui.dim} textAnchor="middle" fontFamily={ui.mono}>
            L{lap}
          </text>
        ))}
      </svg>
    </div>
  )
}
