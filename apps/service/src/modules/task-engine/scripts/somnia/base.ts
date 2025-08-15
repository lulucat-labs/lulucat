import { ScriptExecutionContext } from '@lulucat/tdk/types';
import { Page } from 'playwright';
import { AccountDetails } from '../../types';
import { CryptoUtil } from '../../../../common/utils/crypto.util';
import { ConfigService } from '@nestjs/config';
import { TaskResult } from '../task-result';
import { SomniaTaskResult } from './types';

export default class SomniaBase {
  public readonly timeout = 30000;
  public readonly questUrl = 'https://quest.somnia.network/';
  public readonly testnetUrl = 'https://testnet.somnia.network/';
  public readonly accountDetail: AccountDetails;
  public somniaPage: Page;
  public taskResult: TaskResult<SomniaTaskResult>;

  constructor(params: ScriptExecutionContext) {
    const { projectId, accountDetail, accountGroupItemId } = params;
    // 使用静态工厂方法创建TaskResult实例
    this.taskResult = TaskResult.create(projectId, accountGroupItemId);

    // 账号项详情
    this.accountDetail = accountDetail as AccountDetails;
  }

  // 插入任务数据
  public async insertData(invitationLink?: string) {
    const taskResult = await this.taskResult.getTaskResult();
    console.log('taskResult', taskResult);
    if (taskResult) {
      console.log('[TASK RESULT JSON] 账号数据已存在, 更新数据');

      await this.taskResult.updateTaskResult({
        ...taskResult,
        invitation: {
          link: invitationLink || taskResult.invitation?.link || '',
          frequency: (taskResult.invitation?.frequency || 0) + 1,
        },
        tasks: {
          ...taskResult.tasks,
        },
      });
      return;
    }

    console.log('[TASK RESULT JSON] 开始插入账号新数据');
    const configService = new ConfigService();
    const encryptionKey = configService.get<string>('ENCRYPTION_KEY');

    const evmWalletPrivateKey = CryptoUtil.encrypt(
      this.accountDetail.evmWallet.privateKey,
      encryptionKey,
    );

    await this.taskResult.createTaskResult({
      id: this.accountDetail.evmWallet.walletAddress,
      wallet: {
        privateKey: evmWalletPrivateKey,
        address: this.accountDetail.evmWallet.walletAddress,
      },
      invitation: {
        link: invitationLink || '',
        frequency: 0,
      },
      tasks: {
        register: true,
        authX: false,
        authDiscord: false,
      },
    });
  }

  // 查询任务数据
  public async getTaskData(): Promise<SomniaTaskResult | null> {
    return await this.taskResult.getTaskResult();
  }

  // 检查是否存在数据
  public async checkExistData(): Promise<boolean> {
    const taskResult = await this.taskResult.getTaskResult();
    // 如果没有则不执行
    if (!taskResult?.id) {
      return false;
    }

    return true;
  }

  // 检查是否授权X
  public async checkAuthX(): Promise<boolean> {
    const taskResult = await this.taskResult.getTaskResult();
    return !!taskResult?.tasks?.authX;
  }

  // 检查是否授权Discord
  public async checkAuthDiscord(): Promise<boolean> {
    const taskResult = await this.taskResult.getTaskResult();
    return !!taskResult?.tasks?.authDiscord;
  }

  // 更新X授权状态
  public async updateAuthX(status: boolean): Promise<void> {
    const taskResult = await this.taskResult.getTaskResult();
    if (taskResult) {
      await this.taskResult.updateTaskResult({
        ...taskResult,
        tasks: {
          ...taskResult.tasks,
          authX: status,
        },
      });
    }
  }

  // 更新Discord授权状态
  public async updateAuthDiscord(status: boolean): Promise<void> {
    const taskResult = await this.taskResult.getTaskResult();
    if (taskResult) {
      await this.taskResult.updateTaskResult({
        ...taskResult,
        tasks: {
          ...taskResult.tasks,
          authDiscord: status,
        },
      });
    }
  }

  // 获取所有任务状态
  public async getAllTasks() {
    const taskResult = await this.taskResult.getTaskResult();
    return taskResult?.tasks;
  }
}
