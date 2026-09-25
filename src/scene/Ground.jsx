import { MeshReflectorMaterial } from '@react-three/drei'

/** Chão espelhado e borrado: dá a leitura de asfalto molhado em volta da pista. */
export function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.05}>
      <planeGeometry args={[1400, 1400]} />
      <MeshReflectorMaterial
        resolution={512}
        blur={[400, 120]}
        mixBlur={1}
        mixStrength={18}
        mirror={0.6}
        depthScale={1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        roughness={0.9}
        metalness={0.5}
        color="#0a0e18"
      />
    </mesh>
  )
}
