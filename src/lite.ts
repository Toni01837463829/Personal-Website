import { useSyncExternalStore } from 'react'

// "Lite" mode for weak graphics chips, such as the ones built into most laptops (Intel UHD
// and the like). Those draw the page's own elements just as well, but run out of breath
// putting all the layers on top of each other every frame: frosted glass that has to blur
// whatever moves behind it, and the gliding logo wall. In lite mode the html element gets the
// `lite` class (the `lite:` variant in index.css), glass is frosted without the blur, and the
// logo wall stands still.
// It is switched on for chips known to be weak, or once the page turns out to stutter.
// `?lite=1` and `?lite=0` force it either way, for trying it out.

const WEAK = /intel|mali|adreno|powervr|swiftshader|llvmpipe|microsoft basic render/i

function gpuName() {
  try {
    const gl = document.createElement('canvas').getContext('webgl')
    if (!gl) return ''
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return name
  } catch {
    return ''
  }
}

const forced = new URLSearchParams(location.search).get('lite')
let lite = forced ? forced === '1' : WEAK.test(gpuName())
const listeners = new Set<() => void>()

function set(on: boolean) {
  lite = on
  document.documentElement.classList.toggle('lite', on)
  listeners.forEach((l) => l())
}

set(lite)

// Otherwise it watches the frames for a while once the entrance has played: if many of them
// take well over twice as long as they should (30 fps, as on battery saver, still passes), the chip can't keep up and lite mode takes over
if (!lite && !forced) {
  setTimeout(() => {
    let prev = 0
    let frames = 0
    let slow = 0
    const watch = (now: number) => {
      // A long gap is the tab having been in the background, not a slow frame
      if (prev && now - prev < 1000) {
        frames++
        if (now - prev > 45) slow++
      }
      prev = now
      if (frames < 180) requestAnimationFrame(watch)
      else if (slow > frames / 4) set(true)
    }
    requestAnimationFrame(watch)
  }, 3000)
}

/** Whether lite mode is on; the component re-renders when it switches on. */
export function useLite() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => lite,
  )
}
