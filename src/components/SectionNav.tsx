import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { chapters } from '../chapters'

const calm = { type: 'spring', stiffness: 170, damping: 26, mass: 0.9 } as const

/** Quiet vertical indicator on the left that follows the section in view. */
export function SectionNav({ active }: { active: number }) {
  const [hovered, setHovered] = useState(false)
  const [a, b] = chapters[active].accent

  const showLabels = hovered

  return (
    <motion.nav
      aria-label="Abschnitte"
      initial={{ opacity: 0, x: -16, borderRadius: 12 }}
      animate={{ opacity: 1, x: 0, borderRadius: hovered ? 6 : 12 }}
      transition={{
        default: { duration: 1, delay: 1.2, ease: [0.22, 1, 0.36, 1] },
        borderRadius: { duration: 0.4, ease: 'easeOut' },
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="glass fixed top-1/2 left-3 z-40 hidden -translate-y-1/2 px-1.5 py-2.5 lg:block"
    >
      <ul className="flex flex-col gap-0.5">
        {chapters.map((s, i) => {
          const isActive = i === active
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-label={s.label}
                aria-current={isActive ? 'true' : undefined}
                className="group flex h-6 items-center"
              >
                <span className="relative flex h-full w-3 items-center justify-center">
                  <span className="h-1 w-1 rounded-full bg-mist/50 transition-colors duration-500 group-hover:bg-graphite/70" />
                  {isActive && (
                    <motion.span
                      layoutId="section-indicator"
                      transition={calm}
                      animate={{ backgroundImage: `linear-gradient(180deg, ${a}, ${b})` }}
                      className="absolute left-1/2 h-4 w-1 -translate-x-1/2 rounded-full"
                    />
                  )}
                </span>
                <AnimatePresence initial={false}>
                  {showLabels && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: isActive ? 1 : 0.6 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className={`overflow-hidden text-[11px] whitespace-nowrap ${isActive ? 'font-semibold' : 'text-graphite'}`}
                      style={isActive ? { color: a } : undefined}
                    >
                      <span className="block pr-1.5 pl-2">{s.label}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </a>
            </li>
          )
        })}
      </ul>
    </motion.nav>
  )
}
