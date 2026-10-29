// Runs the dot field (particleField.ts) off the main thread, on a canvas handed over by
// Particles.tsx; the page only forwards the mouse, the window size and when to hold still.

import { createField, type Field } from './particleField'

export type FieldMessage =
  | { type: 'init'; canvas: OffscreenCanvas; reduced: boolean; size: [number, number, number] }
  | { type: 'resize'; size: [number, number, number] }
  | { type: 'move' | 'click'; x: number; y: number }
  | { type: 'hold'; held: boolean }

let field: Field | null = null

self.onmessage = ({ data }: MessageEvent<FieldMessage>) => {
  if (data.type === 'init') {
    field = createField(data.canvas, data.reduced)
    field.resize(...data.size)
  } else if (data.type === 'resize') field?.resize(...data.size)
  else if (data.type === 'hold') field?.hold(data.held)
  else field?.[data.type](data.x, data.y)
}
