import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import { useExperience } from '../store/useExperience'
import { setAudioEnabled } from '../lib/audio'

const REPO_URL = 'https://github.com/GuilhermeYm/landingpage'

/**
 * Esc: fecha o painel de checkpoint se houver um aberto; senão pausa/retoma.
 * Pausado, o Canvas para e o som abaixa.
 */
export function PauseScreen() {
  const paused = useExperience((s) => s.paused)
  const [shown, setShown] = useState(false)
  const root = useRef()

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      const s = useExperience.getState()
      if (s.paused) s.setPaused(false)
      else if (s.openId) s.close()
      else if (s.phase === 'drive') s.setPaused(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const { soundOn } = useExperience.getState()
    if (soundOn) setAudioEnabled(!paused)
    if (paused) {
      setShown(true)
      return
    }
    if (!root.current) return
    const tween = gsap.to(root.current, { opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => setShown(false) })
    return () => tween.kill()
  }, [paused])

  useEffect(() => {
    if (!shown || !root.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      gsap.fromTo(
        '[data-enter]',
        { y: 24, opacity: 0, filter: 'blur(8px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.1 },
      )
    }, root)
    return () => ctx.revert()
  }, [shown])

  if (!shown) return null

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-10 bg-night/75 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && useExperience.getState().setPaused(false)}
    >
      <p data-enter className="text-5xl font-medium tracking-tight md:text-7xl">
        Pausado
      </p>
      <a
        data-enter
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ver o código no GitHub"
        className="rounded-full border border-white/15 p-4 text-white/70 transition-colors hover:border-ember hover:text-ember"
      >
        <svg viewBox="0 0 16 16" width="28" height="28" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
      </a>
    </div>
  )
}
