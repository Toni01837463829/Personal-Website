/**
 * Soft light as a radial gradient: the falloff of a disc under a Gaussian blur, without the
 * blur filter. A wide blur is recomputed whenever anything around it is redrawn (scrolling,
 * a neighbor animating), a gradient is drawn once. The element has to reach as far as the
 * blurred light would: the gradient fades out at its closest side.
 */
const falloff = {
  // A disc about twice as wide as the blur, like most of the glows
  soft: [
    [0, 1],
    [15, 0.93],
    [30, 0.73],
    [45, 0.45],
    [60, 0.21],
    [75, 0.07],
    [90, 0.015],
    [100, 0],
  ],
  // A disc much wider than the blur: an even core with a soft rim
  flat: [
    [0, 1],
    [30, 0.99],
    [45, 0.89],
    [60, 0.57],
    [75, 0.2],
    [90, 0.03],
    [100, 0],
  ],
}

/** `alpha` is how strong the light is in the middle. */
export const glow = (color: string, alpha: number, shape: keyof typeof falloff = 'soft') =>
  `radial-gradient(closest-side, ${falloff[shape]
    .map(([at, k]) => `color-mix(in srgb, ${color} ${+(alpha * k * 100).toFixed(2)}%, transparent) ${at}%`)
    .join(', ')})`

/** The same falloff as a mask, for light that is a gradient of its own. */
export const glowMask = (shape: keyof typeof falloff = 'soft') =>
  `radial-gradient(closest-side, ${falloff[shape].map(([at, k]) => `rgb(0 0 0 / ${k}) ${at}%`).join(', ')})`
