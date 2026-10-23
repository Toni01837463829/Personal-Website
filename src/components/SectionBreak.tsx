import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { accentVars, chapter, chapters, type ChapterId } from '../chapters'
import { usePointer } from './Mouse'

type Glyph = { ch: string; w: number; angle: number; dot: boolean }

/**
 * Lays the label out around a cylinder: measures every letter, repeats the label until the
 * ring has roughly the wanted radius, and gives each letter its angle on the ring.
 */
function layoutRing(label: string, vw: number) {
  const fontSize = Math.round(Math.min(104, Math.max(40, vw * 0.065)))
  const target = Math.min(620, Math.max(230, vw * 0.4))
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.font = `700 ${fontSize}px "Inter Variable", system-ui, sans-serif`
  const track = -0.03 * fontSize

  const unit = [...label].map((ch) => ({ ch, w: ctx.measureText(ch).width + track, dot: false }))
  unit.push({ ch: '', w: fontSize * 0.9, dot: true })
  const unitW = unit.reduce((s, g) => s + g.w, 0)
  const repeats = Math.max(2, Math.round((2 * Math.PI * target) / unitW))
  const total = unitW * repeats
  const radius = total / (2 * Math.PI)

  let x = 0
  const glyphs: Glyph[] = Array.from({ length: repeats }, () => unit)
    .flat()
    .map((g) => {
      const angle = ((x + g.w / 2) / total) * 360
      x += g.w
      return { ...g, angle }
    })
  return { fontSize, radius, glyphs }
}

/**
 * The band before each section: its name wrapped around a tilted 3D ring that spins as
 * you scroll past and swings toward the mouse. The near side is solid with a bit of depth,
 * the far side shows through, mirrored like glass, as hollow letters in the section accent.
 */
export function SectionBreak({ to }: { to: ChapterId }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const k = reduced ? 0 : 1
  const { label } = chapter(to)
  const index = String(chapters.findIndex((c) => c.id === to)).padStart(2, '0')

  const [ring, setRing] = useState(() => layoutRing(label, window.innerWidth))
  useEffect(() => {
    const update = () => setRing(layoutRing(label, window.innerWidth))
    document.fonts.ready.then(update)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [label])

  const { x: px, y: py } = usePointer()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const rotateY = useTransform([scrollYProgress, px], ([p, m]: number[]) => (40 - p * 160 + m * 18) * k)
  const rotateX = useTransform([scrollYProgress, py], ([p, m]: number[]) => (-8 + (p - 0.5) * 6 + m * 4) * k)
  const opacity = useTransform(scrollYProgress, [0.05, 0.3, 0.7, 0.95], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8])

  const { fontSize, radius, glyphs } = ring
  const height = fontSize * 1.5 + radius * 0.4

  const face = (g: Glyph, i: number, back: boolean) => (
    <span
      key={`${back ? 'b' : 'f'}${i}`}
      className={`absolute top-0 left-0 flex items-center justify-center ${
        back ? 'text-outline' : 'text-extrude text-ink'
      }`}
      style={{
        width: g.w,
        height: fontSize,
        marginLeft: -g.w / 2,
        marginTop: -fontSize / 2,
        transform: `rotateY(${g.angle}deg) translateZ(${radius}px)${back ? ' rotateY(180deg) scaleX(-1)' : ''}`,
        backfaceVisibility: 'hidden',
      }}
    >
      {g.dot ? (
        <span
          className={`h-[0.2em] w-[0.2em] rounded-full ${
            back ? 'border border-(--accent-a)/50' : 'bg-linear-to-br from-(--accent-a) to-(--accent-b)'
          }`}
        />
      ) : (
        g.ch
      )}
    </span>
  )

  return (
    <div
      ref={ref}
      style={accentVars(to)}
      aria-hidden
      className="relative overflow-hidden py-10 select-none [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] md:py-16"
    >
      <motion.div style={{ opacity, height, perspective: radius * 2.4 + 500 }} className="relative">
        {/* Soft accent glow the ring floats above */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 rounded-[50%] bg-(--accent-a) opacity-15 [mask-image:radial-gradient(closest-side,#000,transparent)]"
          style={{ width: radius * 1.8, height: radius * 0.25, marginTop: radius * 0.06 }}
        />
        <motion.div
          style={{ scale, transformStyle: 'preserve-3d' }}
          className="absolute top-1/2 left-1/2 -rotate-3"
        >
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d', fontSize }}
            className="relative leading-none font-bold tracking-[-0.03em]"
          >
            {glyphs.map((g, i) => face(g, i, true))}
            {glyphs.map((g, i) => face(g, i, false))}
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="relative mt-6 flex items-center justify-center">
        <span className="glass relative rounded-full px-4 py-1.5 text-xs font-medium tracking-[0.3em] uppercase">
          <span className="text-accent tabular-nums">{index}</span>
          <span className="mx-2 text-mist">/</span>
          <span className="text-ink">{label}</span>
        </span>
      </div>
    </div>
  )
}
