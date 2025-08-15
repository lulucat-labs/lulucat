import { request } from '@umijs/max';

/** 代理IP类型定义 */
export interface ProxyIp {
  proxyId: number;
  userId: number;
  ipAddress: string;
  port: number;
  username?: string;
  password?: string;
  proxyType: 'http' | 'socks5';
  isActive: boolean;
  location?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  org?: string;
  postal?: string;
  timezone?: string;
  ipInfoUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  hasAccountGroup?: boolean;
}

/** 获取代理IP列表 GET /api/proxy-ips */
export async function getProxyIps(params: {
  ipAddress?: string;
  proxyType?: string;
  location?: string;
  isActive?: boolean;
  hasAccountGroup?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return request<{
    data: {
      items: ProxyIp[];
      total: number;
    };
    code: number;
  }>('/api/proxy-ips', {
    method: 'GET',
    params: {
      ...params,
    },
  });
}

/** 获取代理IP详情 GET /api/proxy-ips/:id */
export async function getProxyIp(proxyId: number) {
  return request<ProxyIp>(`/api/proxy-ips/${proxyId}`, {
    method: 'GET',
  });
}

/** 创建代理IP POST /api/proxy-ips */
export async function createProxyIp(data: Partial<ProxyIp>, options?: { [key: string]: any }) {
  return request<ProxyIp>('/api/proxy-ips', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 更新代理IP PUT /api/proxy-ips/:id */
export async function updateProxyIp(
  proxyId: number,
  data: Partial<ProxyIp>,
  options?: { [key: string]: any },
) {
  return request<ProxyIp>(`/api/proxy-ips/${proxyId}`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

/** 删除代理IP DELETE /api/proxy-ips/:id */
export async function deleteProxyIp(proxyId: number) {
  return request<{
    data: any;
    code: number;
  }>(`/api/proxy-ips/${proxyId}`, {
    method: 'DELETE',
  });
}

/** 批量删除代理IP DELETE /api/proxy-ips */
export async function batchDeleteProxyIps(ids: number[]) {
  return request<{
    data: any;
    code: number;
  }>('/api/proxy-ips', {
    method: 'DELETE',
    data: { ids },
  });
}

/** 检查代理IP POST /api/proxy-ips/:id/check */
export async function checkProxyIp(proxyId: number, options?: { [key: string]: any }) {
  return request<ProxyIp>(`/api/proxy-ips/${proxyId}/check`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** 导入代理IP */
export async function importProxyIps(formData: FormData) {
  return request<{
    data: { taskId: string };
    code: number;
  }>('/api/proxy-ips/import', {
    method: 'POST',
    data: formData,
    requestType: 'form',
  });
}

/**
 * 更新代理IP的详细信息
 */
export async function updateProxyIpsInfo(params?: { proxyIds?: number[] }) {
  return request<{
    data: { taskId: string };
    code: number;
  }>('/api/proxy-ips/update-ip-info', {
    method: 'POST',
    data: params,
  });
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

/** 查询代理IP列表 */
export async function queryProxyIps(params: {
  current?: number;
  pageSize?: number;
  ipAddress?: string;
  proxyType?: string;
  location?: string;
}) {
  return request<API.Response<PaginatedResponse<ProxyIp>>>('/api/proxy-ips', {
    method: 'GET',
    params,
  });
}
