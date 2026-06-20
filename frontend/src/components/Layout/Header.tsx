import { Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { GlobalOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

const items: MenuProps['items'] = [
  { key: '/', label: '地图' },
  { key: '/compare', label: '对比' },
  { key: '/timeseries', label: '时间序列' },
  { key: '/download', label: '下载' },
  { key: '/docs', label: '文档' },
]

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '0 28px',
      background: 'linear-gradient(180deg, rgba(15,21,32,0.95) 0%, rgba(13,17,25,0.95) 100%)',
      borderBottom: '1px solid #192030',
      height: 56, minHeight: 56, flexShrink: 0,
      backdropFilter: 'blur(12px)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 40, cursor: 'pointer' }}
        onClick={() => navigate('/')}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(37,99,235,0.25)',
        }}>
          <GlobalOutlined style={{ fontSize: 17, color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, color: '#f0f4ff', letterSpacing: -0.3, lineHeight: 1.1 }}>
            DeepEarth
          </div>
          <div style={{ fontSize: 9, color: '#4a5568', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Paleoclimate
          </div>
        </div>
      </div>

      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, background: 'transparent', borderBottom: 'none', minWidth: 0 }}
        theme="dark"
      />
    </div>
  )
}
