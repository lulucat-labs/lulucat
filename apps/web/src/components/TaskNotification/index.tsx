import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Modal,
  List,
  Typography,
  notification,
  Tag,
  Empty,
  Popover,
  Divider,
  Space,
} from 'antd';
import { BellOutlined, RightOutlined } from '@ant-design/icons';
import { getMemoryTasks, getInProgressTasksCount } from '@/services/task/memory-tasks';
import type { MemoryTask } from '@/services/task/memory-tasks';
import moment from 'moment';

const { Text } = Typography;

// 使用函数声明 - 这种方式可以在声明前使用
const fetchAllTasksGlobally = async () => {
  if (globalPollingState.isPolling) {
    console.log('Already polling, skipping this request');
    return;
  }

  try {
    globalPollingState.isPolling = true;
    console.log('Global fetch: fetching tasks and counts');

    // 并行获取任务和计数
    const [tasksResponse, countResponse] = await Promise.all([
      getMemoryTasks(),
      getInProgressTasksCount(),
    ]);

    // 处理任务结果
    if ((tasksResponse.code === 0 || tasksResponse.code === 200) && tasksResponse.data) {
      console.log('Tasks retrieved:', tasksResponse.data.items);
      globalPollingState.tasks = tasksResponse.data.items;

      // 检查是否有新完成的任务
      const newCompletedTasks = tasksResponse.data.items.filter(
        (task) => task.status === 'completed' && !globalPollingState.readTaskIds.includes(task.id),
      );

      // 为新完成的任务显示通知 - 全局处理一次，避免多次通知
      newCompletedTasks.forEach((task) => {
        notification.success({
          message: `任务 ${task.name} 已完成`,
          description: `${task.message}，完成时间：${moment(task.updatedAt).format(
            'YYYY-MM-DD HH:mm:ss',
          )}`,
          duration: 5,
        });

        // 标记为已读
        markTaskAsRead(task.id);
      });
    }

    // 处理计数结果
    if ((countResponse.code === 0 || countResponse.code === 200) && countResponse.data) {
      console.log('In-progress count:', countResponse.data.count);
      globalPollingState.taskCount = countResponse.data.count;

      // 管理轮询状态
      if (countResponse.data.count === 0 && globalPollingState.intervalId) {
        console.log('No in-progress tasks, stopping global polling');
        clearInterval(globalPollingState.intervalId);
        globalPollingState.intervalId = null;
      } else if (countResponse.data.count > 0 && !globalPollingState.intervalId) {
        startGlobalPolling();
      }
    }

    // 通知所有订阅的组件更新
    globalPollingState.callbacks.forEach((callback) => callback());
  } catch (error) {
    console.error('Global fetch error:', error);
  } finally {
    globalPollingState.isPolling = false;
  }
}

// 从localStorage读取已读任务
const getReadTaskIdsFromStorage = (): string[] => {
  try {
    const savedIds = localStorage.getItem('task-notification-read');
    return savedIds ? JSON.parse(savedIds) : [];
  } catch (error) {
    console.error('Failed to parse task-notification-read from localStorage:', error);
    return [];
  }
};

// 全局状态，确保整个应用只有一个轮询实例和一份已读记录
const globalPollingState = {
  isPolling: false,
  intervalId: null as NodeJS.Timeout | null,
  taskCount: 0,
  tasks: [] as MemoryTask[],
  readTaskIds: getReadTaskIdsFromStorage(),
  callbacks: new Set<() => void>(),
};

// 将已读任务ID保存到localStorage
const saveReadTaskIds = () => {
  localStorage.setItem('task-notification-read', JSON.stringify(globalPollingState.readTaskIds));
};

// 标记任务为已读
const markTaskAsRead = (taskId: string) => {
  if (!globalPollingState.readTaskIds.includes(taskId)) {
    globalPollingState.readTaskIds.push(taskId);
    saveReadTaskIds();
  }
};

// 使用函数声明 - 这种方式可以在声明前使用
function startGlobalPolling() {
  if (globalPollingState.intervalId) {
    return;
  }

  console.log('Starting global polling every 10 seconds');
  globalPollingState.intervalId = setInterval(() => {
    console.log('Global polling triggered');
    fetchAllTasksGlobally();
  }, 10000); // 每10秒轮询一次
}

// 强制刷新任务列表的全局函数
export const refreshTaskList = () => {
  console.log('Force refreshing task list from external call');
  fetchAllTasksGlobally();
};

