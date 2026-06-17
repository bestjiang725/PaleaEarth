import apiClient from './client'
import type { ApiResponse } from '../types/api'
import type { ClimateVariable, VariableCategory } from '../types/climate'

export function fetchVariables(category?: VariableCategory) {
  return apiClient.get('/variable/list', { params: { category } }) as Promise<ApiResponse<ClimateVariable[]>>
}

export function fetchVariableDetail(varName: string) {
  return apiClient.get(`/variable/${varName}`) as Promise<ApiResponse<ClimateVariable>>
}

export function fetchCategories() {
  return apiClient.get('/variable/categories') as Promise<ApiResponse<{ category: string; label: string; count: number }[]>>
}
