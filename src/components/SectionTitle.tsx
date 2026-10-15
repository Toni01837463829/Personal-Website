import { Reveal } from './Reveal'

export function SectionTitle({ index, title, kicker }: { index: string; title: string; kicker: string }) {
  return (
    <Reveal className="mb-14 flex items-end justify-between gap-6 border-b border-stone pb-6">
      <div>
        <p className="mb-3 text-sm tracking-[0.2em] text-mist uppercase">{kicker}</p>
        <h2 className="font-serif text-5xl leading-none md:text-7xl">{title}</h2>
      </div>
      <span className="font-serif text-5xl text-stone md:text-7xl">{index}</span>
    </Reveal>
  )
}
