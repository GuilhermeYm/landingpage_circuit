import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, MathUtils, Vector3 } from 'three'
import { playThunder } from '../lib/audio'
import { atmosphere } from './atmosphere'

/** distância do raio ao centro — um pouco à frente do cilindro do skyline */
const DISTANCE = 470
const TOP = 230
const BOTTOM = 30

/**
 * Raio desenhado a cada relâmpago: uma linha quebrada (deslocamento do ponto
 * médio) com galhos, virada em fitas com brilho aditivo. Nasce no céu, na
 * direção para onde a câmera olha, "desce" em ~60 ms e pisca junto com o
 * flash. O chão molhado reflete de graça (MeshReflectorMaterial).
 */
export function Lightning() {
  const mesh = useRef()
  const glow = useRef()
  const state = useRef({ strike: 0 }).current
  const dir = useMemo(() => new Vector3(), [])

  const uniforms = useMemo(() => ({ intensity: { value: 0 }, reveal: { value: 0 } }), [])
  const glowUniforms = useMemo(() => ({ intensity: { value: 0 } }), [])

  useEffect(() => () => mesh.current?.geometry.dispose(), [])

  useFrame(({ camera }) => {
    if (atmosphere.strike !== state.strike) {
      state.strike = atmosphere.strike
      // ângulo: até ±30° da direção da câmera, para quase sempre aparecer
      camera.getWorldDirection(dir)
      const angle = Math.atan2(dir.x, dir.z) + MathUtils.randFloatSpread(1.0)
      const x = Math.sin(angle) * DISTANCE
      const z = Math.cos(angle) * DISTANCE
      for (const m of [mesh.current, glow.current]) {
        m.position.set(x, 0, z)
        m.rotation.y = angle
      }
      const old = mesh.current.geometry
      mesh.current.geometry = buildBolt()
      old.dispose()
      playThunder(0.7 + Math.random() * 1.2, 0.6 + Math.random() * 0.4)
    }

    const t = atmosphere.age
    const on = atmosphere.flash > 0.01
    // uniforms via material (no StrictMode o useMemo pode gerar outro objeto)
    const u = mesh.current.material.uniforms
    u.intensity.value = on ? Math.min(1.4, atmosphere.flash * 1.5) : 0
    u.reveal.value = MathUtils.clamp(t / 0.06, 0, 1)
    glow.current.material.uniforms.intensity.value = on ? atmosphere.flash * 0.35 : 0
    mesh.current.visible = glow.current.visible = on
  })

  return (
    <>
      <mesh ref={mesh} visible={false} frustumCulled={false}>
        <bufferGeometry />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={boltVertex}
          fragmentShader={boltFragment}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>
      {/* nuvem iluminada em volta da origem do raio */}
      <mesh ref={glow} visible={false}>
        <planeGeometry args={[420, 260]} />
        <shaderMaterial
          uniforms={glowUniforms}
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>
    </>
  )
}

/** segmentos { a:[x,y], b:[x,y], w, alpha, depth } do tronco e dos galhos */
function boltSegments() {
  const segs = []

  const path = (from, to, levels, spread) => {
    let pts = [from, to]
    for (let l = 0; l < levels; l++) {
      const next = [pts[0]]
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1]
        const [bx, by] = pts[i]
        const len = Math.hypot(bx - ax, by - ay)
        // desloca o ponto médio na perpendicular
        const off = MathUtils.randFloatSpread(len * spread)
        next.push([(ax + bx) / 2 + ((ay - by) / len) * off, (ay + by) / 2 + ((bx - ax) / len) * off], pts[i])
      }
      pts = next
    }
    return pts
  }

  const addBranch = (from, to, levels, w, alpha, depth0, depthSpan, generation) => {
    const pts = path(from, to, levels, 0.55)
    for (let i = 1; i < pts.length; i++) {
      const k = i / (pts.length - 1)
      segs.push({ a: pts[i - 1], b: pts[i], w: w * (1 - k * 0.5), alpha: alpha * (1 - k * 0.6), depth: depth0 + k * depthSpan })
      // galhos saem para baixo e para o lado
      if (generation < 2 && i < pts.length - 2 && Math.random() < (generation ? 0.08 : 0.16)) {
        const [px, py] = pts[i]
        const len = (to[1] - from[1]) * MathUtils.randFloat(-0.35, -0.15)
        const side = Math.random() < 0.5 ? -1 : 1
        addBranch(pts[i], [px + side * len * MathUtils.randFloat(0.5, 1.1), py - len], levels - 2, w * 0.45, alpha * 0.55, depth0 + k * depthSpan, depthSpan * 0.4, generation + 1)
      }
    }
  }

  const start = [MathUtils.randFloatSpread(40), TOP]
  const end = [start[0] + MathUtils.randFloatSpread(120), BOTTOM]
  addBranch(start, end, 7, 2.4, 1, 0, 1, 0)
  return segs
}

