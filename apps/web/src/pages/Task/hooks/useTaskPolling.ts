import { useEffect, useRef, useState } from 'react';
import { getTask } from '@/services/task/task';
import { TaskStatus } from '../data.d';
import { ActionType } from '@ant-design/pro-components';

export interface TaskPollingResult {
  taskDetail: API.TaskListItem | undefined;
  taskDetailLoading: boolean;
  polling: number | undefined;
  clearAllPolling: () => void;
  getTaskDetail: () => Promise<void>;
}

const useTaskPolling = (
  taskId: number | undefined,
  tableRef?: React.MutableRefObject<ActionType | undefined>,
  onTaskDetailChange?: (taskDetail: API.TaskListItem | undefined) => void,
): TaskPollingResult => {
  const [taskDetail, setTaskDetail] = useState<API.TaskListItem>();
  const [taskDetailLoading, setTaskDetailLoading] = useState<boolean>(false);
  const [polling, setPolling] = useState<number | undefined>(0);
  const taskPollingRef = useRef<NodeJS.Timeout | null>(null);

  // 清除所有轮询
  const clearAllPolling = () => {
    if (taskPollingRef.current) {
      clearInterval(taskPollingRef.current);
      taskPollingRef.current = null;
    }
    setPolling(0);
    // 刷新表格
    tableRef?.current?.reload();
  };

  const getTaskDetail = async () => {
    if (!taskId) return;

    setTaskDetailLoading(true);
    try {
      const res = await getTask(String(taskId));
      const newTaskDetail = res.data as unknown as API.TaskListItem;
      setTaskDetail(newTaskDetail);

      if (onTaskDetailChange) {
        onTaskDetailChange(newTaskDetail);
      }

      // 检查任务是否已完成，如果完成则取消轮询
      if (newTaskDetail && newTaskDetail.status !== TaskStatus.RUNNING) {
        clearAllPolling();
      }
    } catch (error) {
      console.error('获取任务详情失败', error);
    } finally {
      setTaskDetailLoading(false);
    }
  };

  // 设置任务详情轮询
  const setTaskPolling = () => {
    clearAllPolling();
    if (taskDetail?.status === TaskStatus.RUNNING) {
      taskPollingRef.current = setInterval(() => {
        getTaskDetail();
      }, 3000);
      setPolling(3000);
    }
  };

  // 监听任务ID变化
  useEffect(() => {
    if (taskId) {
      // 切换任务时，先清除所有轮询
      clearAllPolling();
      getTaskDetail();
    }
  }, [taskId]);

  // 监听任务状态变化，设置或取消轮询
  useEffect(() => {
    if (taskDetail?.status === TaskStatus.RUNNING) {
      setTaskPolling();
    } else {
      clearAllPolling();
    }
  }, [taskDetail?.status]);

  // 组件卸载时清除所有轮询
  useEffect(() => {
    return () => {
      clearAllPolling();
    };
  }, []);

  return {
    taskDetail,
    taskDetailLoading,
    polling,
    clearAllPolling,
    getTaskDetail,
  };
};

export default useTaskPolling;
