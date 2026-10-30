import { motion, useScroll, useSpring } from 'motion/react'
import { chapters, useActiveChapter } from './chapters'
import { Cursor } from './components/Cursor'
import { PointerProvider } from './components/Mouse'
import { Nav } from './components/Nav'
import { Backdrop } from './components/Backdrop'
import { SectionBreak } from './components/SectionBreak'
import { SectionNav } from './components/SectionNav'
import { About } from './sections/About'
import { Hero } from './sections/Hero'
import { Hobbies } from './sections/Hobbies'
import { Projects } from './sections/Projects'

/**
 * Everything that follows the section in view: the background, the progress bar and the
 * section indicator. Kept apart, so moving on to the next section re-renders only these
 * and not the whole page.
 */
function ChapterFrame() {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const active = useActiveChapter()
  const [a, b] = chapters[active].accent

  return (
    <>
      <Backdrop accent={chapters[active].accent} />
      <motion.div
        style={{ scaleX: progress }}
        animate={{ backgroundImage: `linear-gradient(90deg, ${a}, ${b})` }}
        transition={{ duration: 0.8 }}
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left will-change-transform"
      />
      <SectionNav active={active} />
    </>
  )
}

export default function App() {
  return (
    <PointerProvider>
      <div className="relative overflow-x-clip">
        <ChapterFrame />
        <Nav />
        <main>
          <Hero />
          <SectionBreak to="ueber-mich" />
          <About />
          <SectionBreak to="hobbys" />
          <Hobbies />
          <SectionBreak to="projekte" />
          <Projects />
        </main>
        <Cursor />
      </div>
    </PointerProvider>
  )
}
