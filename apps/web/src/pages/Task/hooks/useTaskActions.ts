import { useState } from 'react';
import { message } from 'antd';
import { deleteTask, startTask, stopTask } from '@/services/task/task';
import { TaskStatus } from '../data.d';

export interface UseTaskActionsResult {
  taskActionLoading: boolean;
  handleDelete: () => Promise<boolean>;
  handleStatusChange: (useSelectedRows?: boolean) => Promise<boolean | undefined>;
}

const useTaskActions = (
  taskId: number | undefined,
  taskDetail: API.TaskListItem | undefined,
  headless: boolean,
  selectedRows: any[],
  selectedRowKeys: React.Key[],
  onTaskActionComplete: () => void,
): UseTaskActionsResult => {
  const [taskActionLoading, setTaskActionLoading] = useState<boolean>(false);

  const handleDelete = async (): Promise<boolean> => {
    if (!taskId) return false;

    const hide = message.loading('正在删除');
    try {
      await deleteTask(taskId);
      hide();
      message.success('删除成功');
      onTaskActionComplete();
      return true;
    } catch (error) {
      hide();
      message.error('删除失败，请重试');
      return false;
    }
  };

  const handleStatusChange = async (useSelectedRows = false): Promise<boolean | undefined> => {
    if (taskActionLoading || !taskId) return; // 防止重复点击

    setTaskActionLoading(true);
    const hide = message.loading(
      taskDetail?.status === TaskStatus.RUNNING ? '正在停止' : '正在启动',
    );
    try {
      if (taskDetail?.status === TaskStatus.RUNNING) {
        await stopTask(taskId);
      } else {
        // 如果是启动选中的账号
        if (useSelectedRows && selectedRowKeys.length > 0) {
          await startTask(taskId, {
            accountGroupItemIds: selectedRows.map((row) => row.id),
            headless,
          });
        } else {
          await startTask(taskId, {
            headless,
          });
        }
      }
      hide();
      message.success(taskDetail?.status === TaskStatus.RUNNING ? '停止成功' : '启动成功');
      onTaskActionComplete();
      return true;
    } catch (error) {
      hide();
      message.error(taskDetail?.status === TaskStatus.RUNNING ? '停止失败' : '启动失败');
      return false;
    } finally {
      setTaskActionLoading(false);
    }
  };

  return {
    taskActionLoading,
    handleDelete,
    handleStatusChange,
  };
};

export default useTaskActions;
