// https://quest.somnia.network/

import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import { Page } from 'playwright';
import { FallbackException } from '@lulucat/exceptions';
import { waitForPageLoad, isElementVisible } from '@lulucat/tdk/browser';
import { waitForNetwork } from '@lulucat/tdk/network';
import { generateRandomUsername } from '@lulucat/tdk/utils';
import { TaskResult } from '../../task-result';
import SomniaOfficialConnect from './connect';

export default class SomniaOfficialSetUsername {
  public readonly timeout = 30000;
  // 用户名保存页面地址
  public readonly accountUrl = 'https://quest.somnia.network/account';
  public somniaPage: Page;
  public walletAddress: string;

  constructor(params: ScriptExecutionContext) {
    this.somniaPage = params.context.pages()[0];
    this.walletAddress = params.accountDetail.evmWallet?.walletAddress;
  }

  public async execute(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    console.log('开始执行Somnia官网设置用户名任务...');

    const taskResult = TaskResult.create(
      params.projectId,
      params.accountGroupItemId,
    );
    const taskResultData = await taskResult.getTaskResult();

    if (taskResultData?.tasks?.setUsername) {
      console.log('用户名已保存，跳过执行');
      return { success: true, error: '用户名已保存，跳过执行' };
    }
    // 首先执行连接钱包任务
    const somniaConnect = new SomniaOfficialConnect(params);
    await somniaConnect.execute(params);
    await this.connectSetUsername(params);

    // 更新任务结果
    await taskResult.updateTaskResult({
      tasks: {
        setUsername: true,
      },
    });
    console.log('Somnia官网连接X任务执行完成');
  }

  private async connectSetUsername(
    params: ScriptExecutionContext,
  ): Promise<void> {
    console.log('开始执行Somnia官网设置用户名任务...');
    // 等待页面加载完成
    await waitForPageLoad(this.somniaPage, {
      url: this.accountUrl,
      requiredAnySelectors: ['#username input'],
    });

    // 检查用户名输入框是否存在
    if (
      await isElementVisible({
        page: this.somniaPage,
        selector: '#username input',
        timeout: this.timeout,
      })
    ) {
      const usernameElement = this.somniaPage.locator('#username input');

      const username = await usernameElement.getAttribute('value');

      if (username) {
        console.log('用户名已设置，跳过执行');
        return;
      }
      // 设置用户名
      const randomUsername = generateRandomUsername();
      console.log(`设置用户名: ${randomUsername}`);
      await usernameElement.fill(randomUsername);

      await this.somniaPage.locator('#username button:has-text("Save")').click({
        timeout: this.timeout,
      });

      // 使用新的简化API
      try {
        const responseData = await waitForNetwork(
          this.somniaPage,
          '/api/users/username', // URL路径
          {
            method: 'PATCH', // HTTP方法
            timeout: this.timeout, // 超时
            debug: true, // 启用调试日志
          },
        );
        console.log('用户名设置成功，响应数据:', responseData);
        console.log('设置用户名成功');
      } catch (error) {
        throw FallbackException.executionFailed('设置用户名失败', {
          accountId: params.accountDetail.id,
          twitterAccount: params.accountDetail.twitterAccount,
        });
      }
    } else {
      // 直接抛出异常，不再检查是否已经连接成功
      throw FallbackException.executionFailed('无法找到用户名输入框', {
        accountId: params.accountDetail.id,
        twitterAccount: params.accountDetail.twitterAccount,
      });
    }
  }
}
