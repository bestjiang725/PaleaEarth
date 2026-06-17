import { Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { GlobalOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

const items: MenuProps['items'] = [
  { key: '/', label: '地图可视化' },
  { key: '/compare', label: '对比模式' },
  { key: '/timeseries', label: '时间序列' },
  { key: '/download', label: '下载中心' },
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
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      height: 56,
      minHeight: 56,
      zIndex: 100,
      flexShrink: 0,
    }}>
      <div style={{
        color: '#fff',
        fontSize: 18,
        fontWeight: 700,
        marginRight: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
      }}>
        <GlobalOutlined style={{ fontSize: 22 }} />
        古地球气候剖面可视化
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
