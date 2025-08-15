import { TaskStatus } from '../../tasks/entities/task.entity';
import { EvmWallet } from '../../evm-wallets/entities/evm-wallet.entity';
import { TwitterAccount } from '../../twitter-accounts/entities/twitter-account.entity';
import { DiscordAccount } from '../../discord-accounts/entities/discord-account.entity';
import { EmailAccount } from '../../email-accounts/entities/email-account.entity';

/**
 * 浏览器上下文配置
 */
export interface BrowserContextConfig {
  viewport?: {
    width: number;
    height: number;
  };
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  storageState?: string;
  fingerprint?: Record<string, unknown>;
}

/**
 * 账号详细信息
 */
export interface AccountDetails {
  id: number;
  discordAccount?: DiscordAccount;
  emailAccount?: EmailAccount;
  evmWallet?: EvmWallet;
  twitterAccount?: TwitterAccount;
  proxyIpId?: number;
  browserFingerprintId?: number;
  [key: string]: any;
}

/**
 * 任务配置
 */
export interface TaskConfig {
  threadCount: number;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  [key: string]: unknown;
}

/**
 * 账号任务执行上下文
 */
export interface AccountTaskContext {
  id: string;
  projectId: number;
  accountGroupId: number;
  accountGroupItemId: number;
  taskId: number;
  scriptPaths: string[];
  config: TaskConfig;
  accountDetail: AccountDetails;
  userId: number;
  parentTaskId?: number;
  browserContextConfig?: BrowserContextConfig;
}

/**
 * 任务执行结果
 */
export interface TaskExecutionResult {
  success: boolean;
  error?: string;
  data?: {
    browserContextState?: BrowserContextConfig;
    [key: string]: unknown;
  };
}

/**
 * 账号执行结果
 */
export interface AccountExecutionResult extends TaskExecutionResult {
  accountGroupItemId: number;
}

/**
 * 任务进度
 */
export interface TaskProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  status: TaskStatus;
  startTime: Date;
  endTime?: Date;
}

/**
 * 任务队列作业数据
 */
export interface TaskQueueJob {
  id: string;
  taskId: number;
  context: AccountTaskContext;
}
