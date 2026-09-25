import { useMemo } from 'react'
import { BackSide, MirroredRepeatWrapping } from 'three'
import { ASSETS } from '../config/assets'
import { useOptionalTexture } from '../lib/useOptionalAsset'
import { makeSkylineTexture } from './placeholders'

const RADIUS = 520
const HEIGHT = 260

/**
 * Pano de fundo distante: um cilindro virado para dentro com o skyline.
 * Não sofre neblina nem tone mapping, então fica "infinitamente longe"
 * enquanto a pista some na neblina à frente dele.
 */
export function Skyline() {
  const { url, repeat, horizon, skyColor } = ASSETS.skyline
  const photo = useOptionalTexture(url, (t) => {
    t.wrapS = MirroredRepeatWrapping
  })
  const placeholder = useMemo(() => makeSkylineTexture(horizon), [horizon])
  const map = photo ?? placeholder
  map.repeat.set(repeat, 1)

  // alinha a base dos prédios com y ≈ 0
  const y = HEIGHT / 2 - horizon * HEIGHT - 2

  return (
    <group>
      <mesh position={[0, y, 0]} renderOrder={-1}>
        <cylinderGeometry args={[RADIUS, RADIUS, HEIGHT, 96, 1, true]} />
        <meshBasicMaterial map={map} side={BackSide} fog={false} toneMapped={false} color="#c8d4ff" />
      </mesh>
      {/* tampa do céu acima do cilindro */}
      <mesh position-y={y + HEIGHT / 2 - 0.5} rotation-x={Math.PI / 2}>
        <circleGeometry args={[RADIUS, 96]} />
        <meshBasicMaterial color={skyColor} fog={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
