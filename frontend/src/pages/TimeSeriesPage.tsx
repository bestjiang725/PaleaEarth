import Header from '../components/Layout/Header'

export default function TimeSeriesPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0a0d14' }}>
      <Header />
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, color: '#94a3b8',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 24 }}>📈</span>
        </div>
        <span style={{ fontSize: 18, color: '#cbd5e1', fontWeight: 500 }}>时间序列</span>
        <span style={{ fontSize: 13, color: '#5a6677' }}>高级时间序列分析 — Phase 2</span>
        <span style={{ fontSize: 12, color: '#5a6677' }}>当前可在主页数据面板查看基本时间序列</span>
      </div>
    </div>
  )
}
