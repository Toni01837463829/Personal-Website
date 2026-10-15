import { motion, useScroll, useSpring } from 'motion/react'
import { chapters, useActiveChapter } from './chapters'
import { Cursor } from './components/Cursor'
import { PointerProvider } from './components/Mouse'
import { Nav } from './components/Nav'
import { Particles } from './components/Particles'
import { SectionBreak } from './components/SectionBreak'
import { SectionNav } from './components/SectionNav'
import { About } from './sections/About'
import { Hero } from './sections/Hero'
import { Hobbies } from './sections/Hobbies'
import { Projects } from './sections/Projects'

export default function App() {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const active = useActiveChapter()
  const [a, b] = chapters[active].accent

  return (
    <PointerProvider>
      <div className="relative overflow-x-clip">
        <Particles accent={chapters[active].accent} />
        <motion.div
          style={{ scaleX: progress }}
          animate={{ backgroundImage: `linear-gradient(90deg, ${a}, ${b})` }}
          transition={{ duration: 0.8 }}
          className="fixed inset-x-0 top-0 z-50 h-1 origin-left"
        />
        <Nav />
        <SectionNav active={active} />
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