const TaskNotification: React.FC = () => {
  const [popoverVisible, setPopoverVisible] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [tasks, setTasks] = useState<MemoryTask[]>([]);
  const [count, setCount] = useState<number>(0);

  // 订阅全局状态变化，从而同步更新组件状态
  useEffect(() => {
    // 每当全局状态变化时更新组件状态的回调
    const updateComponentState = () => {
      setCount(globalPollingState.taskCount);
      setTasks(globalPollingState.tasks);
    };

    // 注册回调
    globalPollingState.callbacks.add(updateComponentState);

    // 组件挂载时立即获取最新数据并更新状态
    console.log('TaskNotification component mounted');
    // 确保在组件挂载后再执行第一次请求
    setTimeout(() => {
      fetchAllTasksGlobally(); // 主动获取最新数据
    }, 100);
    updateComponentState();

    // 组件卸载时清理
    return () => {
      globalPollingState.callbacks.delete(updateComponentState);
    };
  }, []);

  // 渲染任务状态标签
  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <Tag color="processing" style={{ fontSize: '11px' }}>
            进行中
          </Tag>
        );
      case 'completed':
        return (
          <Tag color="success" style={{ fontSize: '11px' }}>
            已完成
          </Tag>
        );
      case 'failed':
        return (
          <Tag color="error" style={{ fontSize: '11px' }}>
            失败
          </Tag>
        );
      default:
        return <Tag style={{ fontSize: '11px' }}>{status}</Tag>;
    }
  };

  // 手动刷新数据
  const handleRefresh = () => {
    fetchAllTasksGlobally();
  };

  // 获取进行中的任务
  const getInProgressTasks = () => {
    return tasks.filter((task) => task.status === 'in_progress');
  };

  // 渲染Popover内容
  const renderPopoverContent = () => {
    const inProgressTasks = getInProgressTasks();

    return (
      <div style={{ width: 250 }}>
        <div
          style={{
            fontWeight: 'bold',
            marginBottom: 8,
            fontSize: '13px',
            color: 'rgba(0, 0, 0, 0.65)',
          }}
        >
          进行中的任务
        </div>
        <List
          size="small"
          dataSource={inProgressTasks}
          renderItem={(task) => (
            <List.Item key={task.id} style={{ padding: '4px 0' }}>
              <div
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '12px',
                  color: 'rgba(0, 0, 0, 0.65)',
                }}
              >
                {task.name}
              </div>
              {renderStatusTag(task.status)}
            </List.Item>
          )}
          locale={{ emptyText: <Empty description="暂无进行中任务" imageStyle={{ height: 30 }} /> }}
          style={{ maxHeight: 120, overflow: 'auto' }}
        />
        <Divider style={{ margin: '4px 0' }} />
        <div style={{ textAlign: 'center' }}>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setPopoverVisible(false);
              setModalVisible(true);
            }}
            style={{ fontSize: '12px', padding: '0px', color: 'rgba(0, 0, 0, 0.45)' }}
          >
            查看更多 <RightOutlined />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Popover
        content={renderPopoverContent()}
        title={null}
        trigger="click"
        open={popoverVisible}
        onOpenChange={setPopoverVisible}
        placement="bottomRight"
        arrow={true}
      >
        <Badge count={count} size="small" style={{ fontSize: '10px' }} offset={[-10, 10]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: '16px', color: 'rgba(0, 0, 0, 0.65)' }} />}
            onClick={() => {
              handleRefresh();
            }}
            style={{
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
            }}
          />
        </Badge>
      </Popover>

      <Modal
        title={<div style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>任务通知</div>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        destroyOnClose
      >
        <List
          size="small"
          dataSource={tasks}
          renderItem={(task) => (
            <List.Item
              key={task.id}
              extra={renderStatusTag(task.status)}
              style={{ padding: '8px 0' }}
            >
              <List.Item.Meta
                title={
                  <div style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.65)' }}>{task.name}</div>
                }
                description={
                  <Space direction="vertical" style={{ width: '100%', fontSize: '12px' }} size={1}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      更新时间: {moment(task.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                    <Text style={{ color: 'rgba(0, 0, 0, 0.55)', fontSize: '12px' }}>
                      {task.message}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: <Empty description="暂无任务" /> }}
        />
      </Modal>
    </>
  );
};

export default TaskNotification;
