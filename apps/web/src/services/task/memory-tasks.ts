import { request } from '@umijs/max';

/** 内存任务类型定义 */
export interface MemoryTask {
  id: string;
  name: string;
  status: 'in_progress' | 'failed' | 'completed';
  message: string;
  result: string;
  createdAt: string;
  updatedAt: string;
}

/** 获取内存任务列表 GET /api/memory-tasks */
export async function getMemoryTasks(params?: { status?: string }) {
  return request<{
    data: {
      items: MemoryTask[];
      total: number;
    };
    code: number;
  }>('/api/memory-tasks', {
    method: 'GET',
    params: params,
  });
}

/** 获取单个内存任务 GET /api/memory-tasks/:id */
export async function getMemoryTask(id: string) {
  return request<{
    data: MemoryTask;
    code: number;
  }>(`/api/memory-tasks/${id}`, {
    method: 'GET',
  });
}

/** 获取进行中的任务数量 */
export async function getInProgressTasksCount() {
  return request<{
    data: { count: number };
    code: number;
  }>('/api/memory-tasks/count/by-status', {
    method: 'GET',
    params: {
      status: 'in_progress',
    },
  });
} 