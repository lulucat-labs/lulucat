import { request } from '@umijs/max';
import type { BrowserFingerprintFormData } from '@/pages/BrowserFingerprint/data';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

/** 获取浏览器指纹列表 GET /api/browser-fingerprints */
export async function getBrowserFingerprintList(params: {
  page?: number;
  pageSize?: number;
  browserType?: string;
  deviceName?: string;
  webglRenderer?: string;
  webglVendor?: string;
  macAddress?: string;
  cpuCores?: number;
  deviceMemory?: number;
  createdAtRange?: [string, string];
}) {
  return request<API.Response<PaginatedResponse<BrowserFingerprint>>>('/api/browser-fingerprints', {
    method: 'GET',
    params,
  });
}

/** 创建浏览器指纹 POST /api/browser-fingerprints */
export async function createBrowserFingerprint(data: BrowserFingerprintFormData) {
  return request<API.Response<API.BrowserFingerprintListItem>>('/api/browser-fingerprints', {
    method: 'POST',
    data,
  });
}

/** 更新浏览器指纹 PUT /api/browser-fingerprints/${id} */
export async function updateBrowserFingerprint(
  id: number, 
  data: BrowserFingerprintFormData | Partial<BrowserFingerprint>
) {
  return request<API.Response<API.BrowserFingerprintListItem>>(`/api/browser-fingerprints/${id}`, {
    method: 'PUT',
    data,
  });
}

/** 删除浏览器指纹 DELETE /api/browser-fingerprints/${id} */
export async function deleteBrowserFingerprint(id: number) {
  return request<API.Response<any>>(`/api/browser-fingerprints/${id}`, {
    method: 'DELETE',
  });
}

export async function generateBrowserFingerprints(params: { count: number }) {
  return request<API.ResponseList<API.BrowserFingerprintListItem>>(
    '/api/browser-fingerprints/generate',
    {
      method: 'POST',
      data: params,
    },
  );
}

/** 浏览器指纹类型定义 */
export interface BrowserFingerprint {
  id: number;
  userAgent: string;
  webglVendor: string;
  webglRenderer: string;
  deviceName: string;
  macAddress: string;
  cpuCores: number;
  deviceMemory: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 查询浏览器指纹列表 */
export async function queryBrowserFingerprints(params: {
  current?: number;
  pageSize?: number;
  deviceName?: string;
  browserType?: string;
}) {
  return request<API.Response<BrowserFingerprint[]>>('/api/browser-fingerprints', {
    method: 'GET',
    params,
  });
}
