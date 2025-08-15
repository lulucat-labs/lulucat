import { request } from '@umijs/max';

/** 脚本类型定义 */
export interface Script {
  id: string;
  name: string;
  description?: string;
  content: string;
  isPublic: boolean;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

/** 获取脚本列表 GET /api/scripts */
export async function getScripts(
  params: {
    current?: number;
    pageSize?: number;
    projectId?: string;
    isPublic?: boolean;
  },
  options?: { [key: string]: any },
) {
  return request<{
    data: Script[];
    total?: number;
    success?: boolean;
  }>('/api/scripts', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取脚本详情 GET /api/scripts/:id */
export async function getScript(id: string) {
  return request<Script>(`/api/scripts/${id}`, {
    method: 'GET',
  });
}

/** 创建脚本 POST /api/scripts */
export async function createScript(data: { [key: string]: any }, options?: { [key: string]: any }) {
  return request<Script>('/api/scripts', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 更新脚本 PUT /api/scripts/:id */
export async function updateScript(
  id: string,
  data: { [key: string]: any },
  options?: { [key: string]: any },
) {
  return request<Script>(`/api/scripts/${id}`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

/** 删除脚本 DELETE /api/scripts/:id */
export async function deleteScript(id: string, options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/api/scripts/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
