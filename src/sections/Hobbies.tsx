import { accentVars } from '../chapters'
import { HobbyIcon } from '../components/Icons'
import { Reveal } from '../components/Reveal'
import { Rich } from '../components/Rich'
import { Text3D } from '../components/Text3D'
import { SectionTitle } from '../components/SectionTitle'
import { TiltCard } from '../components/TiltCard'
import { hobbies, projects } from '../content'

export function Hobbies() {
  return (
    <section id="hobbys" style={accentVars('hobbys')} className="relative mx-auto max-w-6xl scroll-mt-10 px-6 pt-16 pb-40 md:px-10 md:pt-24 md:pb-56">
      <SectionTitle index="02" kicker="Hobbys" title="Was mich antreibt" />

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {hobbies.map((h, i) => {
          const count = projects.filter((p) => p.hobby === h.id).length
          return (
            <Reveal key={h.id} delay={i * 0.1} className="h-full">
              <TiltCard>
                <div className="flex h-full min-h-80 flex-col p-9">
                  <div className="flex items-start justify-between text-ink">
                    <HobbyIcon id={h.id} />
                    <span className="text-xs font-medium text-mist tabular-nums">0{i + 1}</span>
                  </div>
                  <Text3D depth={0.6} tilt={false} className="mt-auto block pt-14">
                    <h3 className="text-xl font-semibold tracking-tight">{h.name}</h3>
                  </Text3D>
                  <p className="mt-3 leading-relaxed text-graphite">
                    <Rich text={h.text} />
                  </p>
                  {count > 0 && (
                    <a
                      href={`#projekt-${h.id}`}
                      className="mt-6 text-sm text-ink underline decoration-stone underline-offset-4 hover:decoration-ink"
                    >
                      {count === 1 ? '1 Projekt' : `${count} Projekte`} ansehen
                    </a>
                  )}
                </div>
              </TiltCard>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
