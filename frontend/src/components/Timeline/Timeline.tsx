import { Card, Slider, Tag, Spin } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useAges } from '../../hooks/useTimeline'
import { useAppStore } from '../../stores/appStore'
import { formatAge } from '../../utils/format'

const ERA = {
  Paleozoic: { zh: '古生代', color: '#3b82f6', start: 541, end: 252 },
}

const PERIODS = [
  { name: 'Silurian', zh: '志留纪', color: '#3b82f6', range: [419, 444] },
  { name: 'Ordovician', zh: '奥陶纪', color: '#6366f1', range: [444, 485] },
  { name: 'Cambrian', zh: '寒武纪', color: '#8b5cf6', range: [485, 541] },
]

export default function Timeline() {
  const { data, isLoading } = useAges()
  const selectedAgeMa = useAppStore((s) => s.selectedAgeMa)
  const setSelectedAge = useAppStore((s) => s.setSelectedAge)

  const ageItems = data?.data || []

  const sliderMin = ageItems.length > 0 ? Math.min(...ageItems.map((a: { age_ma: number }) => a.age_ma)) : 505
  const sliderMax = ageItems.length > 0 ? Math.max(...ageItems.map((a: { age_ma: number }) => a.age_ma)) : 430

  // Find which period the selected age falls in
  const currentPeriod = selectedAgeMa != null
    ? PERIODS.find((p) => selectedAgeMa >= p.range[0] && selectedAgeMa <= p.range[1])
    : null

  const selectedItem = selectedAgeMa != null
    ? ageItems.find((a: { age_ma: number }) => a.age_ma === selectedAgeMa)
    : null

  if (isLoading) {
    return <Card size="small" style={{ borderLeft: 'none', borderRight: 'none' }}><Spin /></Card>
  }

  return (
    <Card
      size="small"
      style={{ borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#e6edf3', fontSize: 13, fontWeight: 500 }}>
            <ClockCircleOutlined style={{ color: '#3b82f6', marginRight: 8 }} />
            地质年代
          </span>
          <Tag color="blue" style={{
            fontSize: 10, lineHeight: '17px',
            background: 'rgba(59,130,246,0.12)', border: 'none', color: '#60a5fa',
          }}>
            {ERA.Paleozoic.zh} · {ageItems.length} 切片
          </Tag>
        </div>
      }
    >
      {/* ─── Period Cards ─── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {PERIODS.map((p) => {
          const isActive = currentPeriod?.name === p.name
          const agesInPeriod = ageItems.filter(
            (a: { age_ma: number }) => a.age_ma >= p.range[0] && a.age_ma <= p.range[1],
          )
          return (
            <div
              key={p.name}
              onClick={() => {
                if (agesInPeriod.length > 0) setSelectedAge(agesInPeriod[0].age_ma)
              }}
              style={{
                flex: 1,
                padding: '12px 10px',
                borderRadius: 10,
                cursor: 'pointer',
                background: isActive
                  ? `linear-gradient(135deg, ${p.color}22 0%, ${p.color}08 100%)`
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isActive ? p.color + '44' : '#192030'}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 11, color: p.color, fontWeight: 500, marginBottom: 3 }}>
                {p.zh}
              </div>
              <div style={{ fontSize: 10, color: '#8899aa' }}>{p.name}</div>
              <div style={{
                marginTop: 6, display: 'flex', gap: 3, flexWrap: 'wrap',
              }}>
                {agesInPeriod.map((a: { age_ma: number }) => (
                  <span
                    key={a.age_ma}
                    onClick={(e) => { e.stopPropagation(); setSelectedAge(a.age_ma) }}
                    style={{
                      fontSize: 9, fontFamily: "'Fira Code', monospace",
                      padding: '2px 6px', borderRadius: 3,
                      background: selectedAgeMa === a.age_ma ? p.color + '33' : 'rgba(255,255,255,0.04)',
                      color: selectedAgeMa === a.age_ma ? p.color : '#8899aa',
                      border: selectedAgeMa === a.age_ma ? `1px solid ${p.color}55` : '1px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {a.age_ma}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Slider ─── */}
      <div style={{ padding: '0 6px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10, fontFamily: "'Fira Code', monospace",
          color: '#4a5568', marginBottom: 4, padding: '0 4px',
        }}>
          <span>{sliderMax} Ma</span>
          <span>{sliderMin} Ma</span>
        </div>
        <Slider
          min={sliderMin} max={sliderMax} step={1}
          value={selectedAgeMa ?? undefined}
          onChange={(v) => setSelectedAge(v as number)}
          tooltip={{ formatter: (v) => `${v} Ma` }}
          style={{ marginBottom: 12 }}
        />
      </div>

      {/* ─── Selected Age Detail ─── */}
      {selectedAgeMa != null && selectedItem && (
        <div style={{
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 10,
          padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <span style={{
              fontFamily: "'Fira Code', monospace", fontSize: 18, fontWeight: 600,
              color: '#93c5fd',
            }}>
              {formatAge(selectedAgeMa)}
            </span>
            <span style={{ fontSize: 12, color: '#8899aa' }}>
              {selectedItem.era} · {selectedItem.period}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#4a5568' }}>
            {selectedItem.epoch ? `${selectedItem.epoch}` : ''}
            {currentPeriod && ` · ${currentPeriod.range[0]}–${currentPeriod.range[1]} Ma`}
          </div>
        </div>
      )}
    </Card>
  )
}
