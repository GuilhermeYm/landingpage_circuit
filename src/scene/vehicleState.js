import { Vector3 } from 'three'
import { START_U } from './track'

/**
 * Estado mutável do carro, lido a cada frame pela câmera, HUD e áudio.
 * Fica fora do React de propósito: nada aqui deve disparar re-render.
 */
export const vehicle = {
  u: START_U,
  speed: 0,
  lateral: 0,
  latVel: 0,
  drift: 0,
  heading: 0,
  position: new Vector3(),
  forward: new Vector3(0, 0, 1),
}
