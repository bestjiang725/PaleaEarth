import { Card, Table, Tag, Spin, Empty } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { listTasks } from '../../api/taskApi'
import type { TaskStatus } from '../../types/api'

const STATUS_COLORS: Record<string, string> = {
  pending: 'default', running: 'processing', done: 'success', fail: 'error',
}

const STATUS_ZH: Record<string, string> = {
  pending: '等待中', running: '进行中', done: '已完成', fail: '失败',
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
      title="任务列表"
      size="small"
      style={{ borderRadius: 0, borderTop: 'none' }}
      bodyStyle={{ padding: '4px 8px' }}
    >
      {isLoading ? (
        <Spin />
      ) : tasks.length > 0 ? (
        <Table
          size="small"
          pagination={false}
          dataSource={tasks}
          rowKey="task_id"
          columns={[
            {
              title: '状态', dataIndex: 'status', key: 'status', width: 80,
              render: (s: string) => <Tag color={STATUS_COLORS[s] || 'default'}>{STATUS_ZH[s] || s}</Tag>,
            },
            {
              title: '类型', dataIndex: 'task_type', key: 'type', width: 120,
            },
            {
              title: '进度', dataIndex: 'progress', key: 'progress', width: 70,
              render: (p: number) => `${p}%`,
            },
          ]}
          style={{ fontSize: 12 }}
        />
      ) : (
        <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  )
}
