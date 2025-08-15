// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 钱包登录接口 POST /api/auth/wallet/login */
export async function walletLogin(body: {
  walletAddress: string;
  signature: string;
  message: string;
}, options?: { [key: string]: any }) {
  return request<{
    code: number;
    data: {
      token: string;
      user: {
        userId: number;
        walletAddress: string;
        nonce: string;
        createdAt: string;
        updatedAt: string;
      };
    };
    message: string;
  }>('/api/auth/wallet/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取钱包登录nonce POST /api/auth/nonce */
export async function getNonce(walletAddress: string, options?: { [key: string]: any }) {
  return request<{
    code: number;
    data: {
      nonce: string;
    };
    message: string;
  }>('/api/auth/nonce', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: { walletAddress },
    ...(options || {}),
  });
}
