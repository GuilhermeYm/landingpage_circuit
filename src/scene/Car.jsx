import { forwardRef, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ASSETS } from '../config/assets'
import { useOptionalGLTF } from '../lib/useOptionalAsset'
import { vehicle } from './vehicleState'

/**
 * Visual do carro. Usa /models/car.glb se existir; senão, um low-poly de
 * placeholder feito de caixas. Os faróis (spotlight) valem para os dois.
 */
export const Car = forwardRef(function Car(props, ref) {
  const gltf = useOptionalGLTF(ASSETS.car.url)
  const spot = useRef()
  const spotTarget = useRef()

  useEffect(() => {
    spot.current.target = spotTarget.current
  }, [])

  return (
    <group ref={ref} {...props}>
      {gltf ? (
        <primitive
          object={gltf.scene}
          scale={ASSETS.car.scale}
          rotation-y={ASSETS.car.rotationY}
          position-y={ASSETS.car.offsetY}
        />
      ) : (
        <PlaceholderCar />
      )}
      <spotLight ref={spot} position={[0, 0.9, 1.8]} color="#dbe8ff" intensity={180} angle={0.5} penumbra={0.7} distance={60} decay={1.5} />
      <object3D ref={spotTarget} position={[0, 0, 14]} />
    </group>
  )
})

const WHEELS = [
  [-0.95, 0.36, 1.35],
  [0.95, 0.36, 1.35],
  [-0.95, 0.36, -1.35],
  [0.95, 0.36, -1.35],
]

function PlaceholderCar() {
  const wheels = useRef([])

  useFrame((_, dt) => {
    for (const w of wheels.current) w.rotation.x += (vehicle.speed * dt) / 0.36
  })

  return (
    <group>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[1.9, 0.5, 4.2]} />
        <meshStandardMaterial color="#3a4670" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.08, -0.35]}>
        <boxGeometry args={[1.55, 0.44, 2]} />
        <meshStandardMaterial color="#0a0d18" metalness={0.9} roughness={0.1} />
      </mesh>
      {WHEELS.map((p, i) => (
        <group key={i} position={p} ref={(el) => (wheels.current[i] = el)}>
          <mesh rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.36, 0.36, 0.3, 14]} />
            <meshStandardMaterial color="#07080c" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {[-0.65, 0.65].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.66, 2.11]}>
            <boxGeometry args={[0.45, 0.12, 0.04]} />
            <meshBasicMaterial color="#e6f0ff" toneMapped={false} />
          </mesh>
          <mesh position={[x, 0.7, -2.11]}>
            <boxGeometry args={[0.5, 0.1, 0.04]} />
            <meshBasicMaterial color="#ff2438" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
