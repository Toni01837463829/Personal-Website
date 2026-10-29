import { useEffect, type RefObject } from 'react'

/**
 * Marks the element with data-offscreen while it is off screen, which pauses every CSS
 * animation inside it (index.css). Endless animations would otherwise keep the page working
 * on every frame, wherever you are on it.
 */
export function usePauseOffscreen(ref: RefObject<Element | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-offscreen', !e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
}
