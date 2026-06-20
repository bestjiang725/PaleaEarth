import { useState } from 'react'
import { Button, Empty, Table } from 'antd'
import { LineChartOutlined, CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons'
import { useAppStore } from '../../stores/appStore'
import { useQuery } from '@tanstack/react-query'
import { queryTimeSeries } from '../../api/queryApi'
import type { TimeSeriesResult } from '../../types/api'

const SAMPLE_POINTS = [
  { label: '北京', lon: 116.4, lat: 39.9 },
  { label: '赤道·大西洋', lon: -25, lat: 0 },
  { label: '赤道·太平洋', lon: -140, lat: 0 },
  { label: '伦敦', lon: -0.1, lat: 51.5 },
  { label: '纽约', lon: -74, lat: 40.7 },
  { label: '新加坡', lon: 103.8, lat: 1.3 },
]

export default function DataPanel() {
  const selectedVarName = useAppStore((s) => s.selectedVarName)
  const [collapsed, setCollapsed] = useState(true)
  const [samplePoint, setSamplePoint] = useState(SAMPLE_POINTS[0])

  const { data: tsData, isLoading } = useQuery({
    queryKey: ['timeSeries', samplePoint.lon, samplePoint.lat, selectedVarName],
    queryFn: () => queryTimeSeries(samplePoint.lon, samplePoint.lat, selectedVarName!),
    enabled: !!selectedVarName,
  })

  const series = (tsData as { data: TimeSeriesResult } | null)?.data?.series || []
  const units = (tsData as { data: TimeSeriesResult } | null)?.data?.units || ''

  return (
    <div style={{
      borderTop: '1px solid #1e2740',
      background: '#0d1117',
      transition: 'height 0.25s ease',
      height: collapsed ? 42 : 260,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Toggle bar */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px', cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 500, fontSize: 13, color: '#cbd5e1' }}>
          <LineChartOutlined style={{ color: '#10b981', marginRight: 8 }} />
          数据面板
        </span>
        <Button size="small" type="text"
          icon={collapsed ? <CaretUpOutlined style={{ color: '#5a6677' }} /> : <CaretDownOutlined style={{ color: '#5a6677' }} />}
        />
      </div>

      {!collapsed && (
        <div style={{
          flex: 1, padding: '0 16px 12px', overflow: 'auto',
          display: 'flex', gap: 16,
        }}>
          {/* Sample points */}
          <div style={{ width: 120, flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: '#5a6677', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
              采样点
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {SAMPLE_POINTS.map((p) => (
                <Button
                  key={p.label}
                  size="small"
                  type={samplePoint.label === p.label ? 'primary' : 'default'}
                  onClick={() => setSamplePoint(p)}
                  style={{
                    textAlign: 'left', fontSize: 11, padding: '0 10px', height: 26,
                    background: samplePoint.label === p.label ? undefined : 'rgba(30,39,64,0.4)',
                    borderColor: samplePoint.label === p.label ? undefined : '#1e2740',
                    color: samplePoint.label === p.label ? undefined : '#cbd5e1',
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Data table */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedVarName ? (
              <Table
                size="small"
                pagination={false}
                loading={isLoading}
                dataSource={[...series].reverse()}
                rowKey="age_ma"
                columns={[
                  {
                    title: '年代', dataIndex: 'age_ma', key: 'age', width: 75,
                    render: (v: number) => (
                      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 11 }}>{v} Ma</span>
                    ),
                  },
                  {
                    title: `${selectedVarName}`, dataIndex: 'value', key: 'value',
                    render: (v: number | null) => v != null ? (
                      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: '#60a5fa' }}>
                        {v.toFixed(4)}
                      </span>
                    ) : <span style={{ color: '#5a6677' }}>—</span>,
                  },
                  {
                    title: '', dataIndex: 'units', key: 'units', width: 60,
                    render: () => <span style={{ color: '#5a6677', fontSize: 10 }}>{units}</span>,
                  },
                ]}
                style={{ fontSize: 11 }}
                showHeader={true}
              />
            ) : (
              <Empty
                description={<span style={{ color: '#5a6677' }}>选择变量以查看时间序列</span>}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
