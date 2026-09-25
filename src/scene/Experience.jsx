import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { CameraRig } from './CameraRig'
import { Checkpoints } from './Checkpoints'
import { Ground } from './Ground'
import { Lights } from './Lights'
import { Lightning } from './Lightning'
import { Rain } from './Rain'
import { Skyline } from './Skyline'
import { Track } from './Track'
import { Vehicle } from './Vehicle'
import { DriftEffects } from './DriftEffects'
import { FOG_COLOR } from './constants'
import { useExperience } from '../store/useExperience'


export function Experience() {
  // pausado: nada roda (os dt já são limitados, então a volta não dá salto)
  const paused = useExperience((s) => s.paused)
  return (
    <Canvas
      frameloop={paused ? 'never' : 'always'}
      dpr={[1, 1.75]}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
      camera={{ fov: 48, near: 0.1, far: 1500, position: [200, 120, 0] }}
    >
      <color attach="background" args={[FOG_COLOR]} />
      <fogExp2 attach="fog" args={[FOG_COLOR, 0.0055]} />
      <Lights />
      <Skyline />
      <Lightning />
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