/** cada segmento vira um quad com largura de brilho; `side` vai de -1 a 1 */
function buildBolt() {
  const segs = boltSegments()
  const pos = new Float32Array(segs.length * 4 * 3)
  const side = new Float32Array(segs.length * 4)
  const alpha = new Float32Array(segs.length * 4)
  const depth = new Float32Array(segs.length * 4)
  const height = new Float32Array(segs.length * 4)
  const index = []
  segs.forEach(({ a, b, w, alpha: al, depth: d }, i) => {
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    // largura total = núcleo + halo
    const nx = (-dy / len) * w * 4
    const ny = (dx / len) * w * 4
    // estende um pouco nas pontas para esconder as juntas
    const ex = (dx / len) * w
    const ey = (dy / len) * w
    const quad = [
      [a[0] - ex + nx, a[1] - ey + ny, -1],
      [a[0] - ex - nx, a[1] - ey - ny, 1],
      [b[0] + ex + nx, b[1] + ey + ny, -1],
      [b[0] + ex - nx, b[1] + ey - ny, 1],
    ]
    quad.forEach(([x, y, s], j) => {
      const v = i * 4 + j
      // o plano do raio é perpendicular à direção da câmera (x lateral)
      pos.set([-x, y, 0], v * 3)
      side[v] = s
      alpha[v] = al
      depth[v] = d
      height[v] = (y - BOTTOM) / (TOP - BOTTOM)
    })
    const v = i * 4
    index.push(v, v + 1, v + 2, v + 1, v + 3, v + 2)
  })
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('side', new BufferAttribute(side, 1))
  g.setAttribute('alpha', new BufferAttribute(alpha, 1))
  g.setAttribute('depth', new BufferAttribute(depth, 1))
  g.setAttribute('height', new BufferAttribute(height, 1))
  g.setIndex(index)
  return g
}

const boltVertex = /* glsl */ `
  attribute float side;
  attribute float alpha;
  attribute float depth;
  attribute float height;
  varying float vSide;
  varying float vAlpha;
  varying float vDepth;
  varying float vHeight;
  void main() {
    vSide = side;
    vAlpha = alpha;
    vDepth = depth;
    vHeight = height;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const boltFragment = /* glsl */ `
  uniform float intensity;
  uniform float reveal;
  varying float vSide;
  varying float vAlpha;
  varying float vDepth;
  varying float vHeight;
  void main() {
    if (vDepth > reveal) discard;
    float d = abs(vSide);
    float core = smoothstep(0.22, 0.0, d);
    float halo = pow(1.0 - d, 3.0) * 0.45;
    // some na base, "atrás" da névoa da cidade
    float fade = smoothstep(0.0, 0.35, vHeight);
    vec3 col = vec3(0.75, 0.82, 1.0) * halo + vec3(1.0) * core;
    gl_FragColor = vec4(col * vAlpha * intensity * fade, 1.0);
  }
`

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + vec3(0.0, ${TOP - 20}.0, 0.0), 1.0);
  }
`

const glowFragment = /* glsl */ `
  uniform float intensity;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * vec2(1.0, 1.6);
    float g = exp(-dot(p, p) * 7.0);
    gl_FragColor = vec4(vec3(0.45, 0.55, 0.85) * g * intensity, 1.0);
  }
`
