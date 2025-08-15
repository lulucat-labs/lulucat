import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import { EVMTransferParams, executeEVMTransfer } from '@lulucat/tdk/defi';
import AbsBase from './base';
import { WalletException, XException } from '@lulucat/exceptions';

/**
 * 钱包转账任务配置接口
 */
interface WalletToAbsConfig {
  amount?: string;
  toAddress?: string;
  maxGasETH?: string;
  fullBalanceMode?: boolean;
  skipPriceQuery?: boolean;
  staticETHPriceUSD?: number;
  [key: string]: unknown;
}

/**
 * 将ETH从钱包转移到Abstract链上的另一个钱包
 * Abstract链ID: 2741
 */
export default class WalletToAbsTask extends AbsBase {
  // Abstract链的配置
  private readonly ABSTRACT_CHAIN_ID = 2741;
  private readonly ABSTRACT_RPC_URL = 'https://api.mainnet.abs.xyz';

  /**
   * 执行钱包转账任务
   * @param context 执行上下文
   * @returns 执行结果
   */
  public async execute(
    context: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    try {
      console.log('context.accountDetail', context.accountDetail);

      // 从账户详情中获取钱包信息
      if (!context.accountDetail?.evmWallet) {
        throw new Error('缺少钱包信息');
      }

      if (!(await this.checkExistAbsWallet())) {
        console.error('abs 钱包不存在');
        throw WalletException.walletNotFound('abs 钱包不存在，跳过执行', {
          accountId: context.accountDetail.id,
          evmWallet: context.accountDetail.evmWallet,
        });
      }

      const taskResult = await this.taskResult.getTaskResult();

      if (!taskResult?.tasks.authX) {
        console.log('X未授权，跳过执行');
        throw XException.authenticationFailed('X未授权，跳过执行', {
          accountId: context.accountDetail.id,
          evmWallet: context.accountDetail.evmWallet,
          absTasks: taskResult?.tasks,
        });
      }

      if (!taskResult?.tasks.zKBridgeABS) {
        console.log('未执行桥接任务，跳过执行');
        throw WalletException.transactionFailed('未执行桥接任务，跳过执行', {
          accountId: context.accountDetail.id,
          evmWallet: context.accountDetail.evmWallet,
          absTasks: taskResult?.tasks,
        });
      }

      if (taskResult?.tasks.evmTransferABS) {
        console.log('EVM转账ABS已完成，跳过执行');
        return { success: true, error: 'EVM转账ABS已完成，跳过执行' };
      }

      const { privateKey } = context.accountDetail.evmWallet;

      if (!privateKey) {
        throw new Error('缺少钱包私钥');
      }

      const absWallet = taskResult?.absWallet?.address;

      // 从任务配置中获取自定义参数
      const config = (context.taskContext?.config as WalletToAbsConfig) || {};

      const amount = config.amount;
      const toAddress = absWallet;
      const maxGasETH = 0.000015;
      const fullBalanceMode = config.fullBalanceMode ?? true;

      // 从配置中获取价格查询相关参数
      const skipPriceQuery = config.skipPriceQuery ?? true; // 默认跳过价格查询以避免IP封禁
      const staticETHPriceUSD = config.staticETHPriceUSD ?? 3000; // 默认使用静态ETH价格

      console.log('absWallet', absWallet);
      if (!toAddress) {
        throw new Error('缺少目标地址');
      }

      console.log('转账配置:', {
        privateKey,
        toAddress,
        amount,
        maxGasETH,
        fullBalanceMode,
        skipPriceQuery,
        staticETHPriceUSD,
        chainId: this.ABSTRACT_CHAIN_ID,
        rpcUrl: this.ABSTRACT_RPC_URL,
      });

      // 准备转账参数
      const transferParams: EVMTransferParams = {
        privateKey: `0x${privateKey}`,
        toAddress,
        amount,
        maxGasETH,
        fullBalanceMode,
        skipPriceQuery,
        staticETHPriceUSD,
        chainId: this.ABSTRACT_CHAIN_ID,
        rpcUrl: this.ABSTRACT_RPC_URL,
      };

      // 使用通用EVM转账工具执行转账
      await executeEVMTransfer(transferParams);

      this.taskResult.updateTaskResult({
        tasks: {
          evmTransferABS: true,
        },
      });

      return {
        success: true,
        error: 'EVM转账ABS已完成',
      };
    } catch (error) {
      console.error('转账任务失败:', error);
      throw WalletException.transactionFailed(error || '未知错误', {
        accountId: context.accountDetail.id,
        evmWallet: context.accountDetail.evmWallet,
      });
    }
  }
}
