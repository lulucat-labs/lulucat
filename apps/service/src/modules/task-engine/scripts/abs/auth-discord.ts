import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import { isElementVisible } from '@lulucat/tdk/browser';
import { AutoLoginDiscordTask } from '@lulucat/tdk/social-media';
import AbsBase from './base';
import { TaskEngineException, DiscordException } from '@lulucat/exceptions';

export default class AuthDiscord extends AbsBase {
  constructor(params: ScriptExecutionContext) {
    super(params);
  }

  public async execute(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    const { context, accountDetail } = params;
    // 如果已授权，则直接返回
    const taskResult = await this.taskResult.getTaskResult();
    if (taskResult?.tasks.authDiscord) {
      return { success: true, error: 'Discord 已授权，跳过执行' };
    }

    if (!taskResult?.tasks.authX) {
      throw DiscordException.messageFailed(
        `账号组 #${accountDetail.id} 未完成授权X任务，请先完成授权X任务`,
        {
          accountId: accountDetail.id,
          absTasks: taskResult.tasks,
        },
      );
    }

    this.absPage = await context.pages()[0];

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

    await this.loginOrRegister(params);

    const result = await this.connectDiscord(params);

    // 授权流程结束后，确认是否成功获取了徽章
    console.log('授权完成，检查是否成功获取Discord徽章...');
    const hasDiscordBadge = await this.badgeChecker?.checkBadges([
      'authDiscord',
    ]);
    if (!hasDiscordBadge) {
      throw DiscordException.authenticationFailed(
        '未获取到Discord徽章，授权可能未成功',
        {
          accountId: accountDetail.id,
          discordAccount: accountDetail.discordAccount,
        },
      );
    }
    console.log('成功获取Discord徽章，任务完成');

    return result;
  }

  private async connectDiscord(params: ScriptExecutionContext) {
    const { accountDetail } = params;

    try {
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
      // 切换浏览器页签
      await this.absPage.bringToFront();
      // 开始授权
      console.log('开始跳转到勋章页面寻找授权DC入口');
      await this.absPage.goto(this.rewardsUrl, {
        timeout: this.timeout,
      });

      // 登录后检查是否已有Discord徽章
      console.log('检查是否已存在Discord徽章...');
      const hasDiscordBadge = await this.badgeChecker?.checkBadges([
        'authDiscord',
      ]);
      if (hasDiscordBadge) {
        console.log('检测到已有Discord徽章，更新状态并跳过执行');
        await this.taskResult.updateTaskResult({
          tasks: {
            authDiscord: true,
          },
        });
        return;
      }

      await this.checkSkipButton();

      const hasConnectDiscordButton = await isElementVisible({
        page: this.absPage,
        selector: 'button:has-text("Connect Discord to get XP Boost!")',
        timeout: this.timeout,
      });

      if (!hasConnectDiscordButton) {
        await this.taskResult.updateTaskResult({
          tasks: {
            authDiscord: true,
          },
        });
        console.log('DC授权已完成，跳过执行');
        return;
      }

      console.log('点击连接 Discord');
      await this.absPage.click(
        'button:has-text("Connect Discord to get XP Boost!")',
      );

      await this.absPage.waitForURL(/discord\.com\/oauth2\/authorize/, {
        timeout: this.timeout,
      });

      await this.absPage.waitForSelector('.applicationDetails__94ab2', {
        state: 'visible',
      });

      await this.absPage.evaluate(() => {
        const element = document.querySelector('.applicationDetails__94ab2');
        if (element) element.scrollIntoView();
      });

      // 点击授权按钮， 文本内容是 Authorize
      const OAuthConsentButton = this.absPage.locator(
        'button:has-text("Authorize")',
      );

      await OAuthConsentButton.waitFor({
        timeout: this.timeout,
      });

      console.log('开始授权');
      await OAuthConsentButton.click();

      // 等待重定向回来代表完成 - 注意可能重定向到不同的URL
      console.log('等待重定向完成...');
      try {
        // 设置更长的超时时间，以确保有足够时间进行重定向
        const redirectTimeout = this.timeout * 1.5;

        // 等待URL变化到非Discord的域名
        const startTime = Date.now();
        let currentUrl = this.absPage.url();
        let redirectSuccessful = false;

        // 最多等待redirectTimeout时间，每500ms检查一次URL
        while (Date.now() - startTime < redirectTimeout) {
          await this.absPage.waitForTimeout(500);

          // 获取当前URL并检查是否已经重定向
          const newUrl = this.absPage.url();
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
          if (this.absPage.url().includes('discord.com')) {
            throw DiscordException.authenticationFailed(
              `账号组 #${accountDetail.id} 授权超时，仍停留在Discord页面，可能授权按钮点击失败或Discord授权流程发生变化`,
              {
                currentUrl: this.absPage.url(),
                accountId: accountDetail.id,
                discordAccount: accountDetail.discordAccount,
              },
            );
          }
        }

        console.log('授权后的URL:', this.absPage.url());
        await this.absPage.waitForLoadState('domcontentloaded');

        // 验证是否真的重定向到了ABS域
        if (
          !this.absPage.url().includes('portal.abs.xyz') &&
          !this.absPage.url().includes('abs.xyz')
        ) {
          console.warn(
            '警告: 未重定向到预期的ABS域，等待3s后继续执行。当前URL:',
            this.absPage.url(),
          );
        }
        // 等待3s 继续执行
        await this.absPage.waitForTimeout(3000);
        // 更新数据库标记任务完成
        await this.taskResult.updateTaskResult({
          tasks: {
            authDiscord: true,
          },
        });
        console.log('授权完成，更新数据库');
      } catch (profileError) {
        console.error('重定向或授权过程出错:', profileError.message);
        console.error('最终URL:', this.absPage.url());

        // 检查是否已经是TaskEngineException，如果是则直接抛出，否则包装成DiscordException
        if (profileError instanceof TaskEngineException) {
          throw profileError;
        } else {
          throw DiscordException.verificationFailed(
            `账号组 #${accountDetail.id} 授权失败`,
            {
              currentUrl: this.absPage.url(),
              originalError: profileError.toString(),
              accountId: accountDetail.id,
              discordAccount: accountDetail.discordAccount,
            },
          );
        }
      }
    } catch (error) {
      console.error('授权 Discord 失败', error);
      // 检查是否已经是TaskEngineException，如果是则直接抛出，否则包装成DiscordException
      if (error instanceof TaskEngineException) {
        throw error;
      } else {
        throw DiscordException.verificationFailed(
          `账号组 #${accountDetail.id} 授权失败，请检查 discord token ${accountDetail.discordAccount.token} 是否正确`,
          {
            originalError: error.toString(),
            accountId: accountDetail.id,
            discordToken: accountDetail.discordAccount.token,
          },
        );
      }
    }

    console.log('授权 Discord 完成');
    return {
      success: true,
      error: '授权 Discord 完成',
    };
  }
}
