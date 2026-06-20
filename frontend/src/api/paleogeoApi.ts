import apiClient from './client'
import type { ApiResponse } from '../types/api'

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][][] | number[][][]
  }
}

export interface GeoJSONCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export function fetchCoastlines(ageMa: number) {
  return apiClient.get('/paleogeo/coastlines', {
    params: { age_ma: ageMa },
  }) as Promise<ApiResponse<GeoJSONCollection>>
}

export function fetchContinents(ageMa: number) {
  return apiClient.get('/paleogeo/continents', {
    params: { age_ma: ageMa },
  }) as Promise<ApiResponse<GeoJSONCollection>>
}
