import { KeyboardControls } from '@react-three/drei'
import { Experience } from './scene/Experience'
import { KEYMAP } from './scene/controls'
import { LoadingScreen } from './components/LoadingScreen'
import { Hud } from './components/Hud'
import { CheckpointPanel } from './components/CheckpointPanel'
import { SoundToggle } from './components/SoundToggle'

export default function App() {
  return (
    <KeyboardControls map={KEYMAP}>
      <main className="fixed inset-0">
        <Experience />
      </main>
      <Hud />
      <CheckpointPanel />
      <SoundToggle />
      <LoadingScreen />
    </KeyboardControls>
  )
}
