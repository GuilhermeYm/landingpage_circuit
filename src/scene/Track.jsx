import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { ASSETS } from '../config/assets'
import { useOptionalTexture } from '../lib/useOptionalAsset'
import { makeAsphaltTexture } from './placeholders'
import { CHECKPOINT_POINTS, frameAt, halfWidth } from './track'

const SEGMENTS = 900

/**
 * Malha da pista gerada ao longo da curva: uma "fita" com UV.x atravessando a
 * largura e UV.y avançando em metros / tileLength, para a textura reta
 * repetir sem distorcer.
 */
function buildRibbon(tileLength) {
  const positions = []
  const uvs = []
  const indices = []
  const f = frameAt(0)
  const prev = f.point.clone()
  let dist = 0

  for (let i = 0; i <= SEGMENTS; i++) {
    frameAt(i / SEGMENTS, f)
    if (i > 0) dist += f.point.distanceTo(prev)
    prev.copy(f.point)
    const l = f.point.clone().addScaledVector(f.side, halfWidth)
    const r = f.point.clone().addScaledVector(f.side, -halfWidth)
    positions.push(l.x, 0.02, l.z, r.x, 0.02, r.z)
    uvs.push(0, dist / tileLength, 1, dist / tileLength)
    if (i < SEGMENTS) {
      const a = i * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export function Track() {
  const { url, tileLength } = ASSETS.trackStraight
  const geometry = useMemo(() => buildRibbon(tileLength), [tileLength])
  const photo = useOptionalTexture(url)
  const placeholder = useMemo(() => makeAsphaltTexture(), [])

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial map={photo ?? placeholder} roughness={0.5} metalness={0.15} />
      </mesh>
      {CHECKPOINT_POINTS.filter((cp) => cp.decal).map((cp) => (
        <CurveDecal key={cp.id} checkpoint={cp} />
      ))}
    </group>
  )
}

/**
 * Textura de curva (não tileável) aplicada como um quadrado sobre o canto.
 * Só aparece se o arquivo existir. Ajuste `size` e `rotation` (radianos) no
 * config do checkpoint até a curva da imagem casar com a pista.
 */
function CurveDecal({ checkpoint }) {
  const { url, size = 34, rotation = 0 } = checkpoint.decal
  const map = useOptionalTexture(url)
  if (!map) return null
  const inward = checkpoint.outward.clone().multiplyScalar(-size * 0.2)
  return (
    <mesh
      position={[checkpoint.center.x + inward.x, 0.04, checkpoint.center.z + inward.z]}
      rotation={[-Math.PI / 2, 0, rotation]}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={map} roughness={0.35} metalness={0.35} polygonOffset polygonOffsetFactor={-1} />
    </mesh>
  )
}
