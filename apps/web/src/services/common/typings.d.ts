// @ts-ignore
/* eslint-disable */

declare namespace API {
  type CurrentUser = {
    name?: string;
    avatar?: string;
    userid?: string;
    email?: string;
    signature?: string;
    title?: string;
    group?: string;
    tags?: { key?: string; label?: string }[];
    notifyCount?: number;
    unreadCount?: number;
    country?: string;
    access?: string;
    geographic?: {
      province?: { label?: string; key?: string };
      city?: { label?: string; key?: string };
    };
    address?: string;
    phone?: string;
  };

  type LoginResult = {
    status?: string;
    type?: string;
    currentAuthority?: string;
  };

  interface Response<T = any> {
    code: number;
    data: T;
    message: string;
    success: boolean;
  }

  interface ResponseList<T = any> {
    code: number;
    data: {
      list: T[];
      total: number;
      current: number;
      pageSize: number;
    };
    message: string;
    success: boolean;
  }

  interface TaskListItem {
    id: number;
    name: string;
    threadCount: number;
    status: string;
    projectId: number;
    project?: {
      id: number;
      name: string;
    };
    accountGroups?: {
      id: number;
      name: string;
    }[];
    scripts?: {
      id: number;
      name: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
  }

  interface BrowserFingerprintListItem {
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
    // These fields are for search only, not actual fields in the entity
    browserType?: string;
    createdAtRange?: [string, string];
  }

  interface AccountGroupListItem {
    id: number;
    name: string;
    description: string;
    accountCount: number;
    createdAt: Date;
    updatedAt: Date;
  }

  type ApiResponse<T = any> = {
    code: number;
    data: T;
    message: string;
  };
}
