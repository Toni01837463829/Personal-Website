import { motion } from 'motion/react'
import { Depth } from './Mouse'

// Simple drawn previews until real screenshots are added.

export function BrowserVisual() {
  return (
    <div className="relative aspect-[4/3] w-full">
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-stone bg-white">
        <div className="flex items-center gap-2 border-b border-stone/70 bg-sand/60 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-stone" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone" />
          <span className="ml-3 h-5 flex-1 rounded-full bg-white/80" />
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <span className="h-4 w-24 rounded bg-ink" />
            <div className="flex gap-3">
              <span className="h-2 w-10 rounded bg-stone" />
              <span className="h-2 w-10 rounded bg-stone" />
              <span className="h-2 w-10 rounded bg-stone" />
            </div>
          </div>
          <div className="h-28 rounded-xl bg-[#b4413a]/85" />
          <div className="grid grid-cols-3 gap-3">
            <span className="h-16 rounded-lg bg-sand" />
            <span className="h-16 rounded-lg bg-sand" />
            <span className="h-16 rounded-lg bg-sand" />
          </div>
        </div>
      </div>
      <Depth depth={2.4} className="absolute -right-4 -bottom-6 w-44">
        <div className="rounded-xl border border-stone bg-white p-4 shadow-[0_25px_50px_-20px_rgba(17,21,28,.35)]">
          <p className="text-[10px] tracking-widest text-mist uppercase">Letzter Einsatz</p>
          <p className="mt-1 text-sm font-medium">Technischer Einsatz</p>
          <span className="mt-3 block h-1.5 w-20 rounded bg-stone" />
        </div>
      </Depth>
    </div>
  )
}

