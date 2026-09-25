/**
 * Estado mutável do "clima", compartilhado entre skyline, luzes e raios.
 * flash:  0‑1, intensidade do relâmpago neste frame.
 * strike: contador — muda a cada novo raio (Lightning gera um novo desenho).
 * age:    segundos desde o início do raio atual.
 */
export const atmosphere = { flash: 0, strike: 0, age: 0 }

let next = 6
let start = -1
let second = 0

/** Relâmpago de tempos em tempos: dois pulsos rápidos. Chame uma vez por frame. */
export function updateLightning(time) {
  if (start < 0 && time > next) {
    start = time
    atmosphere.strike++
    // às vezes um terceiro pulso, mais tardio
    second = Math.random() < 0.4 ? 0.5 + Math.random() * 0.2 : -1
  }
  if (start < 0) return (atmosphere.flash = 0)
  const t = (atmosphere.age = time - start)
  const pulse = (c, w) => Math.exp(-(((t - c) / w) ** 2))
  atmosphere.flash = pulse(0.05, 0.05) * 0.8 + pulse(0.28, 0.09) + (second > 0 ? pulse(second, 0.06) * 0.6 : 0)
  if (t > 1.2) {
    start = -1
    atmosphere.flash = 0
    next = time + 7 + Math.random() * 11
  }
}
