import { Vector3 } from 'three'
import { TRACK } from '../config/track'
import { nearestU, trackLength } from './track'

/**
 * Mapeia (distância ao longo da pista, posição lateral) → UV dentro da faixa
 * curva da imagem do Meshy.
 *
 * A imagem é uma curva de 90° vista de cima, com a pista entrando pela borda
 * esquerda e saindo pela de baixo. Em vez de medir a curva à mão, traçamos
 * raios a partir do canto inferior esquerdo e procuramos as duas faixas
 * brancas das bordas: assim qualquer imagem nesse formato "encaixa" sozinha.
 */
const HALF_PI = Math.PI / 2
const RAYS = 90

/**
 * Candidatos a faixa ao longo de um raio: picos de brilho estreitos (uma faixa
 * pintada é bem mais clara que o asfalto logo antes e logo depois dela). Não
 * depende da cor, então funciona mesmo com a faixa tingida pelos reflexos.
 */
function lineCandidates(lum) {
  const n = lum.length
  const score = new Float32Array(n)
  for (let t = 8; t < n - 8; t++) {
    let around = 0
    for (let j = 4; j <= 8; j++) around += lum[t - j] + lum[t + j]
    score[t] = lum[t] - around / 10
  }
  const out = []
  for (let t = 9; t < n - 9; t++) {
    if (score[t] > 28 && score[t] >= score[t - 1] && score[t] > score[t + 1]) {
      if (out.length && t - out[out.length - 1] < 6) continue
      out.push(t)
    }
  }
  return out
}

/** raio (px) da faixa interna e da externa para cada ângulo θ ∈ [0, 90°] */
function detectLines(image) {
  const W = image.width
  const H = image.height
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(image, 0, 0)
  const data = ctx.getImageData(0, 0, W, H).data

  const candidates = []
  for (let k = 0; k <= RAYS; k++) {
    // nas bordas exatas o raio corre sobre a borda da imagem; recua um pouco
    const th = Math.min(Math.max((k / RAYS) * HALF_PI, 0.01), HALF_PI - 0.01)
    const lum = []
    for (let t = 0; ; t++) {
      const x = Math.round(t * Math.sin(th))
      const y = Math.round(H - 1 - t * Math.cos(th))
      if (x >= W || y < 0) break
      const i = (y * W + x) * 4
      lum.push(0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2])
    }
    candidates.push(lineCandidates(lum))
  }

  // no primeiro raio (borda esquerda) a primeira e a última faixa são as bordas
  // da pista; daí em diante cada faixa é seguida pelo candidato mais próximo
  const first = candidates[0]
  if (first.length < 2) return null
  const follow = (start) => {
    const out = new Float32Array(RAYS + 1).fill(NaN)
    let prev = start
    let miss = 0
    for (let k = 0; k <= RAYS; k++) {
      let best = NaN
      for (const c of candidates[k]) if (Math.abs(c - prev) <= 14 + miss * 4 && !(Math.abs(c - prev) >= Math.abs(best - prev))) best = c
      if (Number.isNaN(best)) miss++
      else {
        out[k] = best
        prev = best
        miss = 0
      }
    }
    return out
  }
  const inner = follow(first[0])
  const outer = follow(first[first.length - 1])
  if (fillGaps(inner) && fillGaps(outer)) return { inner: smooth(inner), outer: smooth(outer), H }
  return null
}

/** interpola raios que não foram detectados (raio caiu num buraco da faixa) */
function fillGaps(a) {
  const known = [...a.keys()].filter((i) => !Number.isNaN(a[i]))
  if (known.length < a.length * 0.5) return false
  for (let i = 0; i < a.length; i++) {
    if (!Number.isNaN(a[i])) continue
    const lo = known.findLast((k) => k < i)
    const hi = known.find((k) => k > i)
    a[i] = lo === undefined ? a[hi] : hi === undefined ? a[lo] : a[lo] + ((a[hi] - a[lo]) * (i - lo)) / (hi - lo)
  }
  return true
}

function smooth(a) {
  return a.map((_, i) => {
    let sum = 0
    let n = 0
    for (let j = Math.max(0, i - 2); j <= Math.min(a.length - 1, i + 2); j++) {
      sum += a[j]
      n++
    }
    return sum / n
  })
}

/**
 * Cria a função de UV para uma imagem de curva. Devolve null se não achar
 * as faixas (a pista então usa a textura procedural).
 */
export function createTrackUV(image) {
  const lines = detectLines(image)
  if (!lines) {
    console.warn('[pista] não achei as faixas brancas na textura de curva — usando placeholder')
    return null
  }
  const { inner, outer, H } = lines

  // raio numa posição contínua do raio k (0…RAYS) e lateral r (0 interna … 1 externa)
  const radius = (k, r) => {
    const i = Math.min(Math.floor(k), RAYS - 1)
    const f = k - i
    const ri = inner[i] + (inner[i + 1] - inner[i]) * f
    const ro = outer[i] + (outer[i + 1] - outer[i]) * f
    return ri + (ro - ri) * r
  }
  const point = (k, r) => {
    const th = (k / RAYS) * HALF_PI
    const d = radius(k, r)
    return [d * Math.sin(th), d * Math.cos(th)]
  }

  // comprimento da linha central → a textura avança com velocidade constante
  const arc = new Float32Array(RAYS + 1)
  let widthPx = 0
  for (let k = 0; k <= RAYS; k++) {
    const [x0, y0] = point(k, 0)
    const [x1, y1] = point(k, 1)
    widthPx += Math.hypot(x1 - x0, y1 - y0) / (RAYS + 1)
    if (k > 0) {
      const [a, b] = point(k - 1, 0.5)
      const [c, d] = point(k, 0.5)
      arc[k] = arc[k - 1] + Math.hypot(c - a, d - b)
    }
  }
  const arcPx = arc[RAYS]
  const kAt = (f) => {
    const target = f * arcPx
    let i = 1
    while (i < RAYS && arc[i] < target) i++
    return i - 1 + (target - arc[i - 1]) / (arc[i] - arc[i - 1] || 1)
  }

  // metros de pista que a curva da imagem representa
  const imageLength = (arcPx / widthPx) * TRACK.width

  // ápices das curvas da pista; entre dois ápices a imagem percorre um número
  // inteiro de "idas", então todo ápice cai no meio da curva da imagem
  const apexes = TRACK.corners.map(([x, z]) => nearestU(new Vector3(x, 0, z)) * trackLength).sort((a, b) => a - b)
  let phase = 0.5
  const segments = apexes.map((start, i) => {
    const next = i + 1 < apexes.length ? apexes[i + 1] : apexes[0] + trackLength
    const spans = Math.max(1, Math.round((next - start) / imageLength))
    const seg = { start, length: next - start, spans, phase }
    phase += spans
    return seg
  })
  const phaseAt = (s) => {
    if (s < apexes[0]) s += trackLength
    const seg = segments.findLast((g) => g.start <= s) ?? segments[segments.length - 1]
    return seg.phase + (seg.spans * (s - seg.start)) / seg.length
  }

  const EPS = 0.003
  /**
   * @param s distância ao longo da pista (m)
   * @param r posição lateral: 0 = faixa interna (lado esquerdo), 1 = externa
   */
  return (s, r) => {
    const p = phaseAt(s) % 2
    const f = Math.min(Math.max(p <= 1 ? p : 2 - p, EPS), 1 - EPS)
    const [x, y] = point(kAt(f), r)
    return [x / image.width, y / H]
  }
}
