import { request } from '@umijs/max';
import type { Task as TaskType, TaskFormData } from '@/pages/Task/data';

/** 任务类型定义 */
export interface Task {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  projectId: string;
  scriptId: string;
  threadCount: number;
  browserContextIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** 获取任务列表 GET /api/tasks */
export async function getTaskList(
  params: {
    current?: number;
    pageSize?: number;
    status?: string;
  } & Partial<Task>,
) {
  // API响应结构: { code: number, data: { data: Task[], total: number, current: number, pageSize: number }, message: string }
  return request<{
    code: number;
    data: {
      data: TaskType[];
      total: number;
      current: number;
      pageSize: number;
    };
    message: string;
  }>('/api/tasks', {
    method: 'GET',
    params: {
      ...params,
    },
  }).then(res => {
    // 返回内层data对象(分页数据)
    return res.data;
  });
}

/** 获取任务详情 GET /api/tasks/:id */
export async function getTask(id: string) {
  return request<{ data: Task }>(`/api/tasks/${id}`, {
    method: 'GET',
  });
}

/** 创建任务 POST /api/tasks */
export async function createTask(data: TaskFormData) {
  return request<API.Response<Task>>('/api/tasks', {
    method: 'POST',
    data,
  });
}

/** 更新任务配置 PUT /api/tasks/:id */
export async function updateTask(id: number, data: TaskFormData): Promise<API.Response<Task>>;
export async function updateTask(id: number, data: Partial<TaskFormData>): Promise<API.Response<Task>>;
export async function updateTask(id: number, data: Partial<TaskFormData>): Promise<API.Response<Task>> {
  return request<API.Response<Task>>(`/api/tasks/${id}`, {
    method: 'PATCH',
    data,
  });
}

/** 删除任务 DELETE /api/tasks/${id} */
export async function deleteTask(id: number) {
  return request<API.Response<any>>(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}

/** 更新任务状态 PUT /api/tasks/${id}/status */
export async function updateTaskStatus(id: number, status: string) {
  return request<API.Response<Task>>(`/api/tasks/${id}/status`, {
    method: 'PUT',
    data: { status },
  });
}

/** 启动任务 */
export async function startTask(id: number, data: any) {
  return request<API.Response<any>>(`/api/tasks/${id}/start`, {
    method: 'POST',
    data
  });
}

/** 停止任务 */
export async function stopTask(id: number) {
  return request<API.Response<any>>(`/api/tasks/${id}/stop`, {
    method: 'POST',
  });
}
