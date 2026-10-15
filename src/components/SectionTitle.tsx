import { Depth } from './Mouse'
import { Reveal } from './Reveal'
import { Text3D } from './Text3D'

export function SectionTitle({ index, title, kicker }: { index: string; title: string; kicker: string }) {
  return (
    <Reveal className="mb-20 flex items-end justify-between gap-6 border-b border-stone/70 pb-8 md:mb-28">
      <div>
        <Depth depth={0.3}>
          <p className="mb-4 text-xs font-medium tracking-[0.25em] text-mist uppercase">{kicker}</p>
        </Depth>
        <Text3D depth={1.2} className="inline-block">
          <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">{title}</h2>
        </Text3D>
      </div>
      <Depth depth={0.5}>
        <span className="text-sm font-medium text-mist tabular-nums">{index}</span>
      </Depth>
    </Reveal>
  )
}
