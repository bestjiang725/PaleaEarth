import Header from '../components/Layout/Header'

export default function DownloadPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0a0d14' }}>
      <Header />
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, color: '#94a3b8',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 24 }}>📦</span>
        </div>
        <span style={{ fontSize: 18, color: '#cbd5e1', fontWeight: 500 }}>下载中心</span>
        <span style={{ fontSize: 13, color: '#5a6677' }}>NC 文件下载管理 — Phase 2</span>
      </div>
    </div>
  )
}
