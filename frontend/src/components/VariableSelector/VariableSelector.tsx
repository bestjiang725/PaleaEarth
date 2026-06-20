import { useState, useMemo } from 'react'
import { Card, Collapse, Input, Tag, Spin, Empty } from 'antd'
import { SearchOutlined, ExperimentOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { fetchVariables } from '../../api/variableApi'
import { useAppStore } from '../../stores/appStore'
import { CATEGORY_LABELS } from '../../types/climate'
import type { ClimateVariable, VariableCategory } from '../../types/climate'

const CATEGORY_DOTS: Record<string, string> = {
  temperature: '#ef4444', precipitation: '#3b82f6', wind: '#8b5cf6',
  pressure: '#f59e0b', cloud: '#64748b', soil: '#a1622b',
  evaporation: '#22c55e', radiation: '#eab308', flux: '#ec4899',
  ice: '#06b6d4', snow: '#bae6fd', runoff: '#6366f1',
  humidity: '#84cc16', wind_stress: '#a78bfa',
}

export default function VariableSelector() {
  const { data, isLoading } = useQuery({ queryKey: ['variables'], queryFn: () => fetchVariables() })
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
          display: 'inline-block', width: 7, height: 7, borderRadius: 4,
          background: CATEGORY_DOTS[category] || '#999', marginRight: 10,
        }} />
        {CATEGORY_LABELS[category as VariableCategory] || category}
        <Tag style={{
          marginLeft: 10, fontSize: 10, lineHeight: '16px', padding: '0 6px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid #192030', color: '#4a5568',
        }}>
          {vars.length}
        </Tag>
      </span>
    ),
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {vars.map((v) => {
          const isSelected = selectedVarName === v.var_name
          return (
            <div
              key={v.var_name}
              onClick={() => setSelectedVariable(v.var_name, v.colormap)}
              style={{
                padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                background: isSelected ? 'rgba(77,159,255,0.1)' : 'transparent',
                border: isSelected ? '1px solid rgba(77,159,255,0.3)' : '1px solid transparent',
                fontSize: 12, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center',
              }}
            >
              <span style={{
                width: 5, height: 5, borderRadius: 3, flexShrink: 0,
                background: CATEGORY_DOTS[category] || '#999', marginRight: 10,
              }} />
              <span style={{
                color: isSelected ? '#93c5fd' : '#e6edf3',
                fontWeight: isSelected ? 500 : 400,
                fontFamily: "'Fira Code', monospace", fontSize: 11,
              }}>
                {v.var_name}
              </span>
              <span style={{ marginLeft: 8, color: '#8899aa', flex: 1, fontSize: 11 }}>
                {v.display_name_zh || ''}
              </span>
              <span style={{ color: '#4a5568', fontSize: 10 }}>{v.units || ''}</span>
            </div>
          )
        })}
      </div>
    ),
  }))

  return (
    <Card
      title={
        <span style={{ color: '#e6edf3', fontSize: 13, fontWeight: 500 }}>
          <ExperimentOutlined style={{ color: '#2dd4bf', marginRight: 8 }} />
          气候变量
          <Tag color="cyan" style={{
            marginLeft: 10, fontSize: 10, lineHeight: '16px',
            background: 'rgba(45,212,191,0.1)', border: 'none', color: '#2dd4bf',
          }}>
            {variables.length}
          </Tag>
        </span>
      }
      size="small"
      style={{ borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
    >
      <Input
        size="small"
        prefix={<SearchOutlined style={{ color: '#4a5568' }} />}
        placeholder="搜索变量..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />
      {isLoading ? (
        <Spin />
      ) : collapseItems.length > 0 ? (
        <Collapse size="small" items={collapseItems} defaultActiveKey={['temperature']}
          style={{ background: 'transparent' }}
        />
      ) : (
        <Empty description={<span style={{ color: '#4a5568' }}>无匹配变量</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  )
}
