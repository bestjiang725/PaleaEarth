import { Typography, Card, Table, Divider } from 'antd'
import Header from '../components/Layout/Header'

const { Title, Paragraph } = Typography

const VARIABLE_TABLE = [
  { var_name: 'temp_mm_srf', zh: '地表温度', units: 'K', category: '温度' },
  { var_name: 'temp_mm_1_5m', zh: '近地面气温(1.5m)', units: 'K', category: '温度' },
  { var_name: 'precip_mm_srf', zh: '总降水率', units: 'kg/m²/s', category: '降水' },
  { var_name: 'u_mm_10m', zh: '10m纬向风', units: 'm/s', category: '风场' },
  { var_name: 'v_mm_10m', zh: '10m经向风', units: 'm/s', category: '风场' },
  { var_name: 'p_mm_msl', zh: '海平面气压', units: 'Pa', category: '气压' },
  { var_name: 'totCloud_mm_ua', zh: '总云量', units: 'fraction', category: '云量' },
  { var_name: 'sm_mm_soil', zh: '土壤湿度', units: 'kg/m²', category: '土壤' },
  { var_name: 'solar_mm_s3_srf', zh: '地表净短波辐射', units: 'W/m²', category: '辐射' },
  { var_name: 'longwave_mm_s3_srf', zh: '地表净长波辐射', units: 'W/m²', category: '辐射' },
  { var_name: 'sh_mm_hyb', zh: '感热通量', units: 'W/m²', category: '通量' },
  { var_name: 'lh_mm_srf', zh: '潜热通量', units: 'W/m²', category: '通量' },
  { var_name: 'iceconc_mm_srf', zh: '海冰覆盖率', units: 'fraction', category: '海冰' },
  { var_name: 'icedepth_mm_srf', zh: '海冰厚度', units: 'm', category: '海冰' },
  { var_name: 'snowdepth_mm_srf', zh: '积雪深度', units: 'm', category: '积雪' },
  { var_name: 'srfRunoff_mm_srf', zh: '地表径流', units: 'kg/m²/s', category: '径流' },
]

export default function DocsPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0a0d14' }}>
      <Header />
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 48px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Title level={2} style={{ color: '#e2e8f0' }}>
            DeepEarth — 古气候可视化系统
          </Title>

          <Title level={3} style={{ color: '#cbd5e1' }}>概述</Title>
          <Paragraph style={{ color: '#94a3b8' }}>
            DeepEarth 提供古地球气候模拟数据的交互式可视化，覆盖 430–505 Ma（百万年前）
            古生代的寒武纪、奥陶纪和志留纪。数据源自 UK Met Office 统一模型（Unified Model v4.5/4.6）
            的古气候模拟输出。
          </Paragraph>

          <Title level={3} style={{ color: '#cbd5e1' }}>使用方法</Title>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Paragraph style={{ color: '#cbd5e1' }}>
              1. 在左侧面板选择<b>地质年代</b>（纪选择器或滑动条）
            </Paragraph>
            <Paragraph style={{ color: '#cbd5e1' }}>
              2. 在<b>气候变量</b>面板选择要显示的变量
            </Paragraph>
            <Paragraph style={{ color: '#cbd5e1' }}>
              3. 地图区域将自动生成并显示气候数据覆盖图
            </Paragraph>
            <Paragraph style={{ color: '#cbd5e1' }}>
              4. 点击地图任意位置查看该点的具体数值
            </Paragraph>
            <Paragraph style={{ color: '#cbd5e1' }}>
              5. 在底部数据面板查看不同地点的气候时间序列
            </Paragraph>
          </Card>

          <Title level={3} style={{ color: '#cbd5e1' }}>数据规范</Title>
          <Table
            dataSource={[
              { key: 'grid', label: '空间网格', value: '96 × 73 (经度 × 纬度)' },
              { key: 'res', label: '分辨率', value: '3.75° × 2.5°' },
              { key: 'range', label: '经度范围', value: '0° — 356.25°' },
              { key: 'lat', label: '纬度范围', value: '90°N — 90°S' },
              { key: 'format', label: '数据格式', value: 'NetCDF3 Classic' },
              { key: 'source', label: '模型来源', value: 'UK Met Office Unified Model' },
              { key: 'ages', label: '地质年代', value: '16 个时间切片 (430–505 Ma)' },
            ]}
            columns={[
              { title: '参数', dataIndex: 'label', key: 'label', width: 120 },
              { title: '值', dataIndex: 'value', key: 'value' },
            ]}
            pagination={false}
            size="small"
            style={{ marginBottom: 16 }}
          />

          <Title level={3} style={{ color: '#cbd5e1' }}>气候变量</Title>
          <Table
            dataSource={VARIABLE_TABLE.map((v, i) => ({ ...v, key: i }))}
            columns={[
              { title: '变量名', dataIndex: 'var_name', key: 'var_name' },
              { title: '中文名称', dataIndex: 'zh', key: 'zh' },
              { title: '单位', dataIndex: 'units', key: 'units' },
              { title: '类别', dataIndex: 'category', key: 'category' },
            ]}
            pagination={false}
            size="small"
            style={{ marginBottom: 16 }}
          />

          <Divider style={{ borderColor: '#1e2740' }} />
          <Paragraph style={{ color: '#5a6677', fontSize: 12 }}>
            DeepEarth v1.0.0 · Paleoclimate Visualizer · Phase 1 MVP
          </Paragraph>
        </div>
      </div>
    </div>
  )
}
