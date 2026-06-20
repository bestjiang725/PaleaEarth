import { Card, Button, Space, Slider, Tag, Spin } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useAges } from '../../hooks/useTimeline'
import { useAppStore } from '../../stores/appStore'
import { formatAge } from '../../utils/format'
import { useState, useMemo } from 'react'

const ERA_COLORS: Record<string, { color: string; zh: string }> = {
  Paleozoic: { color: '#3b82f6', zh: '古生代' },
  Mesozoic: { color: '#06b6d4', zh: '中生代' },
  Cenozoic: { color: '#f59e0b', zh: '新生代' },
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
      if (!groups[a.period]) {
        groups[a.period] = { period: a.period, era: a.era, ages: [] }
      }
      groups[a.period].ages.push(a.age_ma)
    }
    return Object.values(groups)
  }, [ageItems])

  const marks: Record<number, string> = {}
  for (const a of ageItems) {
    marks[a.age_ma] = `${a.age_ma}`
  }

  const sliderMin = ageItems.length > 0 ? Math.min(...ageItems.map((a: { age_ma: number }) => a.age_ma)) : 0
  const sliderMax = ageItems.length > 0 ? Math.max(...ageItems.map((a: { age_ma: number }) => a.age_ma)) : 0

  if (isLoading) {
    return (
      <Card
        title={<span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 13 }}><ClockCircleOutlined /> 地质年代</span>}
        size="small"
        style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      >
        <Spin />
      </Card>
    )
  }

  return (
    <Card
      title={
        <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 13 }}>
          <ClockCircleOutlined style={{ color: '#3b82f6', marginRight: 6 }} />
          地质年代
          <Tag color="blue" style={{ marginLeft: 8, fontSize: 10, lineHeight: '16px', background: 'rgba(59,130,246,0.15)', border: 'none', color: '#60a5fa' }}>
            {ageItems.length} 时间切片
          </Tag>
        </span>
      }
      size="small"
      style={{
        borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
      }}
      bodyStyle={{ padding: '10px 14px' }}
    >
      {/* Period selector */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#5a6677', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>纪 Period</div>
        <Space wrap size={4}>
          {periodGroups.map((pg) => (
            <Button
              key={pg.period}
              size="small"
              type={selectedPeriod === pg.period ? 'primary' : 'default'}
              onClick={() => setSelectedPeriod(selectedPeriod === pg.period ? null : pg.period)}
              style={{
                fontSize: 11,
                padding: '0 8px',
                height: 26,
                background: selectedPeriod === pg.period ? undefined : 'rgba(30,39,64,0.5)',
                borderColor: selectedPeriod === pg.period ? undefined : '#1e2740',
              }}
            >
              {pg.period}
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: 3,
                background: ERA_COLORS[pg.era]?.color || '#999',
                marginLeft: 6,
              }} />
            </Button>
          ))}
        </Space>
      </div>

      {/* Age slider */}
      <div style={{ padding: '0 4px' }}>
        <Slider
          min={sliderMin}
          max={sliderMax}
          step={null}
          marks={marks}
          value={selectedAgeMa ?? undefined}
          onChange={(v) => setSelectedAge(v as number)}
          tooltip={{
            formatter: (v) => formatAge(v!),
          }}
        />
      </div>

      {/* Current selection */}
      {selectedAgeMa != null && (
        <div style={{
          textAlign: 'center', fontSize: 12, color: '#60a5fa', fontWeight: 500,
          marginTop: 2,
        }}>
          {formatAge(selectedAgeMa)}
          {(() => {
            const a = ageItems.find((x: { age_ma: number }) => x.age_ma === selectedAgeMa)
            return a ? ` · ${a.era}/${a.period}${a.epoch ? ` · ${a.epoch}` : ''}` : ''
          })()}
        </div>
      )}
    </Card>
  )
}
