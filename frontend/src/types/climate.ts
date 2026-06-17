export type VariableCategory =
  | 'temperature' | 'precipitation' | 'wind' | 'pressure'
  | 'cloud' | 'soil' | 'evaporation' | 'radiation' | 'flux'
  | 'ice' | 'snow' | 'runoff' | 'humidity' | 'wind_stress'

export interface ClimateVariable {
  var_name: string
  category: VariableCategory
  display_name_zh: string | null
  units: string | null
  colormap: string
  value_range: [number, number] | null
  ndim: number
  extra_dims?: string | null
  description?: string | null
}

export interface CategoryGroup {
  category: VariableCategory
  label: string
  variables: ClimateVariable[]
}

export const CATEGORY_LABELS: Record<VariableCategory, string> = {
  temperature: '温度',
  precipitation: '降水',
  wind: '风场',
  pressure: '气压',
  cloud: '云量',
  soil: '土壤',
  evaporation: '蒸散发',
  radiation: '辐射',
  flux: '通量',
  ice: '海冰',
  snow: '积雪',
  runoff: '径流',
  humidity: '湿度',
  wind_stress: '风应力',
}
