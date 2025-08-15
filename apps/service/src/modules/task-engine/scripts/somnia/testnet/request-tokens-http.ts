// https://testnet.somnia.network/

import axios from 'axios';
import { ScriptExecutionContext } from '@lulucat/tdk/types';
import { FallbackException } from '@lulucat/exceptions';

export default class SomniaRequestTokens {
  private readonly apiUrl = 'https://testnet.somnia.network/api/faucet';
  private readonly timeout = 30000; // 30秒超时

  public async execute(params: ScriptExecutionContext): Promise<void> {
    console.log('开始执行Somnia请求测试代币任务...');

    // 从执行上下文中获取钱包地址
    const walletAddress = params.accountDetail?.evmWallet?.walletAddress;

    if (!walletAddress) {
      throw FallbackException.executionFailed('无法获取钱包地址', {
        error: '钱包地址为空',
      });
    }

    // 获取浏览器指纹
    const browserFingerprint = params.accountDetail?.browserFingerprint;
    if (!browserFingerprint) {
      console.warn('账号没有关联浏览器指纹，请求可能会被检测到');
      return;
    }

    await this.requestTestTokens(walletAddress, params);
  }

  private async requestTestTokens(
    walletAddress: string,
    params: ScriptExecutionContext,
  ): Promise<void> {
    console.log(`开始通过API请求Somnia测试代币，钱包地址: ${walletAddress}`);

    try {
      // 准备请求参数
      const requestData = {
        address: walletAddress,
      };

      // 设置指纹相关的HTTP头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // 如果有浏览器指纹信息，添加到请求头
      const fingerprint = params.accountDetail?.browserFingerprint;
      console.log(fingerprint);
      if (fingerprint) {
        // 添加用户代理
        headers['User-Agent'] = fingerprint.userAgent;
        headers['Accept'] = 'application/json, text/plain, */*';
        headers['Origin'] = 'https://testnet.somnia.network';
        headers['Referer'] = 'https://testnet.somnia.network/';
      }

      // 发送POST请求到水龙头API
      const response = await axios.post(this.apiUrl, requestData, {
        headers,
        timeout: this.timeout,
      });

      console.log(response.data);
      console.log(response.data.data);
      // 检查响应状态
      if (!response.data.success) {
        throw response.data;
      }
    } catch (error) {
      console.error('测试网领水失败:', error);
      throw FallbackException.executionFailed(
        `测试网领水失败${error.message}`,
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }
}
