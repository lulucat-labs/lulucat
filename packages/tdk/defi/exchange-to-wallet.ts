import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import { ScriptExecutionResult } from '../types';
import { WalletException } from '@lulucat/exceptions';

interface WithdrawParams {
  currency: string;
  amount: string;
  toAddress: string;
  network: string;
  walletType?: string;
  apiKey?: string;
  secretKey?: string;
  passphrase?: string;
  baseUrl?: string;
  maxGasFee?: number; // 最大可接受的gas费用阈值
}

/**
 * 交易所提币任务类
 * 使用交易所API提币到指定地址
 */
export class ExchangeToWalletTask {
  private readonly defaultOKXBaseUrl = 'https://www.okx.com';
  
  /**
   * 验证所需API凭证是否存在
   * @param apiKey API Key
   * @param secretKey Secret Key
   * @param passphrase API Passphrase
   * @returns 验证结果，如果凭证缺失则包含错误信息
   */
  private validateCredentials(apiKey?: string, secretKey?: string, passphrase?: string): { valid: boolean; message?: string } {
    // 优先使用传入的参数，其次使用环境变量
    const actualApiKey = apiKey || process.env.API_KEY;
    const actualSecretKey = secretKey || process.env.SECRET_KEY;
    const actualPassphrase = passphrase || process.env.PASSPHRASE;

    if (!actualApiKey) {
      return { valid: false, message: '缺少【API_KEY】参数' };
    }
    if (!actualSecretKey) {
      return { valid: false, message: '缺少【SECRET_KEY】参数' };
    }
    if (!actualPassphrase) {
      return { valid: false, message: '缺少【PASSPHRASE】参数' };
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
   * @param actualPassphrase Passphrase
   * @param actualBaseUrl Base URL
   * @returns 当前gas费用
   */
  private async getCurrentGasFee(
    currency: string,
    network: string,
    actualApiKey: string,
    actualSecretKey: string,
    actualPassphrase: string,
    actualBaseUrl: string
  ): Promise<number> {
    const timestamp = new Date().toISOString();
    const requestPath = '/api/v5/asset/currencies';
    const queryParams = `?ccy=${currency}`;
    
    const signString = timestamp + 'GET' + requestPath + queryParams;
    const signature = CryptoJS.HmacSHA256(signString, actualSecretKey).toString(CryptoJS.enc.Base64);

    const headers = {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': actualApiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': actualPassphrase
    };

    try {
      const response = await axios({
        method: 'GET',
        url: `${actualBaseUrl}${requestPath}${queryParams}`,
        headers: headers,
        timeout: 30000,
      });

      if (Number(response.data.code) !== 0) {
        throw new Error(`获取币种信息失败: ${JSON.stringify(response.data.msg)}`);
      }

      // 找到对应网络的币种信息
      const currencyInfo = response.data.data.find((item: any) => 
        item.ccy === currency && item.chain && item.chain.includes(network)
      );

      if (!currencyInfo) {
        throw new Error(`找不到币种 ${currency} 在网络 ${network} 上的信息`);
      }

      console.log('币种信息:', currencyInfo);

      // 获取当前网络的提币费用作为gas费用参考
      const gasFee = Number(currencyInfo.fee);
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
   * 执行提币任务
   * @param params 提币参数，包含币种、数量、地址、网络等参数
   * @returns 提币请求的响应数据
   */
  public async execute(params: WithdrawParams): Promise<ScriptExecutionResult> {
    const { 
      currency, 
      amount, 
      toAddress, 
      network, 
      walletType = 'private',
      apiKey,
      secretKey,
      passphrase,
      baseUrl,
      maxGasFee
    } = params;

    // 验证API凭证
    const credentialsValidation = this.validateCredentials(apiKey, secretKey, passphrase);
    if (!credentialsValidation.valid) {
      throw WalletException.transactionFailed('参数校验异常', {
        walletInfo: params,
        message: `参数校验异常: ${credentialsValidation.message}`
      });
    }

    // 验证提币金额
    const amountValidation = this.validateAmount(amount);
    if (!amountValidation.valid) {
      throw WalletException.transactionFailed('提币金额验证失败', {
        walletInfo: params,
        message: `提币金额验证失败: ${amountValidation.message}`
      });
    }

    const actualApiKey = apiKey || process.env.API_KEY;
    const actualSecretKey = secretKey || process.env.SECRET_KEY;
    const actualPassphrase = passphrase || process.env.PASSPHRASE;
    const actualBaseUrl = baseUrl || this.defaultOKXBaseUrl;

    // 如果设置了最大gas费阈值，则进行gas费验证
    if (maxGasFee !== undefined) {
      try {
        console.log(`检查 ${network} 网络上 ${currency} 的当前gas费用...`);
        const currentGasFee = await this.getCurrentGasFee(
          currency,
          network,
          actualApiKey,
          actualSecretKey,
          actualPassphrase,
          actualBaseUrl
        );
        
        console.log(`当前gas费用: ${currentGasFee}, 最大允许阈值: ${maxGasFee}, 单位是${currency}`);
        
        const gasFeeValidation = this.validateGasFee(currentGasFee, maxGasFee);
        if (!gasFeeValidation.valid) {
          throw WalletException.transactionFailed('gas 费用过高', {
            walletInfo: params,
            message: `Gas Fee Validation Error: ${gasFeeValidation.message}`
          });
        }
      } catch (error) {
        throw WalletException.transactionFailed('gas 费用检查失败', {
          walletInfo: params,
          message: `gas 费用检查失败: ${error.message}`
        });
      }
    }

    const timestamp = new Date().toISOString();
    const requestPath = '/api/v5/asset/withdrawal';

    const body = {
      ccy: currency,
      amt: amount,
      dest: '4', // 4表示至数字货币地址
      toAddr: toAddress,
      chain: network,
      walletType: walletType
    };

    console.log('准备提币请求:', body);

    const bodyString = JSON.stringify(body);
    const signString = timestamp + 'POST' + requestPath + bodyString;
    const signature = CryptoJS.HmacSHA256(signString, actualSecretKey).toString(CryptoJS.enc.Base64);

    const headers = {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': actualApiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': actualPassphrase
    };

    try {
      console.log(`正在连接到API: ${actualBaseUrl}${requestPath}`);
      
      const response = await axios({
        method: 'POST',
        url: actualBaseUrl + requestPath,
        headers: headers,
        data: body,
        timeout: 30000, // 30秒超时
      });

      if (Number(response.data.code) !== 0) {
        throw new Error(`${JSON.stringify(response.data.msg)}`);
      }
      console.log('提币请求成功，1分钟内到账', response.data?.data);
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (error) {
      console.log('提币请求失败:', error);
      // 改进错误处理和错误信息
      const errorMessage = error.message || 'Unknown error';
      const errorCode = error.code || '';
      let detailedError = `提币任务执行失败: ${errorMessage}`;
      
      if (errorCode === 'ENOTFOUND') {
        detailedError += '. 无法解析域名，请检查网络连接或确认该域名是否可访问。';
      } else if (errorCode === 'ECONNREFUSED') {
        detailedError += '. 连接被拒绝，服务器可能无法访问或正在维护。';
      } else if (error.response) {
        detailedError += `. 服务器响应错误: ${JSON.stringify(error.response.data)}`;
      }
      
      throw WalletException.transactionFailed('提币任务执行失败', {
        walletInfo: params,
        message: detailedError
      });
    }
  }
}
