import { create } from 'zustand'

export type SemColor = 'red' | 'yellow' | 'green'
export type Direction = 'up' | 'dn'

interface SimState {
  waterLevel: number
  direction: Direction
  isRunning: boolean
  semJus: SemColor
  semMon: SemColor
  progress: number
  stepText: string
  stepDone: boolean
  logs: string[]
  bstText: string
  faseText: string
  opStartTime: number | null
  runner: ((dir: Direction) => Promise<void>) | null

  setWaterLevel: (v: number) => void
  setDirection: (d: Direction) => void
  setIsRunning: (v: boolean) => void
  setSemJus: (c: SemColor) => void
  setSemMon: (c: SemColor) => void
  setProgress: (p: number) => void
  setStep: (t: string, done?: boolean) => void
  pushLog: (msg: string) => void
  setBst: (t: string) => void
  setFase: (t: string) => void
  startOp: () => void
  setRunner: (fn: (dir: Direction) => Promise<void>) => void
}

export const useSimStore = create<SimState>((set) => ({
  waterLevel: 0,
  direction: 'up',
  isRunning: false,
  semJus: 'red',
  semMon: 'red',
  progress: 0,
  stepText: 'Pressione INICIAR',
  stepDone: false,
  logs: [
    '[ SYS ] Eclusa Crestuma-Lever · Simulação v4.0',
    '[ INFO ] Câmara ao nível do jusante · cota +2.0m',
    '[ WAIT ] Aguardando operador...',
  ],
  bstText: 'Em Espera',
  faseText: 'Pronto',
  opStartTime: null,
  runner: null,

  setWaterLevel: (v) => set({ waterLevel: v }),
  setDirection: (d) => set({ direction: d }),
  setIsRunning: (v) => set({ isRunning: v }),
  setSemJus: (c) => set({ semJus: c }),
  setSemMon: (c) => set({ semMon: c }),
  setProgress: (p) => set((s) => ({ progress: Math.max(s.progress, p) })),
  setStep: (t, done = false) => set({ stepText: t, stepDone: done }),
  pushLog: (msg) =>
    set((s) => {
      const logs = [...s.logs, msg].slice(-3)
      return { logs }
    }),
  setBst: (t) => set({ bstText: t }),
  setFase: (t) => set({ faseText: t }),
  startOp: () => set({ opStartTime: Date.now(), progress: 0 }),
  setRunner: (fn) => set({ runner: fn }),
}))
