// Runs the particle field (particleField.ts) off the page's own thread, on the canvas the
// page hands over. Everything after the first message is forwarded to the field.
import { createField, type FieldMessage } from './particleField'

let field: ReturnType<typeof createField> = null

self.onmessage = (e: MessageEvent<{ type: 'init'; canvas: OffscreenCanvas; reduced: boolean } | FieldMessage>) => {
  const msg = e.data
  if (msg.type === 'init') field = createField(msg.canvas, msg.reduced)
  else field?.handle(msg)
}
