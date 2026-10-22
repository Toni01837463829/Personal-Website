import { accentVars } from '../chapters'
import { SectionTitle } from '../components/SectionTitle'
import { Timeline } from '../components/Timeline'
import { about } from '../content'

export function About() {
  return (
    <section id="ueber-mich" style={accentVars('ueber-mich')} className="relative scroll-mt-10 pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <SectionTitle index="01" kicker="Über mich" title="Wer ich bin" />
      </div>

      {/* Full width, so the path can run off both edges of the screen */}
      <Timeline steps={about.path} />
    </section>
  )
}
