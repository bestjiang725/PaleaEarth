import { Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { GlobalOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

const items: MenuProps['items'] = [
  { key: '/', label: '地图可视化' },
  { key: '/compare', label: '对比模式' },
  { key: '/timeseries', label: '时间序列' },
  { key: '/download', label: '下载' },
  { key: '/docs', label: '文档' },
]

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      background: 'linear-gradient(135deg, #0d111a 0%, #111d2e 50%, #0d111a 100%)',
      borderBottom: '1px solid #1e2740',
      height: 52,
      minHeight: 52,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginRight: 32,
        cursor: 'pointer',
      }}
        onClick={() => navigate('/')}
      >
        <div style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e40af 0%, #06b6d4 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(59, 130, 246, 0.3)',
        }}>
          <GlobalOutlined style={{ fontSize: 16, color: '#fff' }} />
        </div>
        <span style={{
          fontWeight: 600, fontSize: 17, color: '#f0f4ff',
          letterSpacing: 0.5,
        }}>
          DeepEarth
        </span>
        <span style={{
          fontSize: 10, color: '#5a6677', marginTop: 2, letterSpacing: 1,
        }}>
          PALEOCLIMATE
        </span>
      </div>

      {/* Navigation */}
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
        style={{
          flex: 1, background: 'transparent', borderBottom: 'none', minWidth: 0,
          color: 'var(--text-primary)',
        }}
        theme="dark"
      />
    </div>
  )
}
