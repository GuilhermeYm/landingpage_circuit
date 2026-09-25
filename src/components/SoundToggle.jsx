import { useExperience } from '../store/useExperience'
import { setAudioEnabled } from '../lib/audio'

export function SoundToggle() {
  const soundOn = useExperience((s) => s.soundOn)
  const setSound = useExperience((s) => s.setSound)
  const phase = useExperience((s) => s.phase)
  if (phase === 'loading' || phase === 'ready') return null

  const toggle = (e) => {
    // sem foco, para Espaço/Enter continuarem sendo controles do carro
    e.currentTarget.blur()
    setAudioEnabled(!soundOn)
    setSound(!soundOn)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={soundOn ? 'Desligar som' : 'Ligar som'}
      className="fixed bottom-5 right-5 z-40 flex h-10 items-end gap-[3px] rounded-full border border-white/15 bg-night/50 px-4 pb-3 pt-3 backdrop-blur-md md:bottom-8 md:right-8"
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`block w-[2px] bg-white ${soundOn ? 'eq-bar h-3.5' : 'h-[2px]'}`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </button>
  )
}
