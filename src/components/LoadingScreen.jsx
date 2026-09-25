import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { gsap } from '../lib/gsap'
import { useExperience } from '../store/useExperience'
import { setAudioEnabled } from '../lib/audio'

/** tempo mínimo de loading, para a entrada não piscar quando tudo está em cache */
const MIN_DURATION = 1.8

/**
 * Porcentagem real (DefaultLoadingManager do three) suavizada, e depois a
 * escolha "com som / sem som" — o clique também destrava o áudio.
 */
export function LoadingScreen() {
  const { progress, total } = useProgress()
  const real = useRef(0)
  real.current = total === 0 ? 100 : progress

  const phase = useExperience((s) => s.phase)
  const [shown, setShown] = useState(0)
  const [gone, setGone] = useState(false)
  const root = useRef()

  useEffect(() => {
    const start = performance.now()
    let value = 0
    let raf
    const tick = () => {
      const byTime = ((performance.now() - start) / 1000 / MIN_DURATION) * 100
      value += (Math.min(real.current, byTime) - value) * 0.08
      if (value > 99.5) {
        setShown(100)
        useExperience.getState().setPhase('ready')
        return
      }
      setShown(value)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const enter = (withSound) => {
    const { setSound, setPhase } = useExperience.getState()
    setSound(withSound)
    setAudioEnabled(withSound)
    setPhase('intro')
    gsap.to(root.current, { opacity: 0, duration: 1.2, ease: 'power2.inOut', onComplete: () => setGone(true) })
  }

  if (gone) return null
  const ready = phase === 'ready'

  return (
    <div
      ref={root}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-night/80 px-6 text-center backdrop-blur-sm"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-ice/70">Night Circuit</p>
      <h1 className="mt-4 max-w-xl text-3xl font-medium leading-tight md:text-5xl">
        Uma pista que conta como <span className="text-ember">ela mesma</span> foi construída.
      </h1>

      <div className="mt-12 h-16">
        {ready ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <EnterButton onClick={() => enter(true)} primary>
              Entrar com som
            </EnterButton>
            <EnterButton onClick={() => enter(false)}>Entrar sem som</EnterButton>
          </div>
        ) : (
          <div className="w-64">
            <div className="flex justify-between font-mono text-xs text-white/50">
              <span>carregando</span>
              <span className="tabular-nums text-white">{Math.round(shown)}%</span>
            </div>
            <div className="mt-2 h-px w-full bg-white/10">
              <div className="h-px bg-ember" style={{ width: `${shown}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EnterButton({ primary, children, ...props }) {
  return (
    <button
      type="button"
      className={`rounded-full border px-6 py-3 font-mono text-xs uppercase tracking-[0.25em] transition ${
        primary
          ? 'border-ember bg-ember text-night hover:bg-transparent hover:text-ember'
          : 'border-white/20 text-white/70 hover:border-white hover:text-white'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}
