export interface AgeItem {
  age_ma: number
  period: string
  era: string
  epoch: string | null
  available_var_count: number
}

export interface VariableBrief {
  var_name: string
  display_name_zh: string | null
  units: string | null
}

export interface AgeDetail extends AgeItem {
  file_group_id: string
  file_path: string | null
  resolution: string | null
  available_vars: VariableBrief[]
}

export interface TimelineEpoch {
  name: string
  age_range: [number, number]
  available_ages: number[]
}

export interface TimelinePeriod {
  name: string
  age_range: [number, number]
  epochs: TimelineEpoch[]
}

export interface TimelineEra {
  name: string
  periods: TimelinePeriod[]
}

export interface TimelineResponse {
  eras: TimelineEra[]
}
