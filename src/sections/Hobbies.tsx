import { HobbyIcon } from '../components/Icons'
import { Reveal } from '../components/Reveal'
import { SectionTitle } from '../components/SectionTitle'
import { TiltCard } from '../components/TiltCard'
import { hobbies, projects } from '../content'

export function Hobbies() {
  return (
    <section id="hobbys" className="relative mx-auto max-w-6xl px-6 py-32 md:py-44">
      <SectionTitle index="02" kicker="Hobbys" title="Was mich antreibt" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {hobbies.map((h, i) => {
          const count = projects.filter((p) => p.hobby === h.id).length
          return (
            <Reveal key={h.id} delay={i * 0.1} className="h-full">
              <TiltCard>
                <div className="flex h-full min-h-72 flex-col p-7">
                  <div className="flex items-start justify-between text-ink">
                    <HobbyIcon id={h.id} />
                    <span className="font-serif text-2xl text-stone">0{i + 1}</span>
                  </div>
                  <h3 className="mt-auto pt-10 font-serif text-3xl leading-tight">{h.name}</h3>
                  <p className="mt-3 text-graphite">{h.text}</p>
                  {count > 0 && (
                    <a
                      href={`#projekt-${h.id}`}
                      className="mt-5 text-sm text-ink underline decoration-stone underline-offset-4 hover:decoration-ink"
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
