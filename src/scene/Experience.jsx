import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { CameraRig } from './CameraRig'
import { Checkpoints } from './Checkpoints'
import { Ground } from './Ground'
import { Lights } from './Lights'
import { Rain } from './Rain'
import { Skyline } from './Skyline'
import { Track } from './Track'
import { Vehicle } from './Vehicle'
import { DriftEffects } from './DriftEffects'
import { FOG_COLOR } from './constants'


export function Experience() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
      camera={{ fov: 48, near: 0.1, far: 1500, position: [200, 120, 0] }}
    >
      <color attach="background" args={[FOG_COLOR]} />
      <fogExp2 attach="fog" args={[FOG_COLOR, 0.0055]} />
      <Lights />
      <Skyline />
      <Ground />
      <Track />
      <Checkpoints />
      <Vehicle />
      <DriftEffects />
      <Rain />
      <CameraRig />
    </Canvas>
  )
}
