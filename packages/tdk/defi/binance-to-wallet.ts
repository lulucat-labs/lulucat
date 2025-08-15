import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import { ScriptExecutionResult } from '../types';
import { WalletException } from '@lulucat/exceptions';
interface BinanceWithdrawParams {
  currency: string;
  amount: string;
  toAddress: string;
  network: string;
  apiKey?: string;
  secretKey?: string;
  baseUrl?: string;
  maxGasFee?: number;
}

/**
 * 币安交易所提币任务类
 * 使用币安API提币到指定地址
 */
export class BinanceToWalletTask {
  private readonly defaultBinanceBaseUrl = 'https://api.binance.com';
  
  /**
   * 验证所需API凭证是否存在
   * @param apiKey API Key
   * @param secretKey Secret Key
   * @returns 验证结果，如果凭证缺失则包含错误信息
   */
  private validateCredentials(apiKey?: string, secretKey?: string): { valid: boolean; message?: string } {
    // 优先使用传入的参数，其次使用环境变量
    const actualApiKey = apiKey || process.env.BINANCE_API_KEY;
    const actualSecretKey = secretKey || process.env.BINANCE_SECRET_KEY;

    if (!actualApiKey) {
      return { valid: false, message: '缺少【BINANCE_API_KEY】参数' };
    }
    if (!actualSecretKey) {
      return { valid: false, message: '缺少【BINANCE_SECRET_KEY】参数' };
    }
    return { valid: true };
  }

