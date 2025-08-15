// https://quest.somnia.network/

import { Page } from 'playwright';
import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import { FallbackException, DiscordException } from '@lulucat/exceptions';
import { waitForPageLoad, isElementVisible } from '@lulucat/tdk/browser';
import { AutoLoginDiscordTask } from '@lulucat/tdk/social-media';
import SomniaOfficialConnect from './connect';
import { TaskResult } from '../../task-result';

export default class SomniaOfficialAuthDiscord {
  public readonly timeout = 30000;
  // Discord认证页面地址
  public readonly discordAuthUrl = 'https://quest.somnia.network/account';
  public somniaPage: Page;
  public walletAddress: string;

  constructor(params: ScriptExecutionContext) {
    this.somniaPage = params.context.pages()[0];
    this.walletAddress = params.accountDetail.evmWallet?.walletAddress;
  }

  public async execute(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    console.log('开始执行Somnia官网连接Discord任务...');

    const taskResult = TaskResult.create(
      params.projectId,
      params.accountGroupItemId,
    );
    const taskResultData = await taskResult.getTaskResult();

    // 检查是否已经连接过Discord
    if (taskResultData?.tasks?.authDiscord) {
      console.log('Discord 已授权，跳过执行');
      return { success: true, error: 'Discord 已授权，跳过执行' };
    }
    // 首先执行连接钱包任务
    const somniaConnect = new SomniaOfficialConnect(params);
    await somniaConnect.execute(params);

    // 连接Discord
    await this.connectDiscord(params);

    // 更新任务结果
    await taskResult.updateTaskResult({
      tasks: {
        authDiscord: true,
      },
    });
    console.log('授权 Discord 成功');
  }

