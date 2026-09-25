import { useMemo } from 'react'
import { BackSide, CanvasTexture, MirroredRepeatWrapping } from 'three'
import { ASSETS } from '../config/assets'
import { useOptionalTexture } from '../lib/useOptionalAsset'
import { makeSkylineTexture } from './placeholders'
import { FOG_COLOR } from './constants'

const RADIUS = 520

/** ajustes do skyline procedural, usado enquanto não há foto */
const PLACEHOLDER = { repeat: 2, horizon: 0.28, height: 260, skyColor: '#02040a', tint: '#c8d4ff', haze: 30 }

/**
 * Pano de fundo distante: um cilindro virado para dentro com o skyline.
 * Não sofre neblina nem tone mapping, então fica "infinitamente longe"
 * enquanto a pista some na neblina à frente dele.
 */
export function Skyline() {
  const photo = useOptionalTexture(ASSETS.skyline.url, (t) => {
    t.wrapS = MirroredRepeatWrapping
  })
  const placeholder = useMemo(() => makeSkylineTexture(PLACEHOLDER.horizon), [])
  const hazeMap = useMemo(makeHazeTexture, [])

  let map, repeat, horizon, height, skyColor, tint, haze
  if (photo) {
    ;({ repeat, horizon, skyColor, tint, haze } = ASSETS.skyline)
    map = photo
    // altura que mantém a proporção original da imagem
    const { width, height: h } = photo.image
    height = (2 * Math.PI * RADIUS) / repeat / (width / h)
  } else {
    ;({ repeat, horizon, height, skyColor, tint, haze } = PLACEHOLDER)
    map = placeholder
  }
  map.repeat.set(repeat, 1)

  // a fração `horizon` da imagem fica em y ≈ 0 (onde a neblina encontra o chão)
  const y = height / 2 - horizon * height - 2

  return (
    <group>
      <mesh position={[0, y, 0]} renderOrder={-1}>
        <cylinderGeometry args={[RADIUS, RADIUS, height, 128, 1, true]} />
        <meshBasicMaterial map={map} side={BackSide} fog={false} toneMapped={false} color={tint} />
      </mesh>
      {/* névoa: dissolve a base da cidade na cor da neblina do chão */}
      <mesh position-y={haze / 2 - 2} renderOrder={-1}>
        <cylinderGeometry args={[RADIUS - 5, RADIUS - 5, haze, 128, 1, true]} />
        <meshBasicMaterial map={hazeMap} color={FOG_COLOR} side={BackSide} transparent depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
      {/* tampa do céu acima do cilindro */}
      <mesh position-y={y + height / 2 - 0.5} rotation-x={Math.PI / 2}>
        <circleGeometry args={[RADIUS, 128]} />
        <meshBasicMaterial color={skyColor} fog={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** gradiente vertical: opaco embaixo, transparente em cima */
function makeHazeTexture() {
  const c = document.createElement('canvas')
  c.width = 1
  c.height = 128
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 128)
  grad.addColorStop(0, 'rgba(255,255,255,0)')
  grad.addColorStop(0.6, 'rgba(255,255,255,0.35)')
  grad.addColorStop(1, 'rgba(255,255,255,0.9)')
  g.fillStyle = grad
  g.fillRect(0, 0, 1, 128)
  return new CanvasTexture(c)
}
