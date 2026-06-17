import apiClient from './client'
import type { ApiResponse, TaskStatus } from '../types/api'

export function fetchTaskStatus(taskId: string) {
  return apiClient.get(`/task/${taskId}/status`) as Promise<ApiResponse<TaskStatus>>
}

export function listTasks(status?: string, page = 1, pageSize = 20) {
  return apiClient.get('/task/list', {
    params: { status, page, page_size: pageSize },
  }) as Promise<ApiResponse<{ tasks: TaskStatus[]; total: number }>>
}

export function submitGenerateOverlay(ageMa: number, varName: string, colormap?: string) {
  return apiClient.post('/generate/overlay', {
    age_ma: ageMa,
    var_name: varName,
    colormap: colormap || 'RdYlBu_r',
  }) as Promise<ApiResponse<{ task_id: string; status: string }>>
}

export function getOverlayUrl(ageMa: number, varName: string) {
  return `/api/v1/tiles/overlay/${ageMa}/${varName}.png`
}

export function getOverlayInfoUrl(ageMa: number, varName: string) {
  return `/api/v1/tiles/overlay/${ageMa}/${varName}/info`
}
