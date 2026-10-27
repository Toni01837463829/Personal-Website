import type { TargetAndTransition, Transition } from 'motion/react'

/**
 * Props for a motion element that loops through `frames` while `on` and otherwise settles
 * on `rest`. Keeps endless animations from running while they are off screen, where they
 * would still cost a frame on every screen refresh.
 */
export const loop = (on: boolean, frames: TargetAndTransition, rest: TargetAndTransition, transition: Transition) =>
  on ? { animate: frames, transition: { ...transition, repeat: Infinity } } : { animate: rest, transition: { duration: 0.4 } }
