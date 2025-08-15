import { List, Empty } from 'antd';
import { Dispatch, SetStateAction } from 'react';

interface TaskListProps {
  loading: boolean;
  taskData: API.TaskListItem[];
  taskId: number | undefined;
  setTaskId: Dispatch<SetStateAction<number | undefined>>;
  pagination: {
    current: number;
    pageSize: number;
    total?: number;
  };
  onPageChange: (page: number, pageSize: number) => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  loading, 
  taskData, 
  taskId, 
  setTaskId,
  pagination,
  onPageChange 
}) => {
  // 确保taskData是数组
  const tasks = Array.isArray(taskData) ? taskData : [];
  
  return (
    <List
      split={false}
      loading={loading}
      locale={{ emptyText: <Empty description="暂无任务" /> }}
      pagination={{
        position: 'bottom',
        align: 'end',
        size: 'small',
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        onChange: onPageChange,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
      }}
      dataSource={tasks}
      renderItem={(item) => (
        <List.Item
          onClick={() => setTaskId(item.id)}
          className={`task-item ${taskId === item.id ? 'active' : ''}`}
        >
          {item.name}
        </List.Item>
      )}
    />
  );
};

export default TaskList;
