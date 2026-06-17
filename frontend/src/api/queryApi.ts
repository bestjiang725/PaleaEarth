import apiClient from './client'
import type { ApiResponse, PointQueryResult, RegionStats, TimeSeriesResult } from '../types/api'

export function queryPoint(lon: number, lat: number, ageMa: number, varName: string) {
  return apiClient.get('/query/point', {
    params: { lon, lat, age_ma: ageMa, var_name: varName },
  }) as Promise<ApiResponse<PointQueryResult>>
}

export function queryRegion(
  lonMin: number, lonMax: number, latMin: number, latMax: number,
  ageMa: number, varName: string,
) {
  return apiClient.get('/query/region', {
    params: { lon_min: lonMin, lon_max: lonMax, lat_min: latMin, lat_max: latMax, age_ma: ageMa, var_name: varName },
  }) as Promise<ApiResponse<RegionStats>>
}

export function queryTimeSeries(
  lon: number, lat: number, varName: string, ageMin?: number, ageMax?: number,
) {
  return apiClient.get('/query/timeseries', {
    params: { lon, lat, var_name: varName, age_min: ageMin, age_max: ageMax },
  }) as Promise<ApiResponse<TimeSeriesResult>>
}
