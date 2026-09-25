import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Color, DoubleSide, Vector3 } from 'three'
import { drift, vehicle } from './vehicleState'

/** posição local das rodas traseiras (o carro olha para +Z) */
const REAR_WHEELS = [
  [-0.95, -1.35],
  [0.95, -1.35],
]

const wheelWorld = (i, out) => {
  const yaw = vehicle.heading + vehicle.drift
  const [x, z] = REAR_WHEELS[i]
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return out.set(vehicle.position.x + x * c + z * s, 0, vehicle.position.z - x * s + z * c)
}

/** Fumaça dos pneus e marcas no asfalto enquanto o carro está de lado. */
export function DriftEffects() {
  return (
    <>
      <SkidMarks />
      <TireSmoke />
    </>
  )
}

// ---------------------------------------------------------------------------

const SEGMENTS = 1200
const MARK_WIDTH = 0.32
const MIN_STEP = 0.35

function SkidMarks() {
  const state = useMemo(() => {
    const geometry = new BufferGeometry()
    const positions = new Float32Array(SEGMENTS * 6 * 3)
    const alpha = new Float32Array(SEGMENTS * 6)
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('alpha', new BufferAttribute(alpha, 1))
    return { geometry, positions, alpha, next: 0, last: [null, null], tmp: new Vector3(), dir: new Vector3() }
  }, [])

  useFrame(() => {
    const { positions, alpha, last, tmp, dir, geometry } = state
    const marking = drift.intensity > 0.25
    let changed = false
    for (let w = 0; w < 2; w++) {
      if (!marking) {
        last[w] = null
        continue
      }
      const p = wheelWorld(w, tmp)
      if (!last[w]) {
        last[w] = p.clone()
        continue
      }
      if (p.distanceTo(last[w]) < MIN_STEP) continue
      // quad entre o último ponto e o atual, com largura perpendicular
      dir.subVectors(p, last[w]).normalize()
      const nx = -dir.z * MARK_WIDTH * 0.5
      const nz = dir.x * MARK_WIDTH * 0.5
      const a = last[w]
      const quad = [
        [a.x + nx, a.z + nz], [a.x - nx, a.z - nz], [p.x + nx, p.z + nz],
        [a.x - nx, a.z - nz], [p.x - nx, p.z - nz], [p.x + nx, p.z + nz],
      ]
      const base = state.next * 6
      const strength = Math.min(1, drift.intensity)
      quad.forEach(([x, z], j) => {
        positions.set([x, 0.03, z], (base + j) * 3)
        alpha[base + j] = strength
      })
      state.next = (state.next + 1) % SEGMENTS
      a.copy(p)
      changed = true
    }
    if (changed) {
      geometry.attributes.position.needsUpdate = true
      geometry.attributes.alpha.needsUpdate = true
      geometry.computeBoundingSphere()
    }
  })

  return (
    <mesh geometry={state.geometry} frustumCulled={false} renderOrder={1}>
      <shaderMaterial
        transparent
        depthWrite={false}
        side={DoubleSide}
        polygonOffset
        polygonOffsetFactor={-2}
        vertexShader={/* glsl */ `
          attribute float alpha;
          varying float vAlpha;
          void main() {
            vAlpha = alpha;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          varying float vAlpha;
          void main() { gl_FragColor = vec4(0.005, 0.006, 0.01, vAlpha * 0.88); }
        `}
      />
    </mesh>
  )
}

// ---------------------------------------------------------------------------

const PARTICLES = 320
const SMOKE_COLOR = new Color('#8f9dc4')

function TireSmoke() {
  const state = useMemo(() => {
    const geometry = new BufferGeometry()
    const position = new Float32Array(PARTICLES * 3)
    const size = new Float32Array(PARTICLES)
    const alpha = new Float32Array(PARTICLES)
    geometry.setAttribute('position', new BufferAttribute(position, 3))
    geometry.setAttribute('size', new BufferAttribute(size, 1))
    geometry.setAttribute('alpha', new BufferAttribute(alpha, 1))
    return {
      geometry,
      position,
      size,
      alpha,
      velocity: new Float32Array(PARTICLES * 3),
      life: new Float32Array(PARTICLES),
      maxLife: new Float32Array(PARTICLES).fill(1),
      next: 0,
      carry: 0,
      tmp: new Vector3(),
    }
  }, [])

  const uniforms = useMemo(() => ({ color: { value: SMOKE_COLOR } }), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const s = state

    // nascimento: proporcional à intensidade do drift
    s.carry += drift.intensity * 45 * dt
    while (s.carry >= 1) {
      s.carry -= 1
      for (let w = 0; w < 2; w++) {
        const i = s.next
        s.next = (s.next + 1) % PARTICLES
        const p = wheelWorld(w, s.tmp)
        s.position.set([p.x + (Math.random() - 0.5) * 0.4, 0.3, p.z + (Math.random() - 0.5) * 0.4], i * 3)
        // a fumaça fica para trás e se espalha
        s.velocity.set(
          [
            -vehicle.forward.x * vehicle.speed * 0.15 + (Math.random() - 0.5) * 1.6,
            0.6 + Math.random() * 0.9,
            -vehicle.forward.z * vehicle.speed * 0.15 + (Math.random() - 0.5) * 1.6,
          ],
          i * 3,
        )
        s.maxLife[i] = 1.2 + Math.random() * 1.2
        s.life[i] = s.maxLife[i]
      }
    }

    for (let i = 0; i < PARTICLES; i++) {
      if (s.life[i] <= 0) {
        s.alpha[i] = 0
        continue
      }
      s.life[i] -= dt
      const t = 1 - s.life[i] / s.maxLife[i]
      const drag = Math.exp(-1.8 * dt)
      for (let a = 0; a < 3; a++) {
        s.velocity[i * 3 + a] *= drag
        s.position[i * 3 + a] += s.velocity[i * 3 + a] * dt
      }
      s.size[i] = 1 + t * 3.6
      s.alpha[i] = Math.sin(Math.min(t * 4, 1) * Math.PI * 0.5) * (1 - t) * 0.32
    }
    s.geometry.attributes.position.needsUpdate = true
    s.geometry.attributes.size.needsUpdate = true
    s.geometry.attributes.alpha.needsUpdate = true
  })

  return (
    <points geometry={state.geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          attribute float size;
          attribute float alpha;
          varying float vAlpha;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            // some perto da câmera, para não virar uma parede branca na tela
            vAlpha = alpha * smoothstep(3.0, 9.0, -mv.z);
            gl_PointSize = size * 360.0 / -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 color;
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d) * vAlpha;
            if (a < 0.004) discard;
            gl_FragColor = vec4(color, a);
            #include <colorspace_fragment>
          }
        `}
      />
    </points>
  )
}

