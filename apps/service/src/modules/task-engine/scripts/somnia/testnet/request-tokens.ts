// https://testnet.somnia.network/

import { FallbackException } from '@lulucat/exceptions';
import { isElementVisible } from '@lulucat/tdk/browser';
import { ScriptExecutionContext } from '@lulucat/tdk/types';
import SomniaConnect from './connect';

export default class SomniaRequestTokens extends SomniaConnect {
  public async execute(params: ScriptExecutionContext): Promise<void> {
    console.log('开始执行Somnia请求测试代币任务...');
    await super.execute(params);
    await this.requestTestTokens();

    const isSendingTokens = await isElementVisible({
      page: this.somniaPage,
      selector: 'li[role="status"] div:has-text("Sending Tokens)',
      timeout: this.timeout,
    });
    if (isSendingTokens) {
      throw FallbackException.executionFailed('测试网领水失败', {
        error: 'Sending Tokens',
      });
    }
  }

  private async requestTestTokens(): Promise<void> {
    console.log('开始领水...');
    try {
      // 等待Request Tokens按钮可点击
      const requestTokensButton = await this.somniaPage
        .locator('button:has-text("Request Tokens")')
        .first();
      await requestTokensButton.waitFor({
        state: 'visible',
        timeout: this.timeout,
      });

      // 点击Request Tokens按钮
      await requestTokensButton.click({ timeout: this.timeout });

      // 等待请求成功提示或者其他确认元素
      await this.somniaPage
        .locator('[role="dialog"] button:has-text("Get STT")')
        .first()
        ?.click({ timeout: this.timeout });

      console.log('点击领水成功按钮');

      // 关闭弹窗
      await this.somniaPage
        .locator('[role="dialog"] button:has-text("Close")')
        .first()
        ?.click({ timeout: this.timeout });
    } catch (error) {
      console.error('测试网领水失败:', error);
      throw FallbackException.executionFailed('测试网领水失败', {
        error,
      });
    }
  }
}
