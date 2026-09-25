import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useExperience } from '../store/useExperience'
import { vehicle } from '../scene/vehicleState'
import { CHECKPOINT_POINTS } from '../scene/track'

/** Título, velocímetro, lista de etapas e dicas de controle. */
export function Hud() {
  const phase = useExperience((s) => s.phase)
  const activeId = useExperience((s) => s.activeId)
  const openId = useExperience((s) => s.openId)
  const visited = useExperience((s) => s.visited)
  const open = useExperience((s) => s.open)
  const root = useRef()
  const speedEl = useRef()

  useEffect(() => {
    if (phase === 'drive') gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 1.2 })
  }, [phase])

  // velocímetro fora do React: lê o estado mutável a cada frame
  useEffect(() => {
    let raf
    const tick = () => {
      if (speedEl.current) speedEl.current.textContent = Math.round(Math.abs(vehicle.speed) * 3.6 * 1.6)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (phase !== 'drive') return null
  const active = CHECKPOINT_POINTS.find((c) => c.id === activeId)

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-20 p-5 md:p-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-ice/70">Night Circuit</p>
        <p className="mt-1 text-sm text-white/50">um site que documenta a própria construção</p>
      </header>

      <nav className="pointer-events-auto absolute right-5 top-5 flex flex-col items-end gap-2 md:right-8 md:top-8">
        {CHECKPOINT_POINTS.map((cp) => {
          const seen = visited.includes(cp.id)
          const current = cp.id === activeId || cp.id === openId
          return (
            <button
              key={cp.id}
              type="button"
              onClick={(e) => {
                e.currentTarget.blur()
                open(cp.id)
              }}
              className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] transition ${
                current ? 'text-white' : seen ? 'text-white/60 hover:text-white' : 'text-white/25 hover:text-white/60'
              }`}
            >
              <span className="hidden sm:inline">{cp.title}</span>
              <span className={`h-2 w-2 rounded-full ${current ? 'bg-ember' : seen ? 'bg-white/60' : 'border border-white/30'}`} />
            </button>
          )
        })}
      </nav>

      {active && !openId && (
        <div className="absolute inset-x-0 bottom-28 flex justify-center">
          <p className="rounded-full border border-ember/40 bg-night/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] backdrop-blur-md">
            <span className="text-ember">{active.step}</span> · {active.title} — <Kbd>E</Kbd> ou clique no marcador
          </p>
        </div>
      )}

      <div className="absolute bottom-5 left-5 md:bottom-8 md:left-8">
        <p className="font-mono text-5xl tabular-nums leading-none" ref={speedEl}>
          0
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">km/h</p>
      </div>

      <div className="absolute inset-x-0 bottom-6 hidden justify-center gap-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 md:flex md:bottom-9">
        <span>
          <Kbd>W</Kbd>
          <Kbd>S</Kbd> acelera / freia
        </span>
        <span>
          <Kbd>A</Kbd>
          <Kbd>D</Kbd> direção
        </span>
        <span>
          <Kbd>Espaço</Kbd> + direção = drift
        </span>
      </div>
    </div>
  )
}

function Kbd({ children }) {
  return <kbd className="mx-0.5 rounded border border-white/20 px-1.5 py-0.5 text-white/80">{children}</kbd>
}
