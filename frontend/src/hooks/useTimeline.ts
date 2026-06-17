import { useQuery } from '@tanstack/react-query'
import { fetchAges, fetchAgeDetail, fetchTimeline } from '../api/timeApi'

export function useAges(era?: string) {
  return useQuery({
    queryKey: ['ages', era],
    queryFn: () => fetchAges(era),
  })
}

export function useAgeDetail(ageMa: number | null) {
  return useQuery({
    queryKey: ['ageDetail', ageMa],
    queryFn: () => fetchAgeDetail(ageMa!),
    enabled: !!ageMa,
  })
}

export function useTimeline() {
  return useQuery({
    queryKey: ['timeline'],
    queryFn: () => fetchTimeline(),
    staleTime: Infinity,
  })
}
