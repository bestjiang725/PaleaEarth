export interface ApiResponse<T> {
  code: number
  data: T
  msg: string
}

export interface TaskStatus {
  task_id: string
  task_type: string
  status: 'pending' | 'running' | 'done' | 'fail'
  progress: number
  result_url: string | null
  error_message: string | null
  created_at: string | null
}

export interface PointQueryResult {
  lon: number
  lat: number
  age_ma: number
  var_name: string
  value: number | null
  units: string | null
}

export interface RegionStats {
  min: number | null
  max: number | null
  mean: number | null
  std: number | null
  count: number
  units?: string | null
}

export interface TimeSeriesPoint {
  age_ma: number
  value: number | null
}

export interface TimeSeriesResult {
  lon: number
  lat: number
  var_name: string
  units: string | null
  series: TimeSeriesPoint[]
}
