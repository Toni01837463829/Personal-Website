import { Depth } from '../components/Mouse'
import { Reveal } from '../components/Reveal'
import { person } from '../content'

export function Contact() {
  return (
    <section id="kontakt" className="relative px-6 pt-24 pb-12 md:px-10 md:pt-32">
      <div className="glass mx-auto max-w-6xl rounded-[2.5rem] px-8 py-24 md:px-20 md:py-36">
        <Reveal>
          <p className="mb-8 text-xs font-medium tracking-[0.25em] text-mist uppercase">Kontakt</p>
        </Reveal>
        <Depth depth={0.8}>
          <Reveal delay={0.1}>
            <h2 className="text-5xl leading-[1.05] font-semibold tracking-[-0.04em] md:text-8xl">
              Lass uns reden.
            </h2>
          </Reveal>
        </Depth>
        <Reveal delay={0.2} className="mt-16 flex flex-wrap gap-4">
          <a
            href={person.github}
            className="rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-transform hover:-translate-y-0.5"
          >
            GitHub
          </a>
        </Reveal>
      </div>
      <footer className="mx-auto mt-16 flex max-w-6xl justify-between px-2 text-sm text-mist">
        <span>© {new Date().getFullYear()} {person.name}</span>
        <a href="#top" className="hover:text-ink">
          Nach oben ↑
        </a>
      </footer>
    </section>
  )
}
