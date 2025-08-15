import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import { ExchangeToWalletTask } from '@lulucat/tdk/defi';
import {
  XException,
  WalletException,
  FallbackException,
} from '@lulucat/exceptions';
import AbsBase from './base';

interface ToWalletConfig {
  currency: string;
  amount: string;
  network: string;
  walletType?: string;
  apiKey?: string;
  secretKey?: string;
  passphrase?: string;
}

/**
 * 提币到钱包任务
 * 封装交易所提币操作，可通过参数配置
 */
export default class ToWalletTask extends AbsBase {
  /**
   * 默认提币配置
   */
  private readonly defaultConfig: ToWalletConfig = {
    currency: 'ETH',
    // 需要随机生成，范围在0.0004-0.0006之间，7位小数
    amount: (Math.random() * 0.0002 + 0.0004).toFixed(7),
    network: 'ETH-zkSync Era',
    // TODO: 下面参数应该从任务配置中获取
    apiKey: process.env.API_KEY,
    secretKey: process.env.SECRET_KEY,
    passphrase: process.env.PASSPHRASE,
  };

  /**
   * 执行提币任务
   * @param context 脚本执行上下文
   * @param config 可选的提币配置，覆盖默认配置
   * @returns 执行结果
   */
  public async execute(
    context: ScriptExecutionContext,
    config?: Partial<ToWalletConfig>,
  ): Promise<ScriptExecutionResult> {
    try {
      if (!context.accountDetail?.evmWallet?.walletAddress) {
        throw WalletException.transactionFailed('钱包地址不存在', {
          walletInfo: context.accountDetail.evmWallet,
        });
      }
      const taskResult = await this.taskResult.getTaskResult();

      if (!(await this.checkExistAbsWallet())) {
        console.error('abs 钱包不存在');
        throw WalletException.walletNotFound(
          `账号组 #${context.accountDetail.id} 的 Abs 钱包不存在`,
          {
            accountId: context.accountDetail.id,
            evmWallet: context.accountDetail.evmWallet,
            absWallet: taskResult.absWallet,
          },
        );
      }
      // 检查是否授权X
      if (!(await this.checkAuthX())) {
        console.error('X 未授权');
        throw XException.authenticationFailed(
          `账号组 #${context.accountDetail.id} 的 X 未授权`,
          {
            accountId: context.accountDetail.id,
            evmWallet: context.accountDetail.evmWallet,
          },
        );
      }
      // 如果 exchangeToOkx 为 true，则不执行跳过
      if (taskResult?.tasks?.exchangeToOkx) {
        console.log('exchangeToOkx 为 true，跳过执行');
        return { success: true, error: '已经提币，跳过执行' };
      }
      if (!taskResult?.tasks?.authX) {
        console.log('authX 为 false，跳过执行');
        return { success: true, error: '未授权X，跳过执行' };
      }
      // 合并默认配置和传入的配置
      const finalConfig: ToWalletConfig = {
        ...this.defaultConfig,
        ...config,
      };

      console.log('账户详情:', context.accountDetail);
      const exchangeToWalletTask = new ExchangeToWalletTask();
      console.log('预计充值金额', finalConfig.amount);
      const { success, data, error } = await exchangeToWalletTask.execute({
        currency: finalConfig.currency,
        amount: finalConfig.amount,
        toAddress: context.accountDetail.evmWallet.walletAddress,
        network: finalConfig.network,
        walletType: finalConfig.walletType || 'private',
        apiKey: finalConfig.apiKey,
        secretKey: finalConfig.secretKey,
        passphrase: finalConfig.passphrase,
        // 最大可接受的gas费用阈值，单位为ETH
        maxGasFee: 0.000041,
      });

      if (!success) {
        throw FallbackException.executionFailed(
          `账号组 #${context.accountDetail.id} 提币失败`,
          {
            accountId: context.accountDetail.id,
            evmWallet: context.accountDetail.evmWallet,
          },
        );
      }

      this.taskResult.updateTaskResult({
        tasks: {
          exchangeToOkx: true,
        },
      });

      return {
        success: true,
        data: {
          withdrawalInfo: data,
          config: finalConfig,
        },
      };
    } catch (error) {
      console.log('提币请求失败:', error);
      throw FallbackException.executionFailed(
        `账号组 #${context.accountDetail.id} 提币失败, ${error}`,
        {
          accountId: context.accountDetail.id,
          evmWallet: context.accountDetail.evmWallet,
        },
      );
    }
  }
}
