import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, CanvasTexture, Color, MathUtils, MirroredRepeatWrapping, Vector3 } from 'three'
import { ASSETS } from '../config/assets'
import { DRIVING } from '../config/track'
import { useOptionalTexture } from '../lib/useOptionalAsset'
import { makeSkylineTexture } from './placeholders'
import { FOG_COLOR } from './constants'
import { atmosphere, updateLightning } from './atmosphere'
import { vehicle } from './vehicleState'

const RADIUS = 520

/** ajustes do skyline procedural, usado enquanto não há foto */
const PLACEHOLDER = { repeat: 2, horizon: 0.28, height: 260, skyColor: '#02040a', tint: '#c8d4ff', haze: 30, towerX: 0.5 }

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * - blur de profundidade (disco de Poisson), mais forte em alta velocidade
 * - rastro horizontal quando a câmera gira (curvas)
 * - brilho (bloom falso) em volta das luzes
 * - nuvens balançando devagar, sem mexer na torre
 * - relâmpago
 */
const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float repeatX;
  uniform vec3 tint;
  uniform float time;
  uniform float blur;
  uniform float smear;
  uniform float glow;
  uniform float flash;
  uniform float towerX;
  varying vec2 vUv;

  const vec2 DISK[12] = vec2[](
    vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457), vec2(-0.203, 0.621),
    vec2(0.962, -0.195), vec2(0.473, -0.480), vec2(0.519, 0.767), vec2(0.185, -0.893),
    vec2(0.507, 0.064), vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
  );

  void main() {
    vec2 uv = vec2(vUv.x * repeatX, vUv.y);

    // posição dentro da imagem (a textura é espelhada a cada repetição)
    float lx = fract(uv.x);
    if (mod(floor(uv.x), 2.0) == 1.0) lx = 1.0 - lx;
    float clouds = smoothstep(0.72, 0.86, vUv.y) * smoothstep(0.03, 0.08, abs(lx - towerX));
    uv.x += sin(time * 0.06 + vUv.y * 4.0) * 0.012 * clouds;
    uv.y += sin(time * 0.045 + lx * 9.0) * 0.004 * clouds;

    vec3 col = vec3(0.0);
    vec3 bright = vec3(0.0);
    for (int i = 0; i < 12; i++) {
      float k = float(i) / 11.0 - 0.5;
      vec2 o = DISK[i] * blur * vec2(1.0 / repeatX, 1.0) + vec2(smear * k, 0.0);
      col += texture2D(map, uv + o).rgb;
      if (i < 6) {
        vec3 b = texture2D(map, uv + o * 4.0 + DISK[11 - i] * 0.004).rgb;
        bright += max(b - 0.45, 0.0);
      }
    }
    col /= 12.0;
    bright /= 6.0;

    col = col * tint + bright * glow * vec3(1.0, 0.75, 0.5);
    // relâmpago: acende mais o céu que a cidade
    float sky = smoothstep(0.6, 0.9, vUv.y);
    col += flash * (col * 1.6 + vec3(0.22, 0.28, 0.42) * (0.3 + sky));

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

/**
 * Pano de fundo distante: um cilindro virado para dentro com o skyline.
 * Não sofre neblina, então fica "infinitamente longe" enquanto a pista some
 * na neblina à frente dele. Nas curvas ele atrasa um pouco em relação à
 * câmera e ganha rastro, o que dá sensação de velocidade.
 */
export function Skyline() {
  const photo = useOptionalTexture(ASSETS.skyline.url, (t) => {
    t.wrapS = MirroredRepeatWrapping
  })
  const placeholder = useMemo(() => makeSkylineTexture(PLACEHOLDER.horizon), [])
  const hazeMap = useMemo(makeHazeTexture, [])
  const group = useRef()
  const cap = useRef()
  const motion = useRef({ yaw: null, rate: 0 }).current
  const dir = useMemo(() => new Vector3(), [])

  let map, repeat, horizon, height, skyColor, tint, haze, towerX
  if (photo) {
    ;({ repeat, horizon, skyColor, tint, haze, towerX } = ASSETS.skyline)
    map = photo
    // altura que mantém a proporção original da imagem
    const { width, height: h } = photo.image
    height = (2 * Math.PI * RADIUS) / repeat / (width / h)
  } else {
    ;({ repeat, horizon, height, skyColor, tint, haze, towerX } = PLACEHOLDER)
    map = placeholder
  }

  const material = useRef()
  const uniforms = useMemo(
    () => ({
      map: { value: null },
      repeatX: { value: 1 },
      tint: { value: new Color() },
      time: { value: 0 },
      blur: { value: 0 },
      smear: { value: 0 },
      glow: { value: 0.9 },
      flash: { value: 0 },
      towerX: { value: 0.5 },
    }),
    [],
  )
  // lido no useFrame e aplicado direto no material (fonte única da verdade)
  const settings = useRef()
  settings.current = { map, repeat, tint, towerX: towerX ?? 0.5 }
  const skyBase = useMemo(() => new Color(skyColor), [skyColor])

  useFrame(({ camera, clock }, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const t = clock.elapsedTime

    // velocidade angular da câmera (rad/s), suavizada
    camera.getWorldDirection(dir)
    const yaw = Math.atan2(dir.x, dir.z)
    if (motion.yaw !== null && dt > 0) {
      const d = Math.atan2(Math.sin(yaw - motion.yaw), Math.cos(yaw - motion.yaw))
      motion.rate = MathUtils.damp(motion.rate, d / dt, 6, dt)
    }
    motion.yaw = yaw

    const u = material.current.uniforms
    const s = settings.current
    u.map.value = s.map
    u.repeatX.value = s.repeat
    u.tint.value.set(s.tint)
    u.towerX.value = s.towerX

    const speed = Math.abs(vehicle.speed) / DRIVING.maxSpeed
    u.time.value = t
    u.blur.value = 0.0012 + speed * 0.0022
    u.smear.value = MathUtils.clamp(motion.rate * 0.003, -0.008, 0.008)
    // a cidade "arrasta" um pouco atrás da câmera nas curvas
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, MathUtils.clamp(motion.rate * 0.05, -0.1, 0.1), 3, dt)

    updateLightning(t)
    u.flash.value = atmosphere.flash
    cap.current.material.color.copy(skyBase).multiplyScalar(1 + atmosphere.flash * 2.5)
  })

  // a fração `horizon` da imagem fica em y ≈ 0 (onde a neblina encontra o chão)
  const y = height / 2 - horizon * height - 2

  return (
    <group ref={group}>
      <mesh position={[0, y, 0]} renderOrder={-1}>
        <cylinderGeometry args={[RADIUS, RADIUS, height, 128, 1, true]} />
        <shaderMaterial
          ref={material}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>
      {/* névoa: dissolve a base da cidade na cor da neblina do chão */}
      <mesh position-y={haze / 2 - 2} renderOrder={-1}>
        <cylinderGeometry args={[RADIUS - 5, RADIUS - 5, haze, 128, 1, true]} />
        <meshBasicMaterial map={hazeMap} color={FOG_COLOR} side={BackSide} transparent depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
      {/* tampa do céu acima do cilindro */}
      <mesh ref={cap} position-y={y + height / 2 - 0.5} rotation-x={Math.PI / 2}>
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
