import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useRef, type PointerEvent } from 'react'
import angular from '../assets/tech/angular.svg'
import cplusplus from '../assets/tech/cplusplus.svg'
import csharp from '../assets/tech/csharp.svg'
import docker from '../assets/tech/docker.svg'
import duckdb from '../assets/tech/duckdb.svg'
import java from '../assets/tech/java.svg'
import mysql from '../assets/tech/mysql.svg'
import oracle from '../assets/tech/oracle.svg'
import postgresql from '../assets/tech/postgresql.svg'
import python from '../assets/tech/python.svg'
import react from '../assets/tech/react.svg'
import typescript from '../assets/tech/typescript.svg'
import vite from '../assets/tech/vite.svg'

// Logos from Devicon (MIT). SQL has no logo of its own and gets a text badge.
type Tech = { name: string; icon?: string }

const rows: { name: string; seconds: number; items: Tech[] }[] = [
  {
    name: 'Sprachen',
    seconds: 28,
    items: [
      { name: 'TypeScript', icon: typescript },
      { name: 'Python', icon: python },
      { name: 'C#', icon: csharp },
      { name: 'Java', icon: java },
      { name: 'C++', icon: cplusplus },
      { name: 'SQL' },
    ],
  },
  {
    name: 'Frameworks & Tools',
    seconds: 22,
    items: [
      { name: 'React', icon: react },
      { name: 'Angular', icon: angular },
      { name: 'Vite', icon: vite },
      { name: 'Docker', icon: docker },
    ],
  },
  {
    name: 'Datenbanken',
    seconds: 25,
    items: [
      { name: 'PostgreSQL', icon: postgresql },
      { name: 'Oracle', icon: oracle },
      { name: 'MySQL', icon: mysql },
      { name: 'DuckDB', icon: duckdb },
    ],
  },
]

function Card({ tech, dark }: { tech: Tech; dark?: boolean }) {
  return (
    <div className="pr-3">
      <div className={`flex items-center gap-2.5 rounded-2xl py-2.5 pr-4 pl-2.5 ring-1 transition-[translate,box-shadow] ${
        dark ? 'bg-[#10151c] shadow-[0_14px_28px_-14px_rgba(0,0,0,.9)] ring-white/10' : 'bg-white shadow-[0_10px_24px_-14px_rgba(17,21,28,.45)] ring-stone/80'
      } duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-a)_22%,transparent),0_16px_28px_-14px_rgba(17,21,28,.5)] hover:ring-[color-mix(in_srgb,var(--accent-a)_55%,transparent)]`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${dark ? 'bg-white/90' : 'bg-sand/70'}`}>
          {tech.icon ? (
            <img src={tech.icon} alt="" draggable={false} className="h-6 w-6 select-none" />
          ) : (
            <span className="font-mono text-[11px] font-semibold text-[#336791]">SQL</span>
          )}
        </span>
        <span className="text-sm font-medium whitespace-nowrap text-ink">{tech.name}</span>
      </div>
    </div>
  )
}

/**
 * What I work with, as a wall of logo cards on a tilted plane: one row per group,
 * gliding endlessly in alternating directions. The plane leans toward the mouse,
 * a hovered row stops and its card lifts. `dark` gives the cards a dark face.
 */
export function TechWall({ dark }: { dark?: boolean }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  // The rows only glide while the wall is on screen
  const visible = useInView(ref)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 80, damping: 18 })
  const sy = useSpring(py, { stiffness: 80, damping: 18 })
  const rotateX = useTransform(sy, (v) => (reduced ? 24 : 24 + v * -5))
  const rotateZ = useTransform(sx, (v) => (reduced ? -9 : -9 + v * 3))
  const rotateY = useTransform(sx, (v) => (reduced ? 0 : v * 6))

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    px.set(((e.clientX - r.left) / r.width) * 2 - 1)
    py.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }

  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden"
      style={{ perspective: 900 }}
      onPointerMove={onMove}
      onPointerLeave={() => {
        px.set(0)
        py.set(0)
      }}
    >
      <motion.div
        className="absolute inset-x-[-35%] top-1/2 flex -translate-y-1/2 flex-col gap-5"
        style={{ rotateX, rotateZ, rotateY, transformStyle: 'preserve-3d' }}
      >
        {rows.map((row, ri) => {
          // Enough copies that half the track is wider than the plane, then doubled for a seamless loop
          const copies = Math.ceil(12 / row.items.length)
          const half = Array.from({ length: copies }, () => row.items).flat()
          return (
            <motion.div
              key={row.name}
              className="group/row"
              initial={reduced ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 + ri * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-2 pl-[30%] text-[10px] font-medium tracking-[0.25em] text-mist uppercase">{row.name}</p>
              <div
                className="flex w-max group-hover/row:[animation-play-state:paused]"
                style={
                  reduced
                    ? undefined
                    : {
                        animation: `tech-marquee ${row.seconds}s linear infinite`,
                        animationDirection: ri % 2 ? 'reverse' : 'normal',
                        animationPlayState: visible ? undefined : 'paused',
                      }
                }
              >
                {[...half, ...half].map((t, i) => (
                  <Card key={i} tech={t} dark={dark} />
                ))}
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

/** The Coding slide of the hero window: the tilted logo wall, softly faded at the edges, with a GitHub link. */
export function CodingVisual({ github }: { github: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-stone bg-[linear-gradient(160deg,#ffffff,#f1f4f8)]">
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_50%,#000_55%,transparent_100%)]">
        <TechWall />
      </div>
      <a
        href={github}
        target="_blank"
        rel="noreferrer"
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs text-paper transition-transform hover:-translate-y-0.5"
      >
        GitHub <span aria-hidden>↗</span>
      </a>
    </div>
  )
}
