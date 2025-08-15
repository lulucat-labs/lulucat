import { request } from '@umijs/max';

/** EVM钱包类型定义 */
export interface EvmWallet {
  walletId: number;
  userId: number;
  walletAddress: string;
  privateKey: string;
  balance?: string;
  createdAt: string;
  updatedAt: string;
}

/** 获取EVM钱包列表 GET /api/evm-wallets */
export async function getEvmWallets(
  params: {
    current?: number;
    pageSize?: number;
    skip?: number;
    take?: number;
    walletAddress?: string;
    minBalance?: number;
    maxBalance?: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    data: {
      items: EvmWallet[];
      total: number;
    };
    message: string;
  }>('/api/evm-wallets', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取EVM钱包详情 GET /api/evm-wallets/:id */
export async function getEvmWallet(walletId: number) {
  return request<EvmWallet>(`/api/evm-wallets/${walletId}`, {
    method: 'GET',
  });
}

/** 创建EVM钱包 POST /api/evm-wallets */
export async function createEvmWallet(data: Partial<EvmWallet>, options?: { [key: string]: any }) {
  return request<EvmWallet>('/api/evm-wallets', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 更新EVM钱包 PUT /api/evm-wallets/:id */
export async function updateEvmWallet(
  walletId: number,
  data: Partial<EvmWallet>,
  options?: { [key: string]: any },
) {
  return request<EvmWallet>(`/api/evm-wallets/${walletId}`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

/** 删除EVM钱包 DELETE /api/evm-wallets/:id */
export async function deleteEvmWallet(walletId: number, options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/api/evm-wallets/${walletId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 检查EVM钱包余额 POST /api/evm-wallets/:id/check */
export async function checkEvmWallet(walletId: number, options?: { [key: string]: any }) {
  return request<EvmWallet>(`/api/evm-wallets/${walletId}/check`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** 生成 EVM 钱包 */
export async function generateEvmWallets(count: number) {
  return request<{
    code: number;
    data: EvmWallet[];
    message: string;
  }>('/api/evm-wallets/generate', {
    method: 'POST',
    data: { count },
  });
}

/**
 * 更新单个钱包余额
 * POST /api/evm-wallets/:id/update-balance
 */
export async function updateWalletBalance(walletId: number) {
  return request<EvmWallet>(`/api/evm-wallets/${walletId}/update-balance`, {
    method: 'POST',
  });
}

/**
 * 批量更新钱包余额（异步）
 * POST /api/evm-wallets/batch-update-balance
 */
export async function batchUpdateWalletBalances() {
  return request<{ message: string }>('/api/evm-wallets/batch-update-balance', {
    method: 'POST',
  });
}
