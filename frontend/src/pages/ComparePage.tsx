import { Layout, Result } from 'antd'
import Header from '../components/Layout/Header'

export default function ComparePage() {
  return (
    <Layout style={{ height: '100vh' }}>
      <Header />
      <Layout.Content style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Result
          title="对比模式"
          subTitle="双时间点/双属性并排对比功能将在 Phase 2 实现"
          status="info"
        />
      </Layout.Content>
    </Layout>
  )
}
