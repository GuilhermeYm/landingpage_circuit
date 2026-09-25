import { Vector3 } from 'three'
import { START_U } from './track'

/**
 * Estado mutável do carro, lido a cada frame pela câmera, HUD, efeitos e
 * áudio. Fica fora do React de propósito: nada aqui deve disparar re-render.
 */
export const vehicle = {
  u: START_U,
  speed: 0,
  lateral: 0,
  latVel: 0,
  /** ângulo visual da carroceria em relação à pista (rad, + = bico p/ esquerda) */
  drift: 0,
  heading: 0,
  position: new Vector3(),
  forward: new Vector3(0, 0, 1),
}

/** Estado do drift e do placar. */
export const drift = {
  active: false,
  /** 1 = drift para a esquerda, -1 = para a direita */
  dir: 0,
  angle: 0,
  time: 0,
  /** 0‑1, usado por fumaça, som e câmera */
  intensity: 0,
  /** pontos do drift atual (ainda não somados) */
  points: 0,
  multiplier: 1,
  total: 0,
  best: 0,
  /** último resultado: { type: 'bank' | 'fail', value, id } — o HUD anima quando o id muda */
  last: null,
}

let resultId = 0
export function endDrift(failed) {
  if (!drift.active) return
  const value = Math.round(drift.points * drift.multiplier)
  if (value > 50) {
    if (failed) drift.last = { type: 'fail', value, id: ++resultId }
    else {
      drift.total += value
      drift.best = Math.max(drift.best, value)
      drift.last = { type: 'bank', value, id: ++resultId }
    }
  }
  drift.active = false
  drift.dir = 0
  drift.time = 0
  drift.points = 0
  drift.multiplier = 1
}
