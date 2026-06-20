import { Card, Button, Slider, Tag, Spin } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useAges } from '../../hooks/useTimeline'
import { useAppStore } from '../../stores/appStore'
import { formatAge } from '../../utils/format'
import { useState, useMemo } from 'react'

const ERA_COLORS: Record<string, string> = {
  Paleozoic: '#3b82f6', Mesozoic: '#06b6d4', Cenozoic: '#f59e0b',
}

export default function Timeline() {
  const { data, isLoading } = useAges()
  const selectedAgeMa = useAppStore((s) => s.selectedAgeMa)
  const setSelectedAge = useAppStore((s) => s.setSelectedAge)
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)

  const ageItems = data?.data || []

  const periodGroups = useMemo(() => {
    const groups: Record<string, { period: string; era: string; ages: number[] }> = {}
    for (const a of ageItems) {
      if (!groups[a.period]) groups[a.period] = { period: a.period, era: a.era, ages: [] }
      groups[a.period].ages.push(a.age_ma)
    }
    return Object.values(groups)
  }, [ageItems])

  const marks: Record<number, string> = {}
  for (const a of ageItems) marks[a.age_ma] = `${a.age_ma}`

  const sliderMin = ageItems.length > 0 ? Math.min(...ageItems.map((a: { age_ma: number }) => a.age_ma)) : 0
  const sliderMax = ageItems.length > 0 ? Math.max(...ageItems.map((a: { age_ma: number }) => a.age_ma)) : 0

  if (isLoading) {
    return (
      <Card title={<span style={{ color: '#e6edf3', fontSize: 13 }}><ClockCircleOutlined /> 地质年代</span>} size="small">
        <Spin />
      </Card>
    )
  }

  return (
    <Card
      title={
        <span style={{ color: '#e6edf3', fontSize: 13, fontWeight: 500 }}>
          <ClockCircleOutlined style={{ color: '#3b82f6', marginRight: 8 }} />
          地质年代
          <Tag color="blue" style={{
            marginLeft: 10, fontSize: 10, lineHeight: '16px',
            background: 'rgba(59,130,246,0.12)', border: 'none', color: '#60a5fa',
          }}>
            {ageItems.length}
          </Tag>
        </span>
      }
      size="small"
      style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}
    >
      {/* Periods */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#4a5568', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>
          纪 Period
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {periodGroups.map((pg) => (
            <Button
              key={pg.period}
              size="small"
              type={selectedPeriod === pg.period ? 'primary' : 'default'}
              onClick={() => setSelectedPeriod(selectedPeriod === pg.period ? null : pg.period)}
              style={{ fontSize: 11, padding: '0 12px', height: 28, fontWeight: 400 }}
            >
              {pg.period}
              <span style={{
                display: 'inline-block', width: 5, height: 5, borderRadius: 3,
                background: ERA_COLORS[pg.era] || '#999', marginLeft: 7,
              }} />
            </Button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div style={{ padding: '0 6px' }}>
        <Slider
          min={sliderMin} max={sliderMax} step={null}
          marks={marks}
          value={selectedAgeMa ?? undefined}
          onChange={(v) => setSelectedAge(v as number)}
          tooltip={{ formatter: (v) => formatAge(v!) }}
        />
      </div>

      {/* Selected display */}
      {selectedAgeMa != null && (
        <div style={{ textAlign: 'center', fontSize: 13, marginTop: 6 }}>
          <span style={{ color: '#93c5fd', fontFamily: "'Fira Code', monospace", fontWeight: 500 }}>
            {formatAge(selectedAgeMa)}
          </span>
          {(() => {
            const a = ageItems.find((x: { age_ma: number }) => x.age_ma === selectedAgeMa)
            return a ? (
              <span style={{ color: '#8899aa', fontSize: 11, marginLeft: 8 }}>
                {a.era} · {a.period}{a.epoch ? ` · ${a.epoch}` : ''}
              </span>
            ) : null
          })()}
        </div>
      )}
    </Card>
  )
}
