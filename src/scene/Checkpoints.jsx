import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { AdditiveBlending, MathUtils } from 'three'
import { useExperience } from '../store/useExperience'
import { CHECKPOINT_POINTS } from './track'

/** Um feixe de luz + rótulo clicável em cada curva da pista. */
export function Checkpoints() {
  return CHECKPOINT_POINTS.map((cp) => <Marker key={cp.id} cp={cp} />)
}

function Marker({ cp }) {
  const isActive = useExperience((s) => s.activeId === cp.id)
  const isOpen = useExperience((s) => s.openId === cp.id)
  const visible = useExperience((s) => s.phase === 'drive')
  const open = useExperience((s) => s.open)
  const beam = useRef()
  const ring = useRef()
  const light = useRef()

  useFrame(({ clock }, dt) => {
    const on = isActive || isOpen
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3 + cp.index)
    const k = 1 - Math.exp(-6 * dt)
    beam.current.material.opacity = MathUtils.lerp(beam.current.material.opacity, on ? 0.55 + pulse * 0.2 : 0.18, k)
    ring.current.scale.setScalar(MathUtils.lerp(ring.current.scale.x, on ? 1.4 + pulse * 0.15 : 1, k))
    light.current.intensity = MathUtils.lerp(light.current.intensity, on ? 220 : 90, k)
  })

  return (
    <group position={cp.marker}>
      <mesh ref={beam} position-y={20}>
        <cylinderGeometry args={[0.18, 0.5, 40, 12, 1, true]} />
        <meshBasicMaterial color="#ff8a3d" transparent opacity={0.18} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.06}>
        <ringGeometry args={[1.4, 1.8, 48]} />
        <meshBasicMaterial color="#ffb070" transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <pointLight ref={light} color="#ff8a3d" position-y={4} intensity={90} distance={48} decay={1.6} />

      {visible && (
        <Html position={[0, 9, 0]} center zIndexRange={[10, 0]}>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur()
              open(cp.id)
            }}
            className={`group flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] backdrop-blur-md transition ${
              isActive || isOpen
                ? 'border-ember/80 bg-ember/20 text-white'
                : 'border-white/15 bg-night/50 text-white/60 hover:text-white'
            }`}
          >
            <span className="text-ember">{cp.step}</span>
            <span>{cp.title}</span>
          </button>
        </Html>
      )}
    </group>
  )
}
