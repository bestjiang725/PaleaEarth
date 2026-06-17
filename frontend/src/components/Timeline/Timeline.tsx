import { Card, Button, Space, Slider, Tag, Spin } from 'antd'
import { useAges } from '../../hooks/useTimeline'
import { useAppStore } from '../../stores/appStore'
import { formatAge } from '../../utils/format'
import { useState, useMemo } from 'react'

const ERA_INFO = {
  Paleozoic: { color: '#4caf50', zh: '古生代' },
  Mesozoic: { color: '#2196f3', zh: '中生代' },
  Cenozoic: { color: '#ff9800', zh: '新生代' },
}

export default function Timeline() {
  const { data, isLoading } = useAges()
  const { selectedAgeMa, setSelectedAge } = useAppStore()
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)

  const ages = data?.data || []

  // Group ages by period
  const periodGroups = useMemo(() => {
    const groups: Record<string, { period: string; era: string; ages: number[] }> = {}
    for (const a of ages) {
      if (!groups[a.period]) {
        groups[a.period] = { period: a.period, era: a.era, ages: [] }
      }
      groups[a.period].ages.push(a.age_ma)
    }
    return Object.values(groups)
  }, [ages])

  // Build slider marks
  const marks: Record<number, string> = {}
  for (const a of ages) {
    marks[a.age_ma] = `${a.age_ma}`
  }

  const sliderMin = ages.length > 0 ? Math.min(...ages.map((a) => a.age_ma)) : 0
  const sliderMax = ages.length > 0 ? Math.max(...ages.map((a) => a.age_ma)) : 0

  if (isLoading) {
    return (
      <Card title="地质年代" size="small" style={{ borderRadius: 0 }}>
        <Spin />
      </Card>
    )
  }

  return (
    <Card
      title="地质年代时间轴"
      size="small"
      style={{ borderRadius: 0, borderTop: 'none' }}
      bodyStyle={{ padding: '8px 12px' }}
    >
      {/* Period selector */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>纪 (Period)</div>
        <Space wrap>
          {periodGroups.map((pg) => (
            <Button
              key={pg.period}
              size="small"
              type={selectedPeriod === pg.period ? 'primary' : 'default'}
              onClick={() => {
                setSelectedPeriod(selectedPeriod === pg.period ? null : pg.period)
              }}
            >
              {pg.period}
              <Tag
                color={ERA_INFO[pg.era as keyof typeof ERA_INFO]?.color || '#999'}
                style={{ marginLeft: 4, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}
              >
                {ERA_INFO[pg.era as keyof typeof ERA_INFO]?.zh || pg.era}
              </Tag>
            </Button>
          ))}
        </Space>
      </div>

      {/* Age slider */}
      <div style={{ padding: '0 8px' }}>
        <Slider
          min={sliderMin}
          max={sliderMax}
          step={null}
          marks={marks}
          value={selectedAgeMa ?? undefined}
          onChange={(v) => setSelectedAge(v as number)}
          tooltip={{ formatter: (v) => formatAge(v!) }}
          style={{ marginBottom: 8 }}
        />
      </div>

      {/* Current selection display */}
      {selectedAgeMa && (
        <div style={{ textAlign: 'center', fontSize: 13, color: '#1677ff', fontWeight: 500 }}>
          已选: {formatAge(selectedAgeMa)}
          {(() => {
            const a = ages.find((x) => x.age_ma === selectedAgeMa)
            return a ? ` — ${a.era} / ${a.period}${a.epoch ? ` / ${a.epoch}` : ''}` : ''
          })()}
        </div>
      )}
    </Card>
  )
}
