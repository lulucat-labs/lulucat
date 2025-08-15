import { request } from '@umijs/max';

/** Twitter账户类型定义 */
export interface TwitterAccount {
  twitterId: number;
  userId: number;
  username: string;
  password: string;
  twoFactorAuth?: string;
  recoveryEmail?: string;
  recoveryEmailPassword?: string;
  token?: string;
  createdAt: string;
  updatedAt: string;
}

/** 获取Twitter账户列表 GET /api/twitter-accounts */
export async function getTwitterAccounts(
  params: {
    page?: number;
    pageSize?: number;
    username?: string;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    data: {
      items: TwitterAccount[];
      total: number;
    };
    message: string;
  }>('/api/twitter-accounts', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取Twitter账户详情 GET /api/twitter-accounts/:id */
export async function getTwitterAccount(twitterId: number) {
  return request<TwitterAccount>(`/api/twitter-accounts/${twitterId}`, {
    method: 'GET',
  });
}

/** 创建Twitter账户 POST /api/twitter-accounts */
export async function createTwitterAccount(
  data: Partial<TwitterAccount>,
  options?: { [key: string]: any },
) {
  return request<TwitterAccount>('/api/twitter-accounts', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 更新Twitter账户 PUT /api/twitter-accounts/:id */
export async function updateTwitterAccount(
  twitterId: number,
  data: Partial<TwitterAccount>,
  options?: { [key: string]: any },
) {
  return request<TwitterAccount>(`/api/twitter-accounts/${twitterId}`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

/** 删除Twitter账户 DELETE /api/twitter-accounts/:id */
export async function deleteTwitterAccount(twitterId: number, options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/api/twitter-accounts/${twitterId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 检查Twitter账户 POST /api/twitter-accounts/:id/check */
export async function checkTwitterAccount(twitterId: number, options?: { [key: string]: any }) {
  return request<TwitterAccount>(`/api/twitter-accounts/${twitterId}/check`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** 导入Twitter账户 POST /api/twitter-accounts/import */
export async function importTwitterAccounts(formData: FormData, options?: { [key: string]: any }) {
  return request<{
    code: number;
    data: {
      success?: number;
      total?: number;
      errors?: string[];
      taskId?: string;
    };
    message: string;
  }>('/api/twitter-accounts/import', {
    method: 'POST',
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}

/** 批量删除Twitter账户 DELETE /api/twitter-accounts */
export async function deleteTwitterAccounts(ids: number[], options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/twitter-accounts', {
    method: 'DELETE',
    data: { ids },
    ...(options || {}),
  });
}
