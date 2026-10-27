import { cancelFrame, frame } from 'motion/react'
import { useEffect, useRef } from 'react'

/**
 * Like motion's useAnimationFrame, but only while `active`: while it isn't, nothing is
 * scheduled at all, so a page with nothing moving on screen stops asking for frames.
 * `time` counts from the first frame it ran, through any pauses.
 */
export function useFrameLoop(active: boolean, callback: (time: number, delta: number) => void) {
  const latest = useRef(callback)
  const start = useRef<number | null>(null)
  useEffect(() => {
    latest.current = callback
  })

  useEffect(() => {
    if (!active) return
    const step = ({ timestamp, delta }: { timestamp: number; delta: number }) => {
      start.current ??= timestamp
      latest.current(timestamp - start.current, delta)
    }
    frame.update(step, true)
    return () => cancelFrame(step)
  }, [active])
}
