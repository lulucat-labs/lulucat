import { request } from '@umijs/max';

/** 浏览器上下文类型定义 */
export interface BrowserContext {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  userDataDir: string;
  proxyId?: string;
  createdAt: string;
  updatedAt: string;
}

/** 获取浏览器上下文列表 GET /api/browser-contexts */
export async function getBrowserContexts(
  params: {
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    data: BrowserContext[];
    total?: number;
    success?: boolean;
  }>('/api/browser-contexts', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 新建浏览器上下文 POST /api/browser-contexts */
export async function createBrowserContext(data: { [key: string]: any }, options?: { [key: string]: any }) {
  return request<BrowserContext>('/api/browser-contexts', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 更新浏览器上下文 PUT /api/browser-contexts/:id */
export async function updateBrowserContext(
  id: string,
  data: { [key: string]: any },
  options?: { [key: string]: any },
) {
  return request<BrowserContext>(`/api/browser-contexts/${id}`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

/** 删除浏览器上下文 DELETE /api/browser-contexts/:id */
export async function deleteBrowserContext(id: string, options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/api/browser-contexts/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
