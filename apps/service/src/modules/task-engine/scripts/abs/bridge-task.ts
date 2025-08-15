import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import { BridgeChainTask } from '@lulucat/tdk/defi';
import AbsBase from './base';
import { WalletException } from '@lulucat/exceptions';
// 常量定义
const FIXED_GAS_RESERVE_ETH = '0.00001'; // 固定预留gas费为0.00001 ETH

// 扩展的任务配置接口
export interface BridgeTaskConfig {
  /**
   * 钱包私钥
   */
  privateKey: string;
  /**
   * 目标地址，默认与发送地址相同
   */
  toAddress?: string;
  /**
   * 转账金额
   */
  amount?: string;
  /**
   * 是否使用全部余额，如果为true，则忽略amount
   */
  useFullAmount?: boolean;
  /**
   * 源链ID
   */
  fromChainId?: number;
  /**
   * 目标链ID
   */
  toChainId?: number;
  /** 最大可接受的Gas费用(ETH)，默认为0.00001 ETH */
  maxFeeEth?: string;
  /** 最大可接受的中继费百分比，默认为2% */
  maxRelayerFeePercentage?: string;
  /** 其他可能的配置参数 */
  [key: string]: unknown;
}

// 桥接任务结果数据接口
interface BridgeResultData {
  fromChainId: number;
  toChainId: number;
  amount: string;
  amountOut: string;
  gasFeeEth: string;
  relayerFeeEth: string;
  relayerFeePercentage: string;
  totalFeeEth: string;
  estimatedTimeInMinutes?: string;
  useFullAmount?: boolean;
  walletBalance?: string; // 钱包总余额
  gasReserveForFullAmount?: string; // 全额模式下预留的gas费
  usingFullBalanceWithoutReserve?: boolean; // 是否使用无预留的全额模式
  steps: Array<{
    action: string;
    description: string;
    kind: string;
  }>;
  [key: string]: unknown;
}

/**
 * 使用Relay进行跨链桥接任务
 * 根据传入参数执行ETH跨链桥接操作
 * 可以指定转账金额、源链ID、目标链ID和是否使用全部余额等参数
 */
export default class BridgeTask extends AbsBase {
  /**
   * 执行跨链桥接任务
   * @param context 执行上下文
   * @returns 执行结果
   */
  public async execute(
    context: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    try {
      if (!(await this.checkExistAbsWallet())) {
        console.error('abs 钱包不存在');
        throw WalletException.walletNotFound('abs 钱包不存在', {
          accountId: context.accountDetail.id,
          evmWallet: context.accountDetail.evmWallet,
        });
      }

      const dItem = await this.taskResult.getTaskResult();

      // 如果没有提币任务，则跳过执行
      if (!dItem.tasks.exchangeToOkx) {
        throw WalletException.transactionFailed('未进行OKX提币，跳过执行', {
          accountId: context.accountDetail.id,
          evmWallet: context.accountDetail.evmWallet,
          absWallet: dItem.absWallet,
        });
      }

      if (dItem.tasks.zKBridgeABS) {
        return { success: true, error: 'abs 钱包已桥接，跳过执行' };
      }

      const bridgeChainTask = new BridgeChainTask();
      console.log('context.accountDetail', context.accountDetail);

      // 从账户详情中获取钱包信息
      if (!context.accountDetail?.evmWallet) {
        throw WalletException.walletNotFound('缺少钱包信息', {
          accountId: context.accountDetail.id,
          evmWallet: context.accountDetail.evmWallet,
        });
      }

      const { walletAddress, privateKey } = context.accountDetail.evmWallet;

      if (!privateKey) {
        throw WalletException.walletNotFound('缺少钱包私钥', {
          accountId: context.accountDetail.id,
          evmWallet: context.accountDetail.evmWallet,
        });
      }

      // 从任务配置中获取自定义参数
      const taskConfig = context.taskContext?.config || {};
      const config = taskConfig as unknown as BridgeTaskConfig;

      // 获取配置参数，设置默认值
      const amount = config.amount;
      const fromChainId = 324;
      const toChainId = 2741;
      const toAddress = walletAddress;

      // 全额模式
      const useFullAmount = true;

      // 设置最大可接受的中继费百分比，默认为2%
      const maxRelayerFeePercentage = 2.5;

      // 设置最大可接受的Gas费用 (ETH)
      const maxFeeEth = FIXED_GAS_RESERVE_ETH;

      console.log(
        `执行桥接任务: ${useFullAmount ? '全部可用余额模式（预留' + FIXED_GAS_RESERVE_ETH + ' ETH作为Gas费）' : amount + ' ETH'}, 最大Gas费: ${maxFeeEth} ETH, 最大中继费百分比: ${maxRelayerFeePercentage}%`,
      );

      // 执行桥接任务
      const { success, error, data } = await bridgeChainTask.execute({
        amount,
        toAddress,
        privateKey,
        fromChainId,
        toChainId,
        maxFeeEth,
        maxRelayerFeePercentage,
        useFullAmount,
      });

      if (!success) {
        throw WalletException.transactionFailed(error, {
          accountId: context.accountDetail.id,
          evmWallet: context.accountDetail.evmWallet,
          absWallet: dItem.absWallet,
        });
      }

      // 将返回的数据转换为预期的类型
      const bridgeData = data as unknown as BridgeResultData;
      console.log('桥接交易成功:', bridgeData);

      // 生成消息，根据是否使用全部余额来调整
      let amountMsg = '';
      if (bridgeData.useFullAmount) {
        if (bridgeData.usingFullBalanceWithoutReserve) {
          amountMsg = `全部余额(${bridgeData.amount} ETH，无gas费预留)`;
        } else {
          amountMsg = `可用余额(${bridgeData.amount} ETH，总余额${bridgeData.walletBalance} ETH，预留${FIXED_GAS_RESERVE_ETH} ETH作为Gas费)`;
        }
      } else {
        amountMsg = `${bridgeData.amount} ETH`;
      }

      await this.taskResult.updateTaskResult({
        tasks: {
          zKBridgeABS: true,
        },
      });

      return {
        success: true,
        data: {
          ...bridgeData,
          message: `成功将 ${amountMsg} 从 ${this.getChainName(bridgeData.fromChainId)} 桥接到 ${this.getChainName(bridgeData.toChainId)}，Gas费: ${bridgeData.gasFeeEth} ETH`,
        },
      };
    } catch (error) {
      console.error('桥接任务失败:', error);
      throw WalletException.transactionFailed(error.message || '未知错误', {
        accountId: context.accountDetail.id,
        evmWallet: context.accountDetail.evmWallet,
      });
    }
  }

  /**
   * 根据链ID获取链名称
   * @param chainId 链ID
   * @returns 链名称
   */
  private getChainName(chainId: number): string {
    const chains = {
      1: '以太坊主网',
      10: 'Optimism',
      56: 'BSC',
      137: 'Polygon',
      42161: 'Arbitrum',
      43114: 'Avalanche',
      2741: 'Abstract',
      324: 'zkSync Era',
    };
    return chains[chainId] || `链ID ${chainId}`;
  }
}
