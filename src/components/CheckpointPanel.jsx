import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import { useExperience } from '../store/useExperience'
import { CHECKPOINT_POINTS } from '../scene/track'

/** Conteúdo expandido de um checkpoint. Esc fecha (tratado no PauseScreen). */
export function CheckpointPanel() {
  const openId = useExperience((s) => s.openId)
  const close = useExperience((s) => s.close)
  // mantém o último conteúdo montado durante a animação de saída
  const [shownId, setShownId] = useState(null)
  const root = useRef()

  useEffect(() => {
    if (openId) {
      setShownId(openId)
      return
    }
    if (!root.current) return
    const tween = gsap.to(root.current, { x: 40, opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: () => setShownId(null) })
    return () => tween.kill()
  }, [openId])

  useEffect(() => {
    if (!shownId || !root.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(root.current, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.35 })
      gsap.from('[data-reveal]', { y: 16, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power2.out', delay: 0.55 })
    }, root)
    return () => ctx.revert()
  }, [shownId])

  const cp = CHECKPOINT_POINTS.find((c) => c.id === shownId)
  if (!cp) return null

  return (
    <aside
      ref={root}
      className="fixed inset-x-4 bottom-4 z-30 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-night/70 p-6 backdrop-blur-xl md:inset-x-auto md:bottom-auto md:right-8 md:top-1/2 md:w-[420px] md:-translate-y-1/2 md:p-8"
    >
      <div className="flex items-start justify-between">
        <p data-reveal className="font-mono text-6xl font-medium leading-none text-ember">
          {cp.step}
        </p>
        <button
          type="button"
          onClick={close}
          className="rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white"
        >
          Esc · fechar
        </button>
      </div>
      <p data-reveal className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-ice/80">
        {cp.kicker}
      </p>
      <h2 data-reveal className="mt-2 text-3xl font-medium">
        {cp.title}
      </h2>
      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-white/70">
        {cp.body.map((p, i) => (
          <p data-reveal key={i}>
            {p}
          </p>
        ))}
      </div>
    </aside>
  )
}
