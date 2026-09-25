/**
 * Estado mutável do "clima", compartilhado entre skyline e luzes.
 * flash: 0‑1, intensidade do relâmpago neste frame.
 */
export const atmosphere = { flash: 0 }

let next = 8
let start = -1

/** Relâmpago de tempos em tempos: dois pulsos rápidos. Chame uma vez por frame. */
export function updateLightning(time) {
  if (start < 0 && time > next) start = time
  if (start < 0) return (atmosphere.flash = 0)
  const t = time - start
  const pulse = (c, w) => Math.exp(-(((t - c) / w) ** 2))
  atmosphere.flash = pulse(0.05, 0.05) * 0.8 + pulse(0.28, 0.09)
  if (t > 0.8) {
    start = -1
    next = time + 14 + Math.random() * 16
  }
}
