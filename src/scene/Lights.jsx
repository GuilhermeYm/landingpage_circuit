import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { atmosphere } from './atmosphere'

/**
 * Luz fria de noite chuvosa. Os tons quentes (laranja) vêm das luzes dos
 * checkpoints e do brilho do skyline — o contraste azul/laranja da referência.
 * O relâmpago (atmosphere.flash) acende a luz de céu por um instante.
 */
export function Lights() {
  const hemi = useRef()
  const moon = useRef()

  useFrame(() => {
    hemi.current.intensity = 1.4 + atmosphere.flash * 5
    moon.current.intensity = 1.4 + atmosphere.flash * 4
  })

  return (
    <>
      <ambientLight color="#4a64a8" intensity={1.1} />
      <hemisphereLight ref={hemi} args={['#4a6cc0', '#1a0f08', 1.4]} />
      <directionalLight ref={moon} color="#9ab8ff" intensity={1.4} position={[-80, 120, -60]} />
    </>
  )
}
