import { useQuery } from '@tanstack/react-query'
import { queryPoint, queryRegion, queryTimeSeries } from '../api/queryApi'

export function usePointQuery(
  lon: number | null, lat: number | null,
  ageMa: number | null, varName: string | null,
) {
  return useQuery({
    queryKey: ['pointQuery', lon, lat, ageMa, varName],
    queryFn: () => queryPoint(lon!, lat!, ageMa!, varName!),
    enabled: !!lon && !!lat && !!ageMa && !!varName,
  })
}

export function useRegionQuery(
  lonMin: number, lonMax: number,
  latMin: number, latMax: number,
  ageMa: number | null, varName: string | null,
) {
  return useQuery({
    queryKey: ['regionQuery', lonMin, lonMax, latMin, latMax, ageMa, varName],
    queryFn: () => queryRegion(lonMin, lonMax, latMin, latMax, ageMa!, varName!),
    enabled: !!ageMa && !!varName,
  })
}

export function useTimeSeriesQuery(
  lon: number, lat: number,
  varName: string | null,
  ageMin?: number, ageMax?: number,
) {
  return useQuery({
    queryKey: ['timeSeries', lon, lat, varName, ageMin, ageMax],
    queryFn: () => queryTimeSeries(lon, lat, varName!, ageMin, ageMax),
    enabled: !!varName,
  })
}
