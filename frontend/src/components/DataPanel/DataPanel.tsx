import { useState } from 'react'
import { Button, Empty, Table } from 'antd'
import { BarChartOutlined, UpOutlined, DownOutlined } from '@ant-design/icons'
import { useAppStore } from '../../stores/appStore'
import { useQuery } from '@tanstack/react-query'
import { fetchAges } from '../../api/timeApi'
import { queryTimeSeries } from '../../api/queryApi'
import type { TimeSeriesResult } from '../../types/api'

const SAMPLE_POINTS = [
  { label: '北京', lon: 116.4, lat: 39.9 },
  { label: '赤道(大西洋)', lon: -25, lat: 0 },
  { label: '赤道(太平洋)', lon: -140, lat: 0 },
  { label: '南极', lon: 0, lat: -85 },
  { label: '北极', lon: 0, lat: 85 },
  { label: '伦敦', lon: -0.1, lat: 51.5 },
  { label: '纽约', lon: -74, lat: 40.7 },
  { label: '新加坡', lon: 103.8, lat: 1.3 },
]

export default function DataPanel() {
  const { selectedVarName } = useAppStore()
  const [collapsed, setCollapsed] = useState(true)
  const [samplePoint, setSamplePoint] = useState(SAMPLE_POINTS[0])

  useQuery({
    queryKey: ['ages'],
    queryFn: () => fetchAges(),
  })

  const { data: tsData, isLoading } = useQuery({
    queryKey: ['timeSeries', samplePoint.lon, samplePoint.lat, selectedVarName],
    queryFn: () => queryTimeSeries(samplePoint.lon, samplePoint.lat, selectedVarName!),
    enabled: !!selectedVarName,
  })

  const series = (tsData as { data: TimeSeriesResult } | null)?.data?.series || []
  const units = (tsData as { data: TimeSeriesResult } | null)?.data?.units || ''

  return (
    <div style={{
      borderTop: '1px solid #e8e8e8',
      background: '#fff',
      transition: 'height 0.3s',
      height: collapsed ? 48 : 280,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Toggle bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', cursor: 'pointer', background: '#fafafa',
      }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          数据面板
        </span>
        <Button size="small" type="text" icon={collapsed ? <UpOutlined /> : <DownOutlined />} />
      </div>

      {!collapsed && (
        <div style={{ flex: 1, padding: '12px 16px', overflow: 'auto', display: 'flex', gap: 16 }}>
          {/* Sample point selector */}
          <div style={{ width: 160 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>采样点</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SAMPLE_POINTS.map((p) => (
                <Button
                  key={p.label}
                  size="small"
                  type={samplePoint.label === p.label ? 'primary' : 'default'}
                  onClick={() => setSamplePoint(p)}
                  style={{ textAlign: 'left' }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Time series data */}
          <div style={{ flex: 1 }}>
            {selectedVarName ? (
              <Table
                size="small"
                pagination={false}
                loading={isLoading}
                dataSource={[...series].reverse()}
                rowKey="age_ma"
                columns={[
                  { title: '年代 (Ma)', dataIndex: 'age_ma', key: 'age', width: 100,
                    render: (v: number) => `${v} Ma` },
                  { title: `${selectedVarName} (${units})`, dataIndex: 'value', key: 'value',
                    render: (v: number | null) => v != null ? v.toFixed(4) : '—' },
                ]}
                style={{ fontSize: 12 }}
              />
            ) : (
              <Empty description="请先选择一个气候变量" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
