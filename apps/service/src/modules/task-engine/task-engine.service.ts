import { Inject, Injectable, Logger } from '@nestjs/common';
import { AccountTaskContext } from './types';
import { TaskQueueService } from './queues/task-queue.service';
import { TasksService } from '../tasks/tasks.service';
import { TaskStatus } from '../tasks/entities/task.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProxyIp } from '../proxy-ips/entities/proxy-ip.entity';
import { BrowserFingerprint } from '../browser-fingerprints/entities/browser-fingerprint.entity';

@Injectable()
export class TaskEngineService {
  @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger;

  constructor(
    private readonly taskQueueService: TaskQueueService,
    private readonly tasksService: TasksService,
    @InjectRepository(ProxyIp)
    private readonly proxyIpRepository: Repository<ProxyIp>,
    @InjectRepository(BrowserFingerprint)
    private readonly browserFingerprintRepository: Repository<BrowserFingerprint>,
  ) {}

  /**
   * 启动任务
   * @param taskId 任务ID
   * @param userId 用户ID
   * @param accountGroupItemIds 可选，指定要启动的账号组项ID列表
   */
  async startTask(
    taskId: number,
    userId: number,
    accountGroupItemIds?: number[],
    headless?: boolean,
  ): Promise<void> {
    try {
      const task = await this.tasksService.findOne(taskId, userId);

      if (task.status === TaskStatus.RUNNING) {
        this.logger.debug(`任务 ${taskId} 已经在运行中`);
        return;
      }

      this.logger.debug(`正在启动任务 ${taskId} (用户ID: ${userId})`);

      // 获取任务的脚本路径
      const scriptPaths = task.scripts.map((script) => script.filePath);

      // 收集所有需要添加的任务上下文
      const taskContexts: AccountTaskContext[] = [];

      // 为每个账号组的每个账号项创建任务
      for (const accountGroup of task.accountGroups) {
        try {
          // 获取账号组详细信息，包括关联的账号数据
          const accountGroupWithDetails =
            await this.tasksService.getAccountGroupWithDetails(
              accountGroup.id,
              userId,
            );

          // 如果指定了账号组项ID列表，则先筛选出需要处理的账号组项
          let itemsToProcess = accountGroupWithDetails.items;
          if (accountGroupItemIds && accountGroupItemIds.length > 0) {
            itemsToProcess = itemsToProcess.filter((item) =>
              accountGroupItemIds.includes(item.id),
            );
          }

          this.logger.debug(`准备处理 ${itemsToProcess.length} 个账号组项数据`);

          // 只准备需要处理的账号详细信息，使用明文数据
          const accountDetails = this.prepareAccountDetails(itemsToProcess);

          // 为每个账号项创建单独的任务上下文
          for (const accountDetail of accountDetails) {
            try {
              const accountContext = this.createAccountTaskContext(
                task,
                accountGroup.id,
                accountDetail.id,
                scriptPaths,
                accountDetail,
                userId,
                headless,
              );

              taskContexts.push(accountContext);
            } catch (accountError) {
              this.logger.error(
                `处理账号项 ${accountDetail.id} 出错: ${accountError.message}`,
              );
            }
          }
        } catch (groupError) {
          this.logger.error(
            `处理账号组 ${accountGroup.id} 出错: ${groupError.message}`,
          );
        }
      }

      // 如果没有任何任务需要添加
      if (taskContexts.length === 0) {
        this.logger.debug(
          `任务 ${taskId} 未找到任何账号或所有账号处理都出错，标记任务为停止`,
        );
        await this.tasksService.updateStatus(
          taskId,
          TaskStatus.STOPPED,
          userId,
        );
        return;
      }

      this.logger.debug(
        `任务数据准备完成，开始添加任务到用户 ${userId} 的队列 (共 ${taskContexts.length} 个任务)`,
      );

      // 批量添加所有任务
      await this.taskQueueService.addBulk(taskContexts);
    } catch (error) {
      this.logger.error(`启动任务 ${taskId} 失败，原因: ${error.message}`);
      await this.tasksService.updateStatus(taskId, TaskStatus.STOPPED, userId);
      throw error;
    }
  }

  /**
   * 准备账号详细信息（直接使用明文数据）
   */
  private prepareAccountDetails(items: any[]): any[] {
    return items.map((item, index) => {
      const result: any = { id: item.id };

      if (item.discordAccount) {
        result.discordAccount = {
          ...item.discordAccount,
        };
      }

      if (item.emailAccount) {
        result.emailAccount = {
          ...item.emailAccount,
        };
      }

      if (item.evmWallet) {
        result.evmWallet = {
          ...item.evmWallet,
          privateKey: item.evmWallet.getDecryptedPrivateKey(),
        };
      }

      if (item.twitterAccount) {
        result.twitterAccount = {
          ...item.twitterAccount,
        };
      }

      // 处理代理IP信息
      if (item.proxyIp) {
        result.proxyIp = {
          ...item.proxyIp,
        };
      }

      // 处理浏览器指纹信息
      if (item.browserFingerprint) {
        result.browserFingerprint = {
          ...item.browserFingerprint,
        };
      }

      this.logger.debug(`处理完成第 ${index + 1} 个账号`);

      return result;
    });
  }

  /**
   * 创建账号任务上下文
   */
  private createAccountTaskContext(
    task: any,
    accountGroupId: number,
    accountGroupItemId: number,
    scriptPaths: string[],
    accountDetail: any,
    userId: number,
    headless?: boolean,
  ): AccountTaskContext {
    return {
      id: `${task.id}-${accountGroupItemId}`,
      projectId: task.projectId,
      accountGroupId,
      accountGroupItemId,
      parentTaskId: task.id,
      taskId: task.id,
      scriptPaths,
      accountDetail,
      config: {
        threadCount: task.threadCount,
        headless,
      },
      userId,
    };
  }

  /**
   * 停止任务
   */
  async stopTask(taskId: number, userId: number): Promise<void> {
    try {
      const task = await this.tasksService.findOne(taskId, userId);

      if (task.status !== TaskStatus.RUNNING) {
        throw new Error('任务未在运行中');
      }

      this.logger.debug(`停止任务 ${taskId} (用户ID: ${userId})`);

      this.taskQueueService.queueMap.get(taskId)?.destroy(() => {
        this.logger.debug(`任务 ${taskId} 的队列已销毁`);
      });

      // 更新任务状态
      await this.tasksService.updateStatus(taskId, TaskStatus.STOPPED, userId);
    } catch (error) {
      this.logger.error(`停止任务 ${taskId} 出错: ${error.message}`);
      throw error;
    }
  }
}
