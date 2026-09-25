import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useExperience } from '../store/useExperience'
import { drift } from '../scene/vehicleState'

const fmt = (n) => Math.round(n).toLocaleString('pt-BR')

/**
 * Placar de drift: pontos do drift atual com multiplicador, e o resultado
 * ("+1.240" ou "bateu!") quando ele termina. Lê o estado mutável a cada frame,
 * sem re-render do React.
 */
export function DriftMeter() {
  const phase = useExperience((s) => s.phase)
  const live = useRef()
  const points = useRef()
  const mult = useRef()
  const bar = useRef()
  const result = useRef()
  const total = useRef()
  const best = useRef()

  useEffect(() => {
    if (phase !== 'drive') return
    let raf
    let lastId = null
    let shown = false
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!live.current) return

      if (drift.active !== shown) {
        shown = drift.active
        gsap.to(live.current, { autoAlpha: shown ? 1 : 0, y: shown ? 0 : 10, scale: shown ? 1 : 0.96, duration: shown ? 0.25 : 0.35, ease: 'power2.out' })
      }
      if (drift.active) {
        points.current.textContent = fmt(drift.points)
        mult.current.textContent = `×${drift.multiplier.toFixed(1)}`
        bar.current.style.transform = `scaleX(${((drift.time % 1.5) / 1.5).toFixed(3)})`
      }

      const last = drift.last
      if (last && last.id !== lastId) {
        lastId = last.id
        const ok = last.type === 'bank'
        result.current.textContent = ok ? `+${fmt(last.value)}` : `bateu! −${fmt(last.value)}`
        result.current.style.color = ok ? 'var(--color-ember)' : '#ff5a6a'
        gsap.killTweensOf(result.current)
        gsap
          .timeline()
          .fromTo(result.current, { autoAlpha: 0, y: 12, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2)' })
          .to(result.current, { autoAlpha: 0, y: -18, duration: 0.6, ease: 'power2.in' }, '+=1.1')
        total.current.textContent = fmt(drift.total)
        best.current.textContent = fmt(drift.best)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  if (phase !== 'drive') return null

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <div className="absolute inset-x-0 top-[18%] flex flex-col items-center">
        <div ref={live} className="invisible flex flex-col items-center opacity-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-ember">drift</p>
          <p className="mt-1 flex items-baseline gap-3">
            <span ref={points} className="font-mono text-5xl tabular-nums leading-none">
              0
            </span>
            <span ref={mult} className="font-mono text-xl text-ice">
              ×1.0
            </span>
          </p>
          <div className="mt-3 h-px w-40 bg-white/15">
            <div ref={bar} className="h-px origin-left bg-ember" />
          </div>
        </div>
        <p ref={result} className="invisible mt-2 font-mono text-3xl tabular-nums opacity-0" />
      </div>

      <div className="absolute bottom-24 left-5 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 md:bottom-28 md:left-8">
        <p>
          pontos <span ref={total} className="text-white/80 tabular-nums">0</span>
        </p>
        <p className="mt-1">
          melhor drift <span ref={best} className="text-white/80 tabular-nums">0</span>
        </p>
      </div>
    </div>
  )
}
