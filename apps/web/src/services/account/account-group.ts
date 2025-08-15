import { request } from '@umijs/max';
import type {
  AccountGroupFormData,
  CreateAccountGroupByRangeDto,
  CreateQuickAccountGroupDto,
} from '@/pages/AccountGroup/data';

export interface AccountGroupItem {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: {
    id: number;
    accountGroupId: number;
    discordAccountId: number | null;
    emailAccountId: number | null;
    evmWalletId: number | null;
    twitterAccountId: number | null;
    proxyIpId: number | null;
    browserFingerprintId: number | null;
    createdAt: string;
    updatedAt: string;
  }[];
}

/** 获取账号组列表 */
export async function getAccountGroupList(params: { current?: number; pageSize?: number }) {
  return request<
    API.Response<{
      items: AccountGroupItem[];
      total: number;
    }>
  >('/api/account-groups', {
    method: 'GET',
    params,
  });
}

/** 创建账号组 */
export async function createAccountGroup(data: AccountGroupFormData) {
  return request<API.Response<AccountGroupItem>>('/api/account-groups', {
    method: 'POST',
    data,
  });
}

/** 更新账号组 */
export async function updateAccountGroup(id: number, data: AccountGroupFormData) {
  return request<API.Response<AccountGroupItem>>(`/api/account-groups/${id}`, {
    method: 'PATCH',
    data,
  });
}

/** 通过范围创建账号组 */
export async function createAccountGroupByRange(data: CreateAccountGroupByRangeDto) {
  return request<API.Response<AccountGroupItem>>('/api/account-groups/range', {
    method: 'POST',
    data,
  });
}

/** 通过范围更新账号组 */
export async function updateAccountGroupByRange(id: number, data: CreateAccountGroupByRangeDto) {
  return request<API.Response<AccountGroupItem>>(`/api/account-groups/${id}/range`, {
    method: 'PATCH',
    data,
  });
}

/** 快速创建账号组 */
export async function createQuickAccountGroup(data: CreateQuickAccountGroupDto) {
  return request<API.Response<AccountGroupItem>>('/api/account-groups/quick', {
    method: 'POST',
    data,
  });
}

/** 获取单个账号组及其关联项的详细信息，并关联任务日志 */
export async function getAccountGroup(
  id: number,
  data: { page?: number; pageSize?: number; taskId: number; status?: string; errorCode?: string },
) {
  return request<API.Response<AccountGroupItem>>(`/api/account-groups/${id}/task-logs`, {
    method: 'GET',
    params: data,
  });
}

/** 删除账号组 */
export async function deleteAccountGroup(id: number) {
  return request<API.Response<void>>(`/api/account-groups/${id}`, {
    method: 'DELETE',
  });
}

/** 更新账号项状态 */
export async function updateAccountItemsStatus(data: {
  accountItemIds: number[];
  accountTypes: string[];
  status: string;
}) {
  return request<API.Response<any>>('/api/account-groups/items/status', {
    method: 'PATCH',
    data,
  });
}

/** 获取账号组关联的账号项列表 */
export async function getAccountGroupItems(
  id: number,
  params: { page?: number; pageSize?: number; accountType?: string; accountStatus?: string; }
) {
  return request<
    API.Response<{
      items: {
        id: number;
        accountGroupId: number;
        discordAccountId: number | null;
        emailAccountId: number | null;
        evmWalletId: number | null;
        twitterAccountId: number | null;
        proxyIpId: number | null;
        browserFingerprintId: number | null;
        discordAccount?: { id: number; username: string; status?: string };
        emailAccount?: { id: number; emailAddress: string; status?: string };
        evmWallet?: { id: number; walletAddress: string; status?: string };
        twitterAccount?: { id: number; username: string; status?: string };
        proxyIp?: { id: number; ipAddress: string; status?: string };
        browserFingerprint?: { id: number; userAgent: string; status?: string };
        createdAt: string;
        updatedAt: string;
      }[];
      total: number;
      page: number;
      pageSize: number;
    }>
  >(`/api/account-groups/${id}/items`, {
    method: 'GET',
    params,
  });
}

/** 批量替换账号项的账号资源 */
export async function replaceAccountItemsResource(data: {
  accountItemIds: number[];
  accountType: string;
  excludeAssociated: boolean;
  excludeInvalid: boolean;
}) {
  return request<
    API.Response<{
      total: number;
      success: number;
      failed: number;
    }>
  >('/api/account-groups/items/replace-resource', {
    method: 'PATCH',
    data,
  });
}

/** 全量更换账号组下所有账号项关联的账号资源 */
export async function replaceAllAccountItemsResource(data: {
  accountGroupId: number;
  accountType: string;
  excludeAssociated: boolean;
  excludeInvalid: boolean;
}) {
  return request<
    API.Response<{
      total: number;
      success: number;
      failed: number;
    }>
  >('/api/account-groups/items/replace-all-resource', {
    method: 'PATCH',
    data,
  });
}
