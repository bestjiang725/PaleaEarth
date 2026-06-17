import { Layout, Result } from 'antd'
import Header from '../components/Layout/Header'

export default function DownloadPage() {
  return (
    <Layout style={{ height: '100vh' }}>
      <Header />
      <Layout.Content style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Result
          title="下载中心"
          subTitle="NC 文件下载管理功能将在 Phase 2 实现"
          status="info"
        />
      </Layout.Content>
    </Layout>
  )
}
