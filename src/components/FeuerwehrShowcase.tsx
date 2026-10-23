import { motion } from 'motion/react'
import { feuerwehr, projects } from '../content'
import { Medal3D } from './Medal3D'
import { Portal, type PortalColors } from './Portal'

const site = projects.find((p) => p.hobby === 'feuerwehr' && p.visual === 'portal')!

/**
 * The Feuerwehr screen: my badges from the training exams, spinning in 3D, and below them
 * the portal into the website I built and host for the FF Pfaffenschlag.
 */
export function FeuerwehrShowcase() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[34rem]">
      <div aria-hidden className="absolute inset-[15%] rounded-full bg-(--accent-a) opacity-20 [mask-image:radial-gradient(closest-side,#000,transparent)]" />

      <div className="relative flex justify-center gap-14">
        {feuerwehr.medals.map((m, i) => (
          <motion.figure
            key={m.short}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <Medal3D
              src={import.meta.env.BASE_URL + m.image}
              alt={`Abzeichen ${m.short} ${m.level}: Ausbildungsprüfung ${m.name}`}
              height={124}
              ratio={m.ratio}
            />
            <figcaption className="mt-2 text-center">
              <span className="block text-sm font-semibold">
                {m.short} · <span className="text-[#c08a5c]">{m.level}</span>
              </span>
              <span className="block text-[11px] text-mist">{m.name}</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-8"
      >
        <Portal
          dark
          image={import.meta.env.BASE_URL + site.image}
          label={site.title}
          href={site.link}
          colors={site.colors as PortalColors}
        />
      </motion.div>
    </div>
  )
}
