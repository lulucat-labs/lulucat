// https://quest.somnia.network/

import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import { Page } from 'playwright';
import { FallbackException, XException } from '@lulucat/exceptions';
import { waitForPageLoad, isElementVisible } from '@lulucat/tdk/browser';
import { AutoLoginXTask } from '@lulucat/tdk/social-media';
import SomniaOfficialConnect from './connect';
import { TaskResult } from '../../task-result';

export default class SomniaOfficialAuthX {
  public readonly timeout = 30000;
  // X认证页面地址
  public readonly xAuthUrl = 'https://quest.somnia.network/account';
  public somniaPage: Page;
  public walletAddress: string;

  constructor(params: ScriptExecutionContext) {
    this.somniaPage = params.context.pages()[0];
    this.walletAddress = params.accountDetail.evmWallet?.walletAddress;
  }

  public async execute(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    console.log('开始执行Somnia官网连接X任务...');

    const taskResult = TaskResult.create(
      params.projectId,
      params.accountGroupItemId,
    );
    const taskResultData = await taskResult.getTaskResult();

    if (taskResultData?.tasks?.authX) {
      console.log('X 已授权，跳过执行');
      return { success: true, error: 'X 已授权，跳过执行' };
    }
    // 首先执行连接钱包任务
    const somniaConnect = new SomniaOfficialConnect(params);
    await somniaConnect.execute(params);

    const autoLoginX = new AutoLoginXTask();
    await autoLoginX.execute(params);
    // 连接X
    await this.connectX(params);

    // 更新任务结果
    await taskResult.updateTaskResult({
      tasks: {
        authX: true,
      },
    });
    console.log('Somnia官网连接X任务执行完成');
  }

  private async connectX(params: ScriptExecutionContext): Promise<void> {
    console.log('开始执行Somnia官网连接X任务...');
    // 等待页面加载完成
    await waitForPageLoad(this.somniaPage, {
      url: this.xAuthUrl,
      requiredAnySelectors: ['div#x button:has-text("Connect")'],
    });

    // 检查X连接按钮是否存在
    if (
      await isElementVisible({
        page: this.somniaPage,
        selector: 'div#x button:has-text("Connect")',
        timeout: this.timeout,
      })
    ) {
      // 点击连接按钮
      console.log('点击X连接按钮');
      await this.somniaPage.locator('div#x button:has-text("Connect")').click({
        timeout: this.timeout,
      });

      try {
        await this.somniaPage
          .locator('button[data-testid="OAuth_Consent_Button"]')
          .click({
            timeout: this.timeout,
          });
      } catch (error) {
        throw FallbackException.pageLoadFailed(
          'X 授权页面加载失败或着按钮未找到',
          {
            error,
            accountId: params.accountDetail.id,
            twitterAccount: params.accountDetail.twitterAccount,
          },
        );
      }

      console.log('X 授权按钮已点击');
      // 直接等待页面重定向回来，不做重试
      await this.somniaPage.waitForURL(/quest\.somnia\.network/, {
        timeout: this.timeout,
      });

      // 检查id为x的元素下面的 input 的value值，是否等于账号名称
      const xElement = this.somniaPage.locator('#x input');
      await xElement.waitFor({
        state: 'visible',
        timeout: this.timeout,
      });
      const xValue = await xElement.getAttribute('value');
      console.log('授权的x账号昵称：', xValue);
      console.log(
        '数据库x账号昵称：',
        params.accountDetail.twitterAccount.username,
      );
      if (xValue !== params.accountDetail.twitterAccount.username) {
        throw XException.authenticationFailed('授权失败或者账号名称导入错误', {
          accountId: params.accountDetail.id,
          twitterAccount: params.accountDetail.twitterAccount,
        });
      }

      console.log('X连接成功');
    } else {
      // 直接抛出异常，不再检查是否已经连接成功
      throw XException.authenticationFailed('无法找到X连接按钮', {
        accountId: params.accountDetail.id,
        twitterAccount: params.accountDetail.twitterAccount,
      });
    }
  }
}
