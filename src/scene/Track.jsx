import { useMemo } from 'react'
import { BufferGeometry, ClampToEdgeWrapping, Float32BufferAttribute } from 'three'
import { ASSETS } from '../config/assets'
import { TRACK } from '../config/track'
import { useOptionalTexture } from '../lib/useOptionalAsset'
import { makeAsphaltTexture } from './placeholders'
import { frameAt, halfWidth } from './track'
import { createTrackUV } from './trackUV'

const SEGMENTS = 1200
/** metros por repetição da textura procedural */
const PLACEHOLDER_TILE = 20

/**
 * Malha da pista: uma "fita" gerada ao longo da curva, com várias colunas na
 * largura (r = 0 lado esquerdo … 1 lado direito). Com a textura do Meshy ganha
 * acostamento dos dois lados, que some aos poucos (alpha) no chão molhado.
 */
function buildRibbon(trackUV) {
  const textured = !!trackUV
  const sh = textured ? ASSETS.track.shoulder : 0
  const cols = textured ? [-sh, 0, 0.25, 0.5, 0.75, 1, 1 + sh] : [0, 1]
  const positions = []
  const uvs = []
  const colors = []
  const indices = []
  const f = frameAt(0)
  const prev = f.point.clone()
  let dist = 0

  for (let i = 0; i <= SEGMENTS; i++) {
    frameAt(i / SEGMENTS, f)
    if (i > 0) dist += f.point.distanceTo(prev)
    prev.copy(f.point)
    for (const r of cols) {
      const lateral = halfWidth - r * TRACK.width
      positions.push(f.point.x + f.side.x * lateral, 0.02, f.point.z + f.side.z * lateral)
      if (textured) uvs.push(...trackUV(dist, r))
      else uvs.push(r, dist / PLACEHOLDER_TILE)
      colors.push(1, 1, 1, r < 0 || r > 1 ? 0 : 1)
    }
    if (i < SEGMENTS) {
      const n = cols.length
      for (let c = 0; c < n - 1; c++) {
        const a = i * n + c
        indices.push(a, a + 1, a + n, a + 1, a + n + 1, a + n)
      }
    }
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geo.setAttribute('color', new Float32BufferAttribute(colors, 4))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export function Track() {
  const photo = useOptionalTexture(ASSETS.track.url, (t) => {
    t.wrapS = t.wrapT = ClampToEdgeWrapping
  })
  const placeholder = useMemo(() => makeAsphaltTexture(), [])
  const trackUV = useMemo(() => photo && createTrackUV(photo.image), [photo])
  const texture = trackUV ? photo : placeholder
  const geometry = useMemo(() => buildRibbon(trackUV), [trackUV])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        map={texture}
        vertexColors
        transparent
        roughness={0.4}
        metalness={0.15}
        emissiveMap={texture}
        emissive="#ffffff"
        emissiveIntensity={trackUV ? 0.35 : 0}
      />
    </mesh>
  )
}
