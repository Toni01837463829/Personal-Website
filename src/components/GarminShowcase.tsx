import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, type MotionValue } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { garminPages } from '../content'
import { useLite } from '../lite'
import { glow } from './glow'
import { Depth } from './Mouse'
import { usePauseOffscreen } from './offscreen'
import { Rich } from './Rich'

// The recordings are 474 px wide; the device screen inside is 282×470.
// One pixel is trimmed on each side so no bezel shows at the edges.
const VIDEO_W = 474
const SCREEN_W = 280
const SCREEN_H = 468

type Page = (typeof garminPages)[number]

/** The device screen: the recording, cropped down to just the display. */
function Screen({
  page,
  load,
  playing,
  progress = null,
  onEnded,
  loop = false,
  start = 0,
}: {
  page: Page
  load: boolean
  playing: boolean
  progress?: MotionValue<number> | null
  onEnded?: () => void
  loop?: boolean
  start?: number
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (playing) v.play().catch(() => {})
    else v.pause()
  }, [playing, load])

  return (
    <div
      className="relative overflow-hidden rounded-[3px] bg-white"
      style={{ aspectRatio: `${SCREEN_W} / ${SCREEN_H}` }}
    >
      <video
        ref={ref}
        src={load ? import.meta.env.BASE_URL + page.video : undefined}
        muted
        playsInline
        preload="auto"
        loop={loop}
        onLoadedMetadata={(e) => start && (e.currentTarget.currentTime = start)}
        aria-label={`Datenseite ${page.name}`}
        className="absolute max-w-none"
        style={{
          width: `${(VIDEO_W / SCREEN_W) * 100}%`,
          left: `${(-(page.crop.x + 1) / SCREEN_W) * 100}%`,
          top: `${(-(page.crop.y + 1) / SCREEN_H) * 100}%`,
        }}
        onTimeUpdate={(e) => progress?.set(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
        onEnded={onEnded}
      />
    </div>
  )
}

/**
 * A bike computer drawn after the Edge 1030 (without the brand name), in its proportions:
 * a white body showing as a thin rim around a front of black glass with strongly rounded
 * corners, the screen set in from the sides and top with a tall empty chin below it, a
 * white lip under the glass and the darker underside with the buttons below that.
 */
function Device({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="relative rounded-[22%/11.5%] bg-linear-to-b from-white via-[#f8f9fb] to-[#e6eaef] px-[1.2%] pt-[4.7%] pb-[6.6%] shadow-[inset_3px_0_4px_-2px_rgba(17,21,28,.12),inset_-3px_0_4px_-2px_rgba(17,21,28,.12),inset_0_2px_1px_#fff,inset_0_-4px_6px_-3px_rgba(17,21,28,.18),0_40px_70px_-35px_rgba(17,21,28,.55)] ring-1 ring-stone/60">
        <div className="rounded-[21%/11.6%] bg-linear-to-b from-[#0f1114] to-[#08090b] px-[10%] pt-[20%] pb-[31%] shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]">
          {/* The display's own thin dark border inside the glass */}
          <div className="shadow-[0_0_0_1px_#22262c]">{children}</div>
        </div>
      </div>
      {/* Underside, with the lap and start buttons */}
      <div className="relative mx-auto -mt-[1%] aspect-[196/20] w-[77%] rounded-b-[45%_100%] bg-linear-to-b from-[#555b64] via-[#2a2e35] to-[#17191d] shadow-[0_6px_10px_-6px_rgba(17,21,28,.5)]">
        <span aria-hidden className="absolute top-[15%] bottom-[30%] left-[8%] w-px bg-white/15" />
        <span aria-hidden className="absolute top-[15%] right-[8%] bottom-[30%] w-px bg-white/15" />
      </div>
    </div>
  )
}

/**
 * The Garmin data pages as three devices fanned out in space. The one in front plays
 * its recording; when it ends the next one swings forward. Click a device or a tab
 * to bring it to the front.
 */
export function GarminShowcase() {
  const reduced = useReducedMotion()
  const lite = useLite()
  const ref = useRef<HTMLDivElement>(null)
  const near = useInView(ref, { once: true, margin: '300px' })
  const visible = useInView(ref, { amount: 0.3 })
  const [active, setActive] = useState(0)
  const progress = useMotionValue(0)
  const n = garminPages.length
  usePauseOffscreen(ref)

  const show = (i: number) => {
    progress.set(0)
    setActive(i)
  }

  return (
    <div ref={ref}>
      <div className="relative aspect-[5/4] w-full" style={{ perspective: 1400 }}>
        {/* Soft floor shadow and light behind the devices */}
        <div
          aria-hidden
          className="absolute -bottom-[21%] left-1/2 h-[58%] w-[117%] -translate-x-1/2"
          style={{ background: glow('var(--color-ink)', 0.07) }}
        />
        <div aria-hidden className="absolute -inset-x-[15%] -inset-y-[22%]" style={{ background: glow('#fff', 0.78) }} />

        {garminPages.map((page, i) => {
          // -1 left, 0 front, 1 right
          let offset = i - active
          if (offset > n / 2) offset -= n
          if (offset < -n / 2) offset += n
          const front = offset === 0
          return (
            <motion.div
              key={page.name}
              role={front ? undefined : 'button'}
              tabIndex={front ? undefined : 0}
              aria-label={front ? undefined : `${page.name} zeigen`}
              onClick={() => !front && show(i)}
              onKeyDown={(e) => !front && (e.key === 'Enter' || e.key === ' ') && show(i)}
              className="absolute top-[1%] left-1/2 w-[38%] -translate-x-1/2"
              style={{ zIndex: front ? 2 : 1, transformStyle: 'preserve-3d' }}
              initial={false}
              animate={{
                x: `${offset * 78}%`,
                rotateY: offset * -32,
                z: front ? 0 : -160,
                scale: front ? 1 : 0.86,
                opacity: front ? 1 : 0.75,
              }}
              whileHover={front || reduced ? undefined : { opacity: 1, z: -110 }}
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 110, damping: 20 }}
            >
              <div className={front && !lite ? 'motion-safe:animate-[float_5s_ease-in-out_infinite]' : undefined}>
                <Device>
                  <Screen
                    page={page}
                    load={near}
                    playing={front && visible && !reduced}
                    progress={front ? progress : null}
                    onEnded={() => show((i + 1) % n)}
                  />
                </Device>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Page tabs with a progress line for the one that is playing */}
      <div className="mx-auto mt-4 flex max-w-sm gap-1.5 rounded-full p-1.5 glass" role="tablist">
        {garminPages.map((page, i) => (
          <button
            key={page.name}
            role="tab"
            aria-selected={i === active}
            onClick={() => show(i)}
            className={`relative flex-1 overflow-hidden rounded-full px-3 py-1.5 text-sm transition-colors ${
              i === active ? 'bg-white text-ink shadow-sm' : 'text-mist hover:text-graphite'
            }`}
          >
            {page.name}
            {i === active && !reduced && (
              <motion.span
                aria-hidden
                className="absolute inset-x-3 bottom-0.5 h-0.5 origin-left rounded-full bg-ink/60 will-change-transform"
                style={{ scaleX: progress }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-4 grid max-w-sm text-center text-sm leading-relaxed text-graphite">
        <AnimatePresence initial={false}>
          <motion.p
            key={active}
            className="[grid-area:1/1]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            <Rich text={garminPages[active].text} />
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * One device for the hero window: the live graphs page, tilted in space above an orbit
 * with a GPS dot circling it, and a few glass notes floating at different depths.
 * Everything moves only while it is in view.
 */
export function GarminHeroVisual() {
  const reduced = useReducedMotion()
  const lite = useLite()
  const ref = useRef<HTMLDivElement>(null)
  usePauseOffscreen(ref)
  const visible = useInView(ref)
  const playing = visible && !reduced
  // In lite mode (see lite.ts) the video still plays, but nothing around it moves
  const live = playing && !lite
  // The CSS loops (index.css); off screen they pause on their own (usePauseOffscreen)
  const loops = !lite
  const page = garminPages[2]
  return (
    <div ref={ref} className="relative aspect-[4/3] w-full" style={{ perspective: 1200 }}>
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 aspect-square w-[105%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: glow('var(--accent-a)', 0.18) }}
      />

      {/* Orbit on the floor, seen at an angle */}
      <div
        aria-hidden
        className="absolute inset-x-[6%] top-[58%] aspect-square -translate-y-1/2"
        style={{ perspective: 800 }}
      >
        <div className="h-full w-full" style={{ transform: 'rotateX(74deg)' }}>
          <div className="absolute inset-0 rounded-full border border-stone" />
          <div className="absolute inset-[14%] rounded-full border border-dashed border-stone/80" />
          <div className={`absolute inset-0 ${loops ? 'motion-safe:animate-[spin_9s_linear_infinite]' : ''}`}>
            <span className="absolute top-0 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-a)] shadow-[0_0_20px_4px_color-mix(in_srgb,var(--accent-a)_45%,transparent)]" />
          </div>
        </div>
      </div>

      <Depth depth={0.8} className="absolute top-[1%] left-1/2 w-[36%] -translate-x-1/2">
        <div
          className={loops ? 'motion-safe:animate-[device-float_6s_ease-in-out_infinite]' : undefined}
          style={{ transformStyle: 'preserve-3d', transform: 'rotateX(6deg) rotateY(-14deg)' }}
        >
          <Device>
            <Screen page={page} load playing={playing} loop start={6} />
          </Device>
        </div>
      </Depth>

      {/* The notes float on the frosted window already, so they skip a blur of their own */}
      <Depth depth={2.2} className="absolute top-[14%] left-0">
        <div className="glass-flat flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-ink">
          <span className="relative flex h-2 w-2">
            {live && <span className="absolute inset-0 animate-ping rounded-full bg-[#e5484d] opacity-70" />}
            <span className="relative h-2 w-2 rounded-full bg-[#e5484d]" />
          </span>
          Live auf dem Rad
        </div>
      </Depth>

      <Depth depth={1.6} className="absolute top-[40%] right-0 w-[34%]">
        <div className="glass-flat rounded-2xl p-3.5">
          <p className="text-[10px] tracking-widest text-mist uppercase">Carb Fuel</p>
          <p className="mt-1 text-sm font-medium">Glykogen live</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sand">
            <span
              className={`block h-full origin-left rounded-full bg-[#2fae4e] ${loops ? 'motion-safe:animate-[carb_8s_ease-in-out_infinite]' : ''}`}
              style={{ transform: 'scaleX(0.92)' }}
            />
          </div>
        </div>
      </Depth>

      <Depth depth={2.8} className="absolute bottom-[4%] left-[2%]">
        <div className="glass-flat flex items-center gap-3 rounded-2xl px-3.5 py-2.5">
          <div className="flex items-end gap-0.5">
            {[5, 9, 7, 12, 10, 14].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-sm bg-[var(--accent-a)] ${loops ? 'motion-safe:animate-[level_1.4s_ease-in-out_infinite]' : ''}`}
                style={{ height: h, animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
          <div>
            <p className="text-[10px] tracking-widest text-mist uppercase">Connect IQ</p>
            <p className="text-sm font-medium">3 eigene Datenseiten</p>
          </div>
        </div>
      </Depth>
    </div>
  )
}
