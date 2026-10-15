import { motion } from 'motion/react'
import { person } from '../content'

const links = [
  { href: '#ueber-mich', label: 'Über mich' },
  { href: '#hobbys', label: 'Hobbys' },
  { href: '#projekte', label: 'Projekte' },
]

export function Nav() {
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-6 z-40 flex justify-center px-4"
    >
      <nav className="glass flex items-center gap-1 rounded-full p-1.5">
        <a href="#top" className="rounded-full px-5 py-2 text-sm font-semibold tracking-tight">
          {person.name}
        </a>
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="hidden rounded-full px-5 py-2 text-sm text-graphite transition-colors hover:bg-white/70 hover:text-ink sm:block"
          >
            {l.label}
          </a>
        ))}
      </nav>
    </motion.header>
  )
}
