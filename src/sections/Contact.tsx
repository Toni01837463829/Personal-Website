import { Depth } from '../components/Mouse'
import { Reveal } from '../components/Reveal'
import { person } from '../content'

export function Contact() {
  return (
    <section id="kontakt" className="relative overflow-hidden bg-ink px-6 py-32 text-paper md:py-44">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="mb-6 text-sm tracking-[0.2em] text-mist uppercase">Kontakt</p>
        </Reveal>
        <Depth depth={0.8}>
          <Reveal delay={0.1}>
            <h2 className="font-serif text-6xl leading-[0.95] md:text-9xl">
              Lass uns <em>reden.</em>
            </h2>
          </Reveal>
        </Depth>
        <Reveal delay={0.2} className="mt-14 flex flex-wrap gap-4">
          <a
            href={person.github}
            className="rounded-full border border-paper/30 px-6 py-3 transition-colors hover:bg-paper hover:text-ink"
          >
            GitHub
          </a>
        </Reveal>
      </div>
      <footer className="mx-auto mt-32 flex max-w-6xl justify-between border-t border-paper/15 pt-8 text-sm text-mist">
        <span>© {new Date().getFullYear()} {person.name}</span>
        <a href="#top" className="hover:text-paper">
          Nach oben ↑
        </a>
      </footer>
    </section>
  )
}
