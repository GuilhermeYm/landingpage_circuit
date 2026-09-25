import { CatmullRomCurve3, Vector3 } from 'three'
import { TRACK } from '../config/track'
import { CHECKPOINTS } from '../config/checkpoints'

const v = (x, z) => new Vector3(x, 0, z)

/** Transforma o polígono de cantos em pontos de controle com curvas arredondadas. */
function buildControlPoints({ corners, cornerRadius: r }) {
  const pts = []
  const n = corners.length
  for (let i = 0; i < n; i++) {
    const prev = v(...corners[(i - 1 + n) % n])
    const cur = v(...corners[i])
    const next = v(...corners[(i + 1) % n])
    const toPrev = prev.clone().sub(cur).normalize()
    const toNext = next.clone().sub(cur).normalize()

    pts.push(cur.clone().addScaledVector(toPrev, r))
    // ápice da curva, puxado para dentro para o arco ficar redondo
    pts.push(cur.clone().addScaledVector(toPrev.clone().add(toNext), r * 0.3))
    pts.push(cur.clone().addScaledVector(toNext, r))

    // pontos intermediários mantêm as retas retas
    const edge = next.distanceTo(cur) - 2 * r
    const steps = Math.floor(edge / (r * 1.5))
    for (let s = 1; s <= steps; s++) {
      pts.push(cur.clone().addScaledVector(toNext, r + (edge * s) / (steps + 1)))
    }
  }
  return pts
}

export const curve = new CatmullRomCurve3(buildControlPoints(TRACK), true, 'centripetal')
curve.arcLengthDivisions = 2000
export const trackLength = curve.getLength()
export const halfWidth = TRACK.width / 2

export const wrap = (u) => ((u % 1) + 1) % 1
/** menor distância (com sinal) entre dois parâmetros u numa pista fechada */
export const uDelta = (a, b) => {
  const d = wrap(a - b)
  return d > 0.5 ? d - 1 : d
}

/** Ponto, tangente e vetor lateral (aponta para a ESQUERDA) na posição u. */
export function frameAt(u, out = { point: new Vector3(), tangent: new Vector3(), side: new Vector3() }) {
  u = wrap(u)
  curve.getPointAt(u, out.point)
  curve.getTangentAt(u, out.tangent)
  out.side.set(out.tangent.z, 0, -out.tangent.x).normalize()
  return out
}

const _t1 = new Vector3()
const _t2 = new Vector3()
/** Curvatura com sinal (1/m). Positivo = curva para a esquerda. */
export function curvatureAt(u, ds = 2) {
  const du = ds / trackLength
  curve.getTangentAt(wrap(u - du / 2), _t1)
  curve.getTangentAt(wrap(u + du / 2), _t2)
  return (_t1.z * _t2.x - _t1.x * _t2.z) / ds
}

/** u mais próximo de um ponto qualquer (amostragem — use só na inicialização). */
export function nearestU(p, samples = 3000) {
  let best = 0
  let bestD = Infinity
  const tmp = new Vector3()
  for (let i = 0; i < samples; i++) {
    const d = curve.getPointAt(i / samples, tmp).distanceToSquared(p)
    if (d < bestD) {
      bestD = d
      best = i / samples
    }
  }
  return best
}

const [c0, c1] = TRACK.corners
export const START_U = nearestU(v(...c0).lerp(v(...c1), TRACK.startAlongFirstEdge))

/**
 * Checkpoints resolvidos em coordenadas de mundo: posição na pista (u),
 * lado de fora da curva e onde fica o marcador.
 */
export const CHECKPOINT_POINTS = CHECKPOINTS.map((cp, index) => {
  const u = nearestU(v(...TRACK.corners[cp.corner]))
  const { point, tangent, side } = frameAt(u)
  const turn = Math.sign(curvatureAt(u, 6)) || 1
  const outward = side.clone().multiplyScalar(-turn)
  return {
    ...cp,
    index,
    step: String(index + 1).padStart(2, '0'),
    u,
    center: point.clone(),
    tangent: tangent.clone(),
    outward,
    marker: point.clone().addScaledVector(outward, halfWidth + 4),
  }
})
