/**
 * Traçado da pista, visto de cima (plano XZ).
 *
 * `corners` é um polígono: cada vértice vira uma curva arredondada com raio
 * `cornerRadius`. Os checkpoints (config/checkpoints.js) apontam para essas
 * curvas pelo índice.
 *
 *   0 ─────────────── 1
 *   │                 │
 *   │           3 ─── 2
 *   │           │
 *   5 ───────── 4
 */
export const TRACK = {
  corners: [
    [-84, 84],
    [84, 84],
    [84, 0],
    [28, 0],
    [28, -84],
    [-84, -84],
  ],
  cornerRadius: 22,
  width: 11,
  /** posição inicial do carro: fração (0‑1) do trecho entre a curva 0 e a 1 */
  startAlongFirstEdge: 0.3,
}

/** Parâmetros da "física" simplificada. Unidades: metros e segundos. */
export const DRIVING = {
  maxSpeed: 46,
  maxReverse: 10,
  acceleration: 16,
  brake: 34,
  drag: 5,
  steer: 34,
  /** quanto a curva empurra o carro para fora em alta velocidade */
  centrifugal: 0.45,
  /** aderência lateral (maior = menos derrapagem) */
  grip: 4.2,
  /** aderência com o freio de mão (Espaço) */
  handbrakeGrip: 0.9,
  /** distância (m) ao longo da pista para "entrar" num checkpoint */
  checkpointRadius: 26,
}
