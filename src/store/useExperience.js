import { create } from 'zustand'

/**
 * Estado "de roteiro" da experiência (o que a UI precisa saber).
 *
 * phase: loading → ready (tela de entrada) → intro (câmera voando) → drive
 */
export const useExperience = create((set) => ({
  phase: 'loading',
  setPhase: (phase) => set({ phase }),

  soundOn: false,
  setSound: (soundOn) => set({ soundOn }),

  /** checkpoint perto do carro */
  activeId: null,
  /** checkpoints já visitados, na ordem */
  visited: [],
  setActive: (activeId) =>
    set((s) => {
      if (s.activeId === activeId) return s
      const visited = activeId && !s.visited.includes(activeId) ? [...s.visited, activeId] : s.visited
      return { activeId, visited }
    }),

  /** checkpoint com o painel expandido */
  openId: null,
  open: (openId) => set({ openId }),
  close: () => set({ openId: null }),
}))
