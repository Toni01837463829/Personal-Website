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

