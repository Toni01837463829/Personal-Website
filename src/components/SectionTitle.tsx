import { Reveal } from './Reveal'

export function SectionTitle({ index, title, kicker }: { index: string; title: string; kicker: string }) {
  return (
    <Reveal className="mb-20 flex items-end justify-between gap-6 border-b border-stone/70 pb-8 md:mb-28">
      <div>
        <p className="mb-4 text-xs font-medium tracking-[0.25em] text-mist uppercase">{kicker}</p>
        <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">{title}</h2>
      </div>
      <span className="text-sm font-medium text-mist tabular-nums">{index}</span>
    </Reveal>
  )
}
