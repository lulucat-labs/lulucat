import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import { BinanceToWalletTask } from '@lulucat/tdk/defi';
import AbsBase from './base';
import { WalletException, XException } from '@lulucat/exceptions';

interface BinanceToWalletConfig {
  currency: string;
  amount?: string;
  minAmount?: string;
  maxAmount?: string;
  network: string;
  apiKey?: string;
  secretKey?: string;
  maxGasFee?: number;
  delay?: number;
}

/**
 * 币安提币到钱包任务
 * 封装币安交易所提币操作，可通过参数配置
 */
export default class BinanceToWallet extends AbsBase {
  /**
   * 默认提币配置
   */
  private readonly defaultConfig: BinanceToWalletConfig = {
    currency: 'ETH',
    amount: (Math.random() * 0.0001 + 0.0009).toFixed(7),
    network: 'ARBITRUM',
    apiKey: 'kd4FeL5gQtL1cjyqlAGOFGiOyMtynVGl6unx07iceRRLt65GC6DMWWYI0rUV9DX9',
    secretKey: 'vy45Ov6anF9nRBNEfaoQIHGCqyI9XQmU2PNSQyNL4P2j1p36FitBQfPIbhbfm47F',
    maxGasFee: 0.000041,
    delay: 20,
  };

  /**
   * 执行提币任务
   * @param context 脚本执行上下文
   * @param config 可选的提币配置，覆盖默认配置
   * @returns 执行结果
   */
  public async execute(
    context: ScriptExecutionContext,
    config?: Partial<BinanceToWalletConfig>,
  ): Promise<ScriptExecutionResult> {
    try {
      if (!context.accountDetail?.evmWallet?.walletAddress) {
        throw WalletException.walletNotFound('钱包地址不存在', {
          accountId: context.accountDetail.id,
          evmWallet: context.accountDetail.evmWallet,
        });
      }

      if (!(await this.checkExistAbsWallet())) {
        throw WalletException.walletNotFound('abs 钱包不存在', {
          accountId: context.accountDetail.id,
          absWallet: context.accountDetail.absWallet,
        });
      }

      // X 未授权
      if (!(await this.checkAuthX())) {
        throw XException.authenticationFailed('X未授权，跳过执行', {
          accountId: context.accountDetail.id,
          absWallet: context.accountDetail.absWallet,
        });
      }

      const tasks = await this.getAllTasks();

      // 如果提币任务已经完成，则跳过执行
      if (tasks.exchangeToOkx || tasks.zKBridgeABS) {
        console.log('提币任务已经完成，跳过执行');
        return {
          success: true,
          error: '提币任务已经完成，跳过执行',
        };
      }

      const finalConfig: BinanceToWalletConfig = {
        ...this.defaultConfig,
        ...config,
      };

      console.log('账户详情:', context.accountDetail);
      const binanceWithdrawTask = new BinanceToWalletTask();

      // 确定提币金额
      let actualAmount: string;

      // 如果提供了固定金额，则使用固定金额
      if (finalConfig.amount) {
        actualAmount = finalConfig.amount;
        console.log(`预计提币金额: ${actualAmount} ${finalConfig.currency}`);
      } else {
        throw WalletException.transactionFailed('提币金额不存在', {
          walletInfo: context.accountDetail.evmWallet,
        });
      }

      const withdrawalParams: any = {
        currency: finalConfig.currency,
        amount: actualAmount,
        toAddress: context.accountDetail.evmWallet.walletAddress,
        network: finalConfig.network,
        apiKey: finalConfig.apiKey,
        secretKey: finalConfig.secretKey,
        maxGasFee: finalConfig.maxGasFee,
      };

      // 如果提供了固定金额，则使用固定金额
      if (finalConfig.amount) {
        withdrawalParams.amount = finalConfig.amount;
        console.log(
          `预计提币金额: ${finalConfig.amount} ${finalConfig.currency}`,
        );
      }

      const { success, data, error } =
        await binanceWithdrawTask.execute(withdrawalParams);

      if (!success) {
        throw WalletException.transactionFailed('提币失败', {
          accountId: context.accountDetail.id,
          evmWallet: context.accountDetail.evmWallet,
          requestParams: withdrawalParams,
          error,
        });
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
      console.log('币安提币请求失败:', error);
      throw WalletException.transactionFailed('提币失败', {
        accountId: context.accountDetail.id,
        evmWallet: context.accountDetail.evmWallet,
        error,
      });
    }
  }

  /**
   * 执行批量提币任务
   * @param addressFile 地址文件路径
   * @param config 可选的提币配置，覆盖默认配置
   * @returns 执行结果
   */
  public async executeBatch(
    addressFile: string,
    config?: Partial<BinanceToWalletConfig>,
  ): Promise<ScriptExecutionResult> {
    try {
      // 合并默认配置和传入的配置
      const finalConfig: BinanceToWalletConfig = {
        ...this.defaultConfig,
        ...config,
      };

      const binanceWithdrawTask = new BinanceToWalletTask();

      const withdrawalParams: any = {
        currency: finalConfig.currency,
        addressFile: addressFile,
        network: finalConfig.network,
        apiKey: finalConfig.apiKey,
        secretKey: finalConfig.secretKey,
        maxGasFee: finalConfig.maxGasFee,
        delay: finalConfig.delay,
      };

      // 如果提供了固定金额，则使用固定金额
      if (finalConfig.amount) {
        withdrawalParams.amount = finalConfig.amount;
        console.log(
          `批量提币固定金额: ${finalConfig.amount} ${finalConfig.currency}`,
        );
      }
      // 否则使用最小和最大金额范围生成随机金额
      else if (finalConfig.minAmount && finalConfig.maxAmount) {
        withdrawalParams.minAmount = finalConfig.minAmount;
        withdrawalParams.maxAmount = finalConfig.maxAmount;
        console.log(
          `批量提币金额范围: ${finalConfig.minAmount} - ${finalConfig.maxAmount} ${finalConfig.currency}`,
        );
      }

      console.log(`开始从文件 ${addressFile} 批量提币`);
      const { success, data, error } =
        await binanceWithdrawTask.execute(withdrawalParams);

      if (!success) {
        throw WalletException.transactionFailed('提币失败', {
          requestParams: withdrawalParams,
          error,
        });
      }

      return {
        success: true,
        data: {
          batchWithdrawalInfo: data,
          config: finalConfig,
        },
      };
    } catch (error) {
      console.log('币安批量提币请求失败:', error);
      throw WalletException.transactionFailed('提币失败', {
        error,
      });
    }
  }
}