  private async connectDiscord(params: ScriptExecutionContext): Promise<void> {
    const { accountDetail } = params;

    console.log('开始执行Somnia官网连接Discord任务...');

    if (!accountDetail.discordAccount || !accountDetail.discordAccount.token) {
      console.error('Discord token is missing or undefined');
      throw DiscordException.accountNotFound(
        `账号组 #${accountDetail.id} 的 Discord Token 缺失`,
        {
          discordToken: accountDetail.discordAccount?.token,
          accountId: accountDetail.id,
        },
      );
    }

    try {
      // 登录Discord
      const autoLoginDiscord = new AutoLoginDiscordTask();
      const autoLoginDiscordResult = await autoLoginDiscord.execute(params);
      if (!autoLoginDiscordResult.success) {
        throw DiscordException.authenticationFailed(
          `账号组 #${accountDetail.id} Discord 授权失败，请检查 discordToken 是否正确`,
          {
            accountId: accountDetail.id,
            discordAccount: accountDetail.discordAccount,
          },
        );
      }

      // 切换回Somnia页面
      await this.somniaPage.bringToFront();

      // 等待页面加载完成
      await waitForPageLoad(this.somniaPage, {
        url: this.discordAuthUrl,
        requiredAnySelectors: ['div#discord button:has-text("Connect")'],
        timeout: this.timeout,
      });

      // 检查Discord连接按钮是否存在
      await isElementVisible({
        page: this.somniaPage,
        selector: 'div#discord button:has-text("Connect")',
        timeout: this.timeout,
      });
      // 点击连接按钮
      console.log('点击Discord连接按钮');
      await this.somniaPage
        .locator('div#discord button:has-text("Connect")')
        .click({
          timeout: this.timeout,
        });

      // 等待重定向到Discord授权页面
      await this.somniaPage.waitForURL(/discord\.com\/oauth2\/authorize/, {
        timeout: this.timeout,
      });

      try {
        // 等待Discord授权页面加载
        await this.somniaPage.waitForSelector('.applicationDetails__94ab2', {
          state: 'visible',
          timeout: this.timeout,
        });

        // 滚动到授权按钮位置
        await this.somniaPage.evaluate(() => {
          const element = document.querySelector('.applicationDetails__94ab2');
          if (element) element.scrollIntoView();
        });
      } catch (error) {
        console.log('未找到元素进行滚动，继续执行');
      }

      // 点击授权按钮
      const OAuthConsentButton = this.somniaPage.locator(
        'button:has-text("Authorize")',
      );

      await OAuthConsentButton.waitFor({
        timeout: this.timeout,
      });

      console.log('开始授权Discord');
      await OAuthConsentButton.click();

      // 等待重定向回Somnia官网
      console.log('等待重定向完成...');
      try {
        // 设置更长的超时时间，确保有足够时间进行重定向
        const redirectTimeout = this.timeout * 1.5;

        // 等待URL变化到非Discord的域名
        const startTime = Date.now();
        let currentUrl = this.somniaPage.url();
        let redirectSuccessful = false;

        // 最多等待redirectTimeout时间，每500ms检查一次URL
        while (Date.now() - startTime < redirectTimeout) {
          await this.somniaPage.waitForTimeout(500);

          // 获取当前URL并检查是否已经重定向
          const newUrl = this.somniaPage.url();
          console.log('当前URL:', newUrl);

          // 检查URL是否变化且不再是Discord域
          if (newUrl !== currentUrl && !newUrl.includes('discord.com')) {
            console.log('检测到URL变化且离开Discord域，重定向成功');
            redirectSuccessful = true;
            break;
          }

          // 如果URL包含error参数，认为授权失败
          if (newUrl.includes('error')) {
            throw DiscordException.authenticationFailed(
              `账号组 #${accountDetail.id} 授权失败，请检查 discord token 是否正确`,
              {
                currentUrl: newUrl,
                accountId: accountDetail.id,
                discordAccount: accountDetail.discordAccount,
              },
            );
          }

          currentUrl = newUrl;
        }

        // 检查最终的重定向状态
        if (!redirectSuccessful) {
          throw DiscordException.authenticationFailed(
            `账号组 #${accountDetail.id} 授权超时，仍停留在Discord页面，可能授权按钮点击失败或Discord授权流程发生变化`,
            {
              currentUrl: this.somniaPage.url(),
              accountId: accountDetail.id,
              discordAccount: accountDetail.discordAccount,
            },
          );
        }
        const discordElement = this.somniaPage.locator('#discord input');
        await discordElement.waitFor({
          state: 'visible',
          timeout: this.timeout,
        });
        const discordValue = await discordElement.getAttribute('value');
        console.log('授权的Discord账号昵称：', discordValue);
        if (!discordValue) {
          throw DiscordException.authenticationFailed(
            `账号组 #${accountDetail.id} 授权失败，请检查 discord token 是否正确`,
            {
              currentUrl: this.somniaPage.url(),
              accountId: accountDetail.id,
              discordAccount: accountDetail.discordAccount,
            },
          );
        }

        console.log('Discord连接成功');
      } catch (profileError) {
        console.error('重定向或授权过程出错:', profileError.message);
        throw DiscordException.verificationFailed(
          `账号组 #${accountDetail.id} 授权失败`,
          {
            currentUrl: this.somniaPage.url(),
            originalError: profileError.toString(),
            accountId: accountDetail.id,
            discordAccount: accountDetail.discordAccount,
          },
        );
      }
    } catch (error) {
      console.error('授权 Discord 失败', error);

      if (error.toString().includes('load')) {
        throw FallbackException.pageLoadFailed(
          `账号组 #${accountDetail.id} 页面加载失败`,
          {
            originalError: error.toString(),
            accountId: accountDetail.id,
            discordToken: accountDetail.discordAccount.token,
            currentUrl: this.somniaPage.url(),
          },
        );
      }
      throw DiscordException.verificationFailed(
        `账号组 #${accountDetail.id} 授权失败`,
        {
          originalError: error.toString(),
          accountId: accountDetail.id,
          discordToken: accountDetail.discordAccount.token,
        },
      );
    }
  }
}
