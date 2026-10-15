import { motion, useScroll, useSpring } from 'motion/react'
import { PointerProvider } from './components/Mouse'
import { Nav } from './components/Nav'
import { Particles } from './components/Particles'
import { About } from './sections/About'
import { Contact } from './sections/Contact'
import { Hero } from './sections/Hero'
import { Hobbies } from './sections/Hobbies'
import { Projects } from './sections/Projects'

export default function App() {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <PointerProvider>
      <div className="relative">
        <Particles />
        <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-ink" />
        <Nav />
        <main>
          <Hero />
          <About />
          <Hobbies />
          <Projects />
          <Contact />
        </main>
      </div>
    </PointerProvider>
  )
}
