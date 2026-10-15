import { motion } from 'motion/react'
import { Depth } from './Mouse'
import { Text3D } from './Text3D'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * Quiet section heading (the band before each section already introduces it): the words
 * rise out of a mask one after another and a thin line draws in underneath.
 */
export function SectionTitle({
  index,
  title,
  kicker,
}: {
  index: string
  title: string
  kicker: string
}) {
  const words = title.split(' ')

  return (
    <motion.div
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-15% 0px' }}
      className="relative mb-14 flex items-end justify-between gap-6 pb-6 md:mb-20"
    >
      <div>
        <Depth depth={0.3}>
          <motion.p
            variants={{ hidden: { opacity: 0, x: -20 }, shown: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.8, ease }}
            className="mb-4 flex items-center gap-3 text-xs font-medium tracking-[0.3em] uppercase"
          >
            <span className="h-px w-8 bg-linear-to-r from-(--accent-a) to-(--accent-b)" />
            <span className="text-accent">{kicker}</span>
          </motion.p>
        </Depth>
        <Text3D depth={0.8} className="inline-block">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight md:text-4xl">
            {words.map((w, i) => (
              <span key={i} className="-mb-[0.2em] inline-block overflow-hidden pb-[0.2em] align-bottom">
                <motion.span
                  className="inline-block"
                  variants={{ hidden: { y: '110%' }, shown: { y: 0 } }}
                  transition={{ duration: 0.9, delay: 0.1 + i * 0.07, ease }}
                >
                  {w}
                </motion.span>
                {i < words.length - 1 && ' '}
              </span>
            ))}
          </h2>
        </Text3D>
      </div>

      <span className="text-sm font-medium text-mist tabular-nums">{index}</span>

      <motion.span
        variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1 } }}
        transition={{ duration: 1.2, delay: 0.2, ease }}
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-linear-to-r from-(--accent-a) via-stone to-stone/0"
      />
    </motion.div>
  )
}
