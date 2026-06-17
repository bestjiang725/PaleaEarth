import apiClient from './client'
import type { ApiResponse } from '../types/api'
import type { AgeItem, AgeDetail, VariableBrief, TimelineResponse } from '../types/time'

export function fetchAges(era?: string, page = 1, pageSize = 100) {
  return apiClient.get('/time/ages', { params: { era, page, page_size: pageSize } }) as Promise<ApiResponse<AgeItem[]>>
}

export function fetchAgeDetail(ageMa: number) {
  return apiClient.get(`/time/ages/${ageMa}`) as Promise<ApiResponse<AgeDetail>>
}

export function fetchAgeVariables(ageMa: number) {
  return apiClient.get(`/time/ages/${ageMa}/variables`) as Promise<ApiResponse<VariableBrief[]>>
}

export function fetchTimeline() {
  return apiClient.get('/time/timeline') as Promise<ApiResponse<TimelineResponse>>
}
