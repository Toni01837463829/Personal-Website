import { motion } from 'motion/react'
import { person } from '../content'

const links = [
  { href: '#ueber-mich', label: 'Über mich' },
  { href: '#hobbys', label: 'Hobbys' },
  { href: '#projekte', label: 'Projekte' },
  { href: '#kontakt', label: 'Kontakt' },
]

export function Nav() {
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-4 z-40 flex justify-center px-4"
    >
      <nav className="flex items-center gap-1 rounded-full border border-stone/70 bg-paper/70 p-1.5 shadow-[0_10px_30px_-15px_rgba(28,26,23,.3)] backdrop-blur-md">
        <a href="#top" className="rounded-full px-4 py-2 font-serif text-xl leading-none">
          {person.name}
        </a>
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="hidden rounded-full px-4 py-2 text-sm text-graphite transition-colors hover:bg-ink hover:text-paper sm:block"
          >
            {l.label}
          </a>
        ))}
      </nav>
    </motion.header>
  )
}
