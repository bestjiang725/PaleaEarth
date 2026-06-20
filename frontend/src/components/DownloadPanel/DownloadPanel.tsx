import { Card, Table, Tag, Spin, Empty } from 'antd'
import { CloudDownloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { listTasks } from '../../api/taskApi'
import type { TaskStatus } from '../../types/api'

const STATUS_CONFIG: Record<string, { color: string; zh: string }> = {
  pending: { color: 'default', zh: '等待' },
  running: { color: 'processing', zh: '运行中' },
  done: { color: 'success', zh: '完成' },
  fail: { color: 'error', zh: '失败' },
}

export default function DownloadPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks(),
    refetchInterval: 5000,
  })

  const tasks = (data as { data: { tasks: TaskStatus[] } } | null)?.data?.tasks || []

  return (
    <Card
      title={
        <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 13 }}>
          <CloudDownloadOutlined style={{ color: '#f59e0b', marginRight: 6 }} />
          任务列表
          <Tag style={{
            marginLeft: 8, fontSize: 10, lineHeight: '16px', padding: '0 5px',
            background: 'rgba(245,158,11,0.12)', border: 'none', color: '#fbbf24',
          }}>
            {tasks.length}
          </Tag>
        </span>
      }
      size="small"
      style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      bodyStyle={{ padding: '4px 8px', maxHeight: 200, overflowY: 'auto' }}
    >
      {isLoading ? (
        <Spin />
      ) : tasks.length > 0 ? (
        <Table
          size="small"
          pagination={false}
          dataSource={tasks.slice(0, 10)}
          rowKey="task_id"
          columns={[
            {
              title: '', dataIndex: 'status', key: 'status', width: 60,
              render: (s: string) => {
                const cfg = STATUS_CONFIG[s] || { color: 'default', zh: s }
                return <Tag color={cfg.color} style={{ fontSize: 10 }}>{cfg.zh}</Tag>
              },
            },
            {
              title: '', dataIndex: 'task_type', key: 'type', width: 100,
              render: (t: string) => <span style={{ color: '#94a3b8', fontSize: 10 }}>{t}</span>,
            },
            {
              title: '', dataIndex: 'progress', key: 'progress', width: 40,
              render: (p: number) => (
                <span style={{ color: '#60a5fa', fontSize: 10, fontFamily: "'Fira Code', monospace" }}>{p}%</span>
              ),
            },
          ]}
          showHeader={false}
        />
      ) : (
        <Empty description={<span style={{ color: '#5a6677' }}>暂无任务</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  )
}
