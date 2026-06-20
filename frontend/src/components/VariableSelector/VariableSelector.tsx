import { useState, useMemo } from 'react'
import { Card, Collapse, Input, Tag, Spin, Empty } from 'antd'
import { SearchOutlined, ExperimentOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { fetchVariables } from '../../api/variableApi'
import { useAppStore } from '../../stores/appStore'
import { CATEGORY_LABELS } from '../../types/climate'
import type { ClimateVariable, VariableCategory } from '../../types/climate'

const CATEGORY_COLORS: Record<string, string> = {
  temperature: '#ef4444', precipitation: '#3b82f6', wind: '#8b5cf6',
  pressure: '#f59e0b', cloud: '#64748b', soil: '#a1622b',
  evaporation: '#22c55e', radiation: '#eab308', flux: '#ec4899',
  ice: '#06b6d4', snow: '#bae6fd', runoff: '#6366f1',
  humidity: '#84cc16', wind_stress: '#a78bfa',
}

export default function VariableSelector() {
  const { data, isLoading } = useQuery({
    queryKey: ['variables'],
    queryFn: () => fetchVariables(),
  })
  const selectedVarName = useAppStore((s) => s.selectedVarName)
  const setSelectedVariable = useAppStore((s) => s.setSelectedVariable)
  const [search, setSearch] = useState('')

  const variables = data?.data || []

  const groups = useMemo(() => {
    const map: Record<string, ClimateVariable[]> = {}
    for (const v of variables) {
      if (!map[v.category]) map[v.category] = []
      map[v.category].push(v)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [variables])

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups
    const s = search.toLowerCase()
    return groups
      .map(([cat, vars]) => [
        cat,
        vars.filter((v) =>
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
      <span style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: 3,
          background: CATEGORY_COLORS[category] || '#999', marginRight: 8,
          boxShadow: `0 0 6px ${CATEGORY_COLORS[category] || '#999'}66`,
        }} />
        {CATEGORY_LABELS[category as VariableCategory] || category}
        <Tag style={{
          marginLeft: 8, fontSize: 10, lineHeight: '16px', padding: '0 5px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid #1e2740', color: '#5a6677',
        }}>
          {vars.length}
        </Tag>
      </span>
    ),
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {vars.map((v) => {
          const isSelected = selectedVarName === v.var_name
          return (
            <div
              key={v.var_name}
              onClick={() => setSelectedVariable(v.var_name, v.colormap)}
              style={{
                padding: '5px 10px',
                borderRadius: 4,
                cursor: 'pointer',
                background: isSelected ? 'rgba(59,130,246,0.12)' : 'transparent',
                border: isSelected ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                fontSize: 11,
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center',
              }}
            >
              <span style={{
                width: 4, height: 4, borderRadius: 2,
                background: CATEGORY_COLORS[category] || '#999',
                marginRight: 8, flexShrink: 0,
              }} />
              <span style={{
                color: isSelected ? '#60a5fa' : '#e2e8f0',
                fontWeight: isSelected ? 500 : 400,
                fontFamily: "'Fira Code', monospace",
              }}>
                {v.var_name}
              </span>
              <span style={{ marginLeft: 6, color: '#94a3b8', flex: 1 }}>
                {v.display_name_zh || ''}
              </span>
              <span style={{ color: '#5a6677', fontSize: 10 }}>{v.units || ''}</span>
            </div>
          )
        })}
      </div>
    ),
  }))

  return (
    <Card
      title={
        <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 13 }}>
          <ExperimentOutlined style={{ color: '#06b6d4', marginRight: 6 }} />
          气候变量
          <Tag color="cyan" style={{
            marginLeft: 8, fontSize: 10, lineHeight: '16px',
            background: 'rgba(6,182,212,0.15)', border: 'none', color: '#22d3ee',
          }}>
            {variables.length}
          </Tag>
        </span>
      }
      size="small"
      style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      bodyStyle={{ padding: '6px 10px', maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}
    >
      <Input
        size="small"
        prefix={<SearchOutlined style={{ color: '#5a6677' }} />}
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
        <Empty description={<span style={{ color: '#5a6677' }}>无匹配变量</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  )
}
