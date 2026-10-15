import { useEffect, useState, type CSSProperties } from 'react'

/**
 * The page's sections in order. Each has its own accent pair, so moving from one section
 * to the next visibly shifts the color of the page.
 */
export const chapters = [
  { id: 'top', label: 'Start', accent: ['#4338ca', '#0284c7'] },
  { id: 'ueber-mich', label: 'Über mich', accent: ['#4338ca', '#0284c7'] },
  { id: 'hobbys', label: 'Hobbys', accent: ['#0e7490', '#059669'] },
  { id: 'projekte', label: 'Projekte', accent: ['#6d28d9', '#c026d3'] },
  { id: 'kontakt', label: 'Kontakt', accent: ['#ea580c', '#e11d48'] },
] as const

export type ChapterId = (typeof chapters)[number]['id']

export const chapter = (id: ChapterId) => chapters.find((c) => c.id === id)!

/** CSS variables that color everything inside with the section's accent. */
export const accentVars = (id: ChapterId) => {
  const [a, b] = chapter(id).accent
  return { '--accent-a': a, '--accent-b': b } as CSSProperties
}

/** Index of the section in view: the last one whose top has passed 40% of the viewport. */
export function useActiveChapter() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const update = () => {
      const line = window.innerHeight * 0.4
      let current = 0
      chapters.forEach((c, i) => {
        const el = document.getElementById(c.id)
        if (el && el.getBoundingClientRect().top <= line) current = i
      })
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4
      setActive(atBottom ? chapters.length - 1 : current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return active
}