export function DashboardVisual() {
  const segments = 14
  return (
    <div className="relative aspect-[4/3] w-full">
      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-ink p-6 text-paper">
        <div className="flex gap-1">
          {Array.from({ length: segments }).map((_, i) => (
            <motion.span
              key={i}
              className="h-3 flex-1 rounded-sm"
              style={{ background: i < 9 ? '#d3dae3' : i < 12 ? '#e3b34a' : '#d4573f' }}
              animate={{ opacity: [0.15, 1, 1, 0.15] }}
              transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.5, 0.8, 1], delay: i * 0.06 }}
            />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 items-center gap-4">
          <div className="space-y-3 text-xs text-mist">
            <p>
              Runde
              <span className="block font-mono text-lg text-paper">1:42.318</span>
            </p>
            <p>
              Beste
              <span className="block font-mono text-lg text-paper">1:41.906</span>
            </p>
          </div>
          <p className="text-center font-mono text-8xl leading-none">4</p>
          <div className="space-y-3 text-right text-xs text-mist">
            <p>
              km/h
              <span className="block font-mono text-lg text-paper">187</span>
            </p>
            <p>
              Delta
              <span className="block font-mono text-lg text-[#7fbf7a]">−0.214</span>
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-4 gap-2 text-center text-[10px] tracking-widest text-mist uppercase">
          {[
            ['TC', '3'],
            ['ABS', '2'],
            ['BB', '54.5'],
            ['Tank', '18.2 L'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-paper/5 py-3">
              {label}
              <span className="mt-1 block font-mono text-base tracking-normal text-paper">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <Depth depth={2.4} className="absolute -bottom-10 -left-6 w-40">
        <div className="rounded-xl bg-paper p-4 shadow-[0_25px_50px_-20px_rgba(17,21,28,.45)]">
          <p className="text-[10px] tracking-widest text-mist uppercase">Reifen</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-xs">
            <span className="rounded bg-sand px-2 py-1">86°</span>
            <span className="rounded bg-sand px-2 py-1">88°</span>
            <span className="rounded bg-sand px-2 py-1">84°</span>
            <span className="rounded bg-sand px-2 py-1">85°</span>
          </div>
        </div>
      </Depth>
    </div>
  )
}

const code: [string, string][][] = [
  [['// Delta zur besten Runde fürs Dashboard', 'text-mist']],
  [['export function ', 'text-violet-600'], ['delta', 'text-sky-600'], ['(lap: Lap, best: Lap) {', 'text-ink']],
  [['  const ', 'text-violet-600'], ['now = lap.sectors.', 'text-ink'], ['reduce', 'text-sky-600'], ['(sum, ', 'text-ink'], ['0', 'text-amber-600'], [')', 'text-ink']],
  [['  const ', 'text-violet-600'], ['ref = best.sectors.', 'text-ink'], ['reduce', 'text-sky-600'], ['(sum, ', 'text-ink'], ['0', 'text-amber-600'], [')', 'text-ink']],
  [['  return ', 'text-violet-600'], ['(now - ref).', 'text-ink'], ['toFixed', 'text-sky-600'], ['(', 'text-ink'], ['3', 'text-amber-600'], [')', 'text-ink']],
  [['}', 'text-ink']],
]

export function CodeVisual() {
  return (
    <div className="relative aspect-[4/3] w-full">
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-stone bg-white">
        <div className="flex border-b border-stone/70 bg-sand/60 text-xs">
          <span className="border-r border-stone/70 bg-white px-4 py-2.5 text-ink">delta.ts</span>
          <span className="px-4 py-2.5 text-mist">dashboard.tsx</span>
        </div>
        <div className="space-y-1.5 p-5 font-mono text-[13px] leading-relaxed">
          {code.map((line, i) => (
            <motion.div
              key={i}
              className="flex gap-4 whitespace-pre"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.22 }}
            >
              <span className="w-4 text-right text-stone select-none">{i + 1}</span>
              <span>
                {line.map(([text, cls], j) => (
                  <span key={j} className={cls}>
                    {text}
                  </span>
                ))}
                {i === code.length - 1 && (
                  <motion.span
                    className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-ink"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      <Depth depth={2.4} className="absolute -right-4 -bottom-6 w-40">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="rounded-xl border border-stone bg-white p-4 shadow-[0_25px_50px_-20px_rgba(17,21,28,.35)]"
        >
          <p className="text-[10px] tracking-widest text-mist uppercase">Build</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Erfolgreich
          </p>
        </motion.div>
      </Depth>
    </div>
  )
}

export function GarminVisual() {
  const fields = [
    ['Leistung', '248', 'W'],
    ['Herzfrequenz', '152', 'bpm'],
    ['Trittfrequenz', '91', 'rpm'],
    ['Zeit', '1:12:40', ''],
  ]
  return (
    <div className="relative flex aspect-[4/3] w-full items-center justify-center">
      <div className="h-full w-[58%] rounded-[2rem] border border-stone bg-[#1a1f27] p-3 shadow-[0_30px_60px_-30px_rgba(17,21,28,.5)]">
        <div className="grid h-full grid-rows-[1.3fr_1fr_1fr] gap-px overflow-hidden rounded-[1.4rem] bg-stone">
          <div className="flex flex-col items-center justify-center bg-paper">
            <p className="text-[10px] tracking-widest text-mist uppercase">{fields[0][0]}</p>
            <p className="font-mono text-5xl leading-tight">
              {fields[0][1]}
              <span className="ml-1 text-base text-mist">{fields[0][2]}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px">
            {fields.slice(1, 3).map(([label, value, unit]) => (
              <div key={label} className="flex flex-col items-center justify-center bg-paper">
                <p className="text-[9px] tracking-widest text-mist uppercase">{label}</p>
                <p className="font-mono text-2xl">
                  {value}
                  <span className="ml-0.5 text-xs text-mist">{unit}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-center bg-paper">
            <p className="text-[9px] tracking-widest text-mist uppercase">{fields[3][0]}</p>
            <p className="font-mono text-2xl">{fields[3][1]}</p>
          </div>
        </div>
      </div>
      <Depth depth={2.4} className="absolute right-0 bottom-6 w-40">
        <div className="rounded-xl border border-stone bg-white p-4 shadow-[0_25px_50px_-20px_rgba(17,21,28,.35)]">
          <p className="text-[10px] tracking-widest text-mist uppercase">Eigene Seite</p>
          <p className="mt-1 text-sm font-medium">Intervall 3 / 5</p>
          <span className="mt-3 block h-1.5 w-full overflow-hidden rounded bg-sand">
            <span className="block h-full w-3/5 bg-ink" />
          </span>
        </div>
      </Depth>
    </div>
  )
}
