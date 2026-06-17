import { useState, useMemo } from 'react'
import { Card, Collapse, Input, Tag, Spin, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { fetchVariables } from '../../api/variableApi'
import { useAppStore } from '../../stores/appStore'
import { CATEGORY_LABELS } from '../../types/climate'
import type { ClimateVariable, VariableCategory } from '../../types/climate'

const CATEGORY_COLORS: Record<string, string> = {
  temperature: '#f5222d', precipitation: '#1677ff', wind: '#722ed1',
  pressure: '#fa8c16', cloud: '#8c8c8c', soil: '#a0522d',
  evaporation: '#52c41a', radiation: '#faad14', flux: '#eb2f96',
  ice: '#13c2c2', snow: '#87ceeb', runoff: '#2f54eb',
  humidity: '#7cb305', wind_stress: '#9254de',
}

export default function VariableSelector() {
  const { data, isLoading } = useQuery({
    queryKey: ['variables'],
    queryFn: () => fetchVariables(),
  })
  const { selectedVarName, setSelectedVariable } = useAppStore()
  const [search, setSearch] = useState('')

  const variables = data?.data || []

  // Group by category
  const groups = useMemo(() => {
    const map: Record<string, ClimateVariable[]> = {}
    for (const v of variables) {
      if (!map[v.category]) map[v.category] = []
      map[v.category].push(v)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [variables])

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups
    const s = search.toLowerCase()
    return groups
      .map(([cat, vars]) => [
        cat,
        vars.filter(
          (v) =>
            v.var_name.toLowerCase().includes(s) ||
            (v.display_name_zh || '').includes(s) ||
            (v.units || '').includes(s)
        ),
      ] as const)
      .filter(([, vars]) => vars.length > 0)
  }, [groups, search])

  const collapseItems = filteredGroups.map(([category, vars]) => ({
    key: category,
    label: (
      <span style={{ fontSize: 13, fontWeight: 500 }}>
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: 4,
          background: CATEGORY_COLORS[category] || '#999', marginRight: 8,
        }} />
        {CATEGORY_LABELS[category as VariableCategory] || category}
        <Tag style={{ marginLeft: 8 }}>{vars.length}</Tag>
      </span>
    ),
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {vars.map((v) => (
          <div
            key={v.var_name}
            onClick={() => setSelectedVariable(v.var_name, v.colormap)}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              background: selectedVarName === v.var_name ? '#e6f4ff' : 'transparent',
              fontSize: 12,
              border: selectedVarName === v.var_name ? '1px solid #1677ff' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ color: CATEGORY_COLORS[category] || '#999', fontWeight: 500 }}>
              {v.var_name}
            </span>
            <span style={{ marginLeft: 8, color: '#666' }}>
              {v.display_name_zh || ''}
            </span>
            <span style={{ float: 'right', color: '#999' }}>{v.units || ''}</span>
          </div>
        ))}
      </div>
    ),
  }))

  return (
    <Card
      title="气候变量"
      size="small"
      style={{ borderRadius: 0, borderTop: 'none' }}
      bodyStyle={{ padding: '4px 8px', maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}
    >
      <Input
        size="small"
        prefix={<SearchOutlined />}
        placeholder="搜索变量..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 8 }}
        allowClear
      />
      {isLoading ? (
        <Spin />
      ) : collapseItems.length > 0 ? (
        <Collapse
          size="small"
          items={collapseItems}
          defaultActiveKey={['temperature', 'precipitation']}
          style={{ background: 'transparent' }}
        />
      ) : (
        <Empty description="无匹配变量" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  )
}
