import { create } from 'zustand'

interface AppState {
  selectedAgeMa: number | null
  selectedVarName: string | null
  selectedColormap: string
  setSelectedAge: (age: number) => void
  setSelectedVariable: (varName: string, colormap?: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedAgeMa: null,
  selectedVarName: null,
  selectedColormap: 'RdYlBu_r',
  setSelectedAge: (age) => set({ selectedAgeMa: age }),
  setSelectedVariable: (varName, colormap) =>
    set({ selectedVarName: varName, selectedColormap: colormap ?? 'RdYlBu_r' }),
}))
