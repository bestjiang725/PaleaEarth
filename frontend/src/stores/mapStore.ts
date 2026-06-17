import { create } from 'zustand'

interface MapState {
  center: [number, number]
  zoom: number
  overlayOpacity: number
  setCenter: (lon: number, lat: number) => void
  setZoom: (zoom: number) => void
  setOverlayOpacity: (opacity: number) => void
}

export const useMapStore = create<MapState>((set) => ({
  center: [105, 0],
  zoom: 1.5,
  overlayOpacity: 0.85,
  setCenter: (lon, lat) => set({ center: [lon, lat] }),
  setZoom: (zoom) => set({ zoom }),
  setOverlayOpacity: (opacity) => set({ overlayOpacity: opacity }),
}))
