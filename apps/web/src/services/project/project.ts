import { request } from '@umijs/max';

/** 脚本类型定义 */
export interface Script {
  id: number;
  name: string;
  filePath: string;
  isPublic: boolean;
  description?: string;
  projectId: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 任务类型定义 */
export interface Task {
  id: number;
  name: string;
  threadCount: number;
  status: string;
  projectId: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 项目类型定义 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

/** 创建项目参数 */
export interface CreateProjectParams {
  name: string;
  website: string;
  twitter?: string;
  description?: string;
}

/** API 响应类型 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/** 获取项目列表 */
export async function getProjects(
  params: {
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    data: Project[];
    total?: number;
    success?: boolean;
  }>('/api/projects', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取项目详情 */
export async function getProject(id: number) {
  return request<ApiResponse<Project>>(`/api/projects/${id}`, {
    method: 'GET',
  });
}

/** 创建项目 */
export async function createProject(data: { [key: string]: any }, options?: { [key: string]: any }) {
  return request<Project>('/api/projects', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 更新项目 */
export async function updateProject(
  id: string,
  data: { [key: string]: any },
  options?: { [key: string]: any },
) {
  return request<Project>(`/api/projects/${id}`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

/** 删除项目 */
export async function deleteProject(id: string, options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/api/projects/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
