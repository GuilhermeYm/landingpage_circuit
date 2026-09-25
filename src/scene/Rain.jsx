import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry } from 'three'

const COUNT = 2200
const AREA = 70
const HEIGHT = 40
const LENGTH = 0.9
const SPEED = 38
const WIND = 0.18

/** Chuva: segmentos de linha numa caixa que acompanha a câmera. */
export function Rain() {
  const group = useRef()
  const geometry = useMemo(() => {
    const pos = new Float32Array(COUNT * 6)
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * AREA
      const y = Math.random() * HEIGHT
      const z = (Math.random() - 0.5) * AREA
      pos.set([x, y, z, x + WIND * LENGTH, y - LENGTH, z], i * 6)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    return g
  }, [])

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const attr = geometry.attributes.position
    const a = attr.array
    const fall = SPEED * dt
    for (let i = 0; i < a.length; i += 6) {
      a[i] += WIND * fall
      a[i + 3] += WIND * fall
      a[i + 1] -= fall
      a[i + 4] -= fall
      if (a[i + 4] < 0) {
        const x = (Math.random() - 0.5) * AREA
        a[i] = x
        a[i + 3] = x + WIND * LENGTH
        a[i + 1] = HEIGHT
        a[i + 4] = HEIGHT - LENGTH
      }
    }
    attr.needsUpdate = true
    group.current.position.set(camera.position.x, camera.position.y - HEIGHT * 0.6, camera.position.z)
  })

  return (
    <group ref={group}>
      <lineSegments geometry={geometry} frustumCulled={false}>
        <lineBasicMaterial color="#a9c2ff" transparent opacity={0.28} depthWrite={false} />
      </lineSegments>
    </group>
  )
}
