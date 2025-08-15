import { ProDescriptions } from '@ant-design/pro-components';
import { Spin, Tag, Popover, Space } from 'antd';

interface TaskDetailProps {
  taskDetailLoading: boolean;
  taskDetail: API.TaskListItem | undefined;
}

const TaskDetail: React.FC<TaskDetailProps> = ({
  taskDetailLoading,
  taskDetail,
}) => {
  const taskDetailColumns = [
    {
      title: '任务 ID',
      dataIndex: 'id',
    },
    {
      title: '任务名称',
      dataIndex: 'name',
    },
    {
      title: '任务状态',
      dataIndex: 'status',
      valueEnum: {
        pending: { text: '等待中', status: 'default' },
        running: { text: '运行中', status: 'processing' },
        completed: { text: '已完成', status: 'success' },
        failed: { text: '失败', status: 'error' },
        stopped: { text: '已停止', status: 'warning' },
      },
    },
    {
      title: '执行线程数',
      dataIndex: 'threadCount',
    },
    {
      title: '所属项目',
      dataIndex: ['project', 'name'],
    },
    {
      title: '账号组',
      dataIndex: 'accountGroups',
      render: (dom: any, entity: any) => (
        <Space wrap>
          {entity.accountGroups && entity.accountGroups.length > 0
            ? entity.accountGroups.map((group: any) => (
                <Tag key={group.id} color="blue">
                  {group.name}
                </Tag>
              ))
            : '-'}
        </Space>
      ),
    },
    {
      title: '任务脚本',
      dataIndex: 'scripts',
      render: (dom: any, entity: any) => (
        <Space wrap>
          {entity.scripts && entity.scripts.length > 0
            ? entity.scripts.map((script: any) => (
                <Popover key={script.id} content={script.filePath}>
                  <Tag key={script.id} color="green">
                    {script.name}
                  </Tag>
                </Popover>
              ))
            : '-'}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
    },
  ];

  return (
    <Spin spinning={taskDetailLoading}>
      <ProDescriptions
        column={4}
        title={false}
        dataSource={taskDetail}
        columns={taskDetailColumns}
      />
    </Spin>
  );
};

export default TaskDetail;
