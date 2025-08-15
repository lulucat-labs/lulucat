import { request } from '@umijs/max';

/** 邮箱账户类型定义 */
export interface EmailAccount {
  emailId: number;
  userId: number;
  emailAddress: string;
  emailPassword: string;
  verificationEmail?: string;
  createdAt: string;
  updatedAt: string;
}

/** 获取邮箱账户列表 GET /api/email-accounts */
export async function getEmailAccounts(
  params: {
    page?: number;
    pageSize?: number;
    emailAddress?: string;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    data: {
      items: EmailAccount[];
      total: number;
    };
    message: string;
  }>('/api/email-accounts', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取邮箱账户详情 GET /api/email-accounts/:id */
export async function getEmailAccount(emailId: number) {
  return request<EmailAccount>(`/api/email-accounts/${emailId}`, {
    method: 'GET',
  });
}

/** 创建邮箱账户 POST /api/email-accounts */
export async function createEmailAccount(
  data: Partial<EmailAccount>,
  options?: { [key: string]: any },
) {
  return request<EmailAccount>('/api/email-accounts', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 更新邮箱账户 PUT /api/email-accounts/:id */
export async function updateEmailAccount(
  emailId: number,
  data: Partial<EmailAccount>,
  options?: { [key: string]: any },
) {
  return request<EmailAccount>(`/api/email-accounts/${emailId}`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

/** 删除邮箱账户 DELETE /api/email-accounts/:id */
export async function deleteEmailAccount(emailId: number, options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/api/email-accounts/${emailId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 检查邮箱账户 POST /api/email-accounts/:id/check */
export async function checkEmailAccount(emailId: number, options?: { [key: string]: any }) {
  return request<EmailAccount>(`/api/email-accounts/${emailId}/check`, {
    method: 'POST',
    ...(options || {}),
  });
}

/**
 * 检测邮箱刷新令牌有效性
 * @param ids 邮箱ID列表，为空时检测所有邮箱
 */
export async function checkRefreshTokens(ids?: number[]) {
  return request<API.ApiResponse<{
    total: number;
    success: number;
    failed: number;
    results: {
      emailId: number;
      emailAddress: string;
      serviceType: string;
      valid: boolean;
      errorMessage?: string;
    }[];
  }>>('/api/email-accounts/check-refresh-tokens', {
    method: 'POST',
    data: { ids },
  });
}

/**
 * 导出邮箱账户
 * @param ids 邮箱ID列表，为空时导出所有邮箱
 */
export async function exportEmailAccounts(ids?: number[]) {
  return request<API.ApiResponse<{
    filename: string;
    content: string;
  }>>('/api/email-accounts/export', {
    method: 'POST',
    data: { ids },
  });
}

/**
 * 导出无效邮箱账户
 * @param ids 邮箱ID列表，为空时导出所有邮箱
 */
export async function exportInvalidEmailAccounts() {
  return request<API.ApiResponse<{
    filename: string;
    content: string;
  }>>('/api/email-accounts/export-invalid', {
    method: 'POST',
  });
}