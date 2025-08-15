import { request } from '@umijs/max';

/** Discord账户类型定义 */
export interface DiscordAccount {
  discordId: number;
  userId: number;
  username: string;
  emailPassword?: string;
  password: string;
  token?: string;
  createdAt: string;
  updatedAt: string;
}

/** 获取Discord账户列表 GET /api/discord-accounts */
export async function getDiscordAccounts(
  params: {
    current?: number;
    pageSize?: number;
    username?: string;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    data: {
      items: DiscordAccount[];
      total: number;
    };
    message: string;
  }>('/api/discord-accounts', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取Discord账户详情 GET /api/discord-accounts/:id */
export async function getDiscordAccount(discordId: number) {
  return request<DiscordAccount>(`/api/discord-accounts/${discordId}`, {
    method: 'GET',
  });
}

/** 创建Discord账户 POST /api/discord-accounts */
export async function createDiscordAccount(data: Partial<DiscordAccount>, options?: { [key: string]: any }) {
  return request<DiscordAccount>('/api/discord-accounts', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 更新Discord账户 PUT /api/discord-accounts/:id */
export async function updateDiscordAccount(
  discordId: number,
  data: Partial<DiscordAccount>,
  options?: { [key: string]: any },
) {
  return request<DiscordAccount>(`/api/discord-accounts/${discordId}`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

/** 删除Discord账户 DELETE /api/discord-accounts/:id */
export async function deleteDiscordAccount(discordId: number, options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/api/discord-accounts/${discordId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 检查Discord账户 POST /api/discord-accounts/:id/check */
export async function checkDiscordAccount(discordId: number, options?: { [key: string]: any }) {
  return request<DiscordAccount>(`/api/discord-accounts/${discordId}/check`, {
    method: 'POST',
    ...(options || {}),
  });
}