  /**
   * 验证提币金额
   * @param amount 提币金额
   * @returns 验证结果，如果验证失败则包含错误信息
   */
  private validateAmount(amount: string): { valid: boolean; message?: string } {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return { valid: false, message: 'Invalid withdrawal amount' };
    }
    return { valid: true };
  }

  /**
   * 获取当前网络的gas费用
   * @param currency 币种
   * @param network 网络
   * @param actualApiKey API Key
   * @param actualSecretKey Secret Key
   * @param actualBaseUrl Base URL
   * @returns 当前gas费用
   */
  private async getCurrentGasFee(
    currency: string,
    network: string,
    actualApiKey: string,
    actualSecretKey: string,
    actualBaseUrl: string
  ): Promise<number> {
    const timestamp = Date.now().toString();
    const requestPath = '/sapi/v1/capital/config/getall';
    
    // 构建签名
    const queryString = `timestamp=${timestamp}`;
    const signature = CryptoJS.HmacSHA256(queryString, actualSecretKey).toString(CryptoJS.enc.Hex);
    
    const headers = {
      'X-MBX-APIKEY': actualApiKey
    };

    try {
      const response = await axios({
        method: 'GET',
        url: `${actualBaseUrl}${requestPath}?${queryString}&signature=${signature}`,
        headers: headers,
        timeout: 30000,
      });

      // 查找对应币种的网络配置
      const coin = response.data.find((item: any) => 
        item.coin === currency
      );

      if (!coin) {
        throw new Error(`找不到币种 ${currency} 的信息`);
      }

      // 查找对应网络的配置
      const networkInfo = coin.networkList.find((net: any) => 
        net.network === network
      );

      if (!networkInfo) {
        throw new Error(`找不到币种 ${currency} 在网络 ${network} 上的信息`);
      }

      console.log('币种网络信息:', networkInfo);

      // 获取当前网络的提币费用作为gas费用参考
      const gasFee = Number(networkInfo.withdrawFee);
      return gasFee;
    } catch (error) {
      console.log('获取gas费用失败:', error);
      throw new Error(`获取gas费用失败: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * 验证gas费用是否超过阈值
   * @param currentGasFee 当前gas费用
   * @param maxGasFee 最大可接受的gas费用阈值
   * @returns 验证结果，如果验证失败则包含错误信息
   */
  private validateGasFee(currentGasFee: number, maxGasFee?: number): { valid: boolean; message?: string } {
    if (maxGasFee === undefined) {
      return { valid: true }; // 如果未设置maxGasFee，则不进行gas费验证
    }

    if (currentGasFee > maxGasFee) {
      return { 
        valid: false, 
        message: `当前gas费用 ${currentGasFee} 超过了设定的最大阈值 ${maxGasFee}`
      };
    }

    return { valid: true };
  }

  /**
   * 执行单次提币任务
   * @param params 提币参数
   * @param address 提币地址
   * @param amount 提币金额
   * @returns 提币结果
   */
  private async withdrawCurrency(
    params: BinanceWithdrawParams,
    address: string,
    amount: string,
    actualApiKey: string,
    actualSecretKey: string,
    actualBaseUrl: string
  ): Promise<any> {
    const timestamp = Date.now().toString();
    const requestPath = '/sapi/v1/capital/withdraw/apply';

    // 构建请求参数
    const requestParams = {
      coin: params.currency,
      address: address,
      amount: amount,
      network: params.network,
      timestamp: timestamp,
      recvWindow: '60000' // 60秒时间窗口
    };

    // 生成请求查询字符串
    const queryString = Object.entries(requestParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    // 生成签名
    const signature = CryptoJS.HmacSHA256(queryString, actualSecretKey).toString(CryptoJS.enc.Hex);
    
    const headers = {
      'X-MBX-APIKEY': actualApiKey,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    console.log(`准备提币请求：${params.currency} ${amount} 到地址 ${address} 通过 ${params.network} 网络`);
    
    try {
      const response = await axios({
        method: 'POST',
        url: `${actualBaseUrl}${requestPath}`,
        headers: headers,
        data: `${queryString}&signature=${signature}`,
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      console.log('提币请求失败:', error);
      throw new Error(`提币请求失败: ${error.response?.data?.msg || error.message || 'Unknown error'}`);
    }
  }

  /**
   * 执行提币任务
   * @param params 提币参数
   * @returns 提币结果
   */
  public async execute(params: BinanceWithdrawParams): Promise<ScriptExecutionResult> {
    const { 
      currency, 
      amount, 
      toAddress, 
      network, 
      apiKey,
      secretKey,
      baseUrl,
      maxGasFee
    } = params;

    // 验证API凭证
    const credentialsValidation = this.validateCredentials(apiKey, secretKey);
    if (!credentialsValidation.valid) {
      throw WalletException.transactionFailed('参数校验异常', {
        walletInfo: params,
        message: credentialsValidation.message
      });
    }

    // 提币地址验证
    if (!toAddress) {
      throw WalletException.transactionFailed('提币地址不存在', {
        walletInfo: params,
        message: '提币地址不存在'
      });
    }

    // 金额验证
    if (!amount) {
      throw WalletException.transactionFailed('提币金额不存在', {
        walletInfo: params,
        message: '提币金额不存在'
      });
    }

    const actualApiKey = apiKey || process.env.BINANCE_API_KEY;
    const actualSecretKey = secretKey || process.env.BINANCE_SECRET_KEY;
    const actualBaseUrl = baseUrl || this.defaultBinanceBaseUrl;

    // 如果设置了最大gas费阈值，则进行gas费验证
    if (maxGasFee !== undefined) {
      try {
        console.log(`检查 ${network} 网络上 ${currency} 的当前gas费用...`);
        const currentGasFee = await this.getCurrentGasFee(
          currency,
          network,
          actualApiKey,
          actualSecretKey,
          actualBaseUrl
        );
        
        console.log(`当前gas费用: ${currentGasFee}, 最大允许阈值: ${maxGasFee}, 单位是${currency}`);
        
        const gasFeeValidation = this.validateGasFee(currentGasFee, maxGasFee);
        if (!gasFeeValidation.valid) {
          throw WalletException.transactionFailed('gas 费用过高', {
            walletInfo: params,
            message: gasFeeValidation.message
          });
        }
      } catch (error) {
        throw WalletException.transactionFailed('gas 费用检查失败', {
          walletInfo: params,
          message: `Gas Fee Check Error: ${error.message}`
        });
      }
    }

    // 验证提币金额
    const amountValidation = this.validateAmount(amount);
    if (!amountValidation.valid) {
      throw WalletException.transactionFailed('提币金额验证失败', {
        walletInfo: params,
        message: amountValidation.message
      });
    }

    try {
      const result = await this.withdrawCurrency(
        params,
        toAddress,
        amount,
        actualApiKey,
        actualSecretKey,
        actualBaseUrl
      );

      console.log('提币请求成功', result);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw WalletException.transactionFailed('提币任务执行失败', {
        walletInfo: params,
        message: `提币任务执行失败: ${error.message}`
      });
    }
  }
} 