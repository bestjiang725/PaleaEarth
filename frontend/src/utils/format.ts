export function formatAge(ma: number): string {
  return `${ma} Ma`
}

export function formatTemperature(kelvin: number): string {
  const celsius = kelvin - 273.15
  return `${celsius.toFixed(1)} °C`
}

export function formatValue(value: number | null | undefined, units: string | null | undefined): string {
  if (value == null) return '—'
  if (units === 'K') return formatTemperature(value)
  if (units === 'kg/m²/s') return `${(value * 86400).toFixed(4)} mm/day`
  if (units === 'Pa') return `${(value / 100).toFixed(1)} hPa`
  return `${value.toFixed(2)} ${units || ''}`
}

export function normalizeLongitude(lon: number): number {
  return ((lon + 540) % 360) - 180
}
