import { Layout, Result } from 'antd'
import Header from '../components/Layout/Header'

export default function TimeSeriesPage() {
  return (
    <Layout style={{ height: '100vh' }}>
      <Header />
      <Layout.Content style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Result
          title="时间序列"
          subTitle="高级时间序列分析功能将在 Phase 2 实现。当前可在主页数据面板查看基本时间序列。"
          status="info"
        />
      </Layout.Content>
    </Layout>
  )
}
