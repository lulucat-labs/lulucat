import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import { waitForPageLoad } from '@lulucat/tdk/browser';
import { AutoLoginXTask } from '@lulucat/tdk/social-media';
import AbsBase from './base';
import { XException, WalletException } from '@lulucat/exceptions';

export default class AuthX extends AbsBase {
  private readonly absRewardsUrl = 'https://abs.xyz/rewards';
  constructor(params: ScriptExecutionContext) {
    super(params);
  }

  public async execute(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    const { context, accountDetail } = params;
    const taskResult = await this.taskResult.getTaskResult();
    if (taskResult?.tasks.authX) {
      console.log('X 已授权，跳过执行');
      return;
    }
    this.absPage = await context.pages()[0];
    if (!accountDetail.twitterAccount || !accountDetail.twitterAccount.token) {
      throw XException.accountNotFound(
        `账号组 #${accountDetail.id} 的 Twitter Token 缺失`,
        {
          accountId: accountDetail.id,
          twitterAccount: accountDetail.twitterAccount,
        },
      );
    }
    console.log(taskResult);
    if (!taskResult.absWallet.address) {
      throw WalletException.walletNotFound(
        `账号组 #${accountDetail.id} 的 Abs 钱包不存在`,
        {
          accountId: accountDetail.id,
          evmWallet: accountDetail.evmWallet,
          absWallet: taskResult?.absWallet,
        },
      );
    }

    await this.loginOrRegister(params);

    await this.connectX(params);
    
    // 授权流程结束后，确认是否成功获取了徽章
    console.log('授权完成，检查是否成功获取X徽章...');
    const hasXBadge = await this.badgeChecker?.checkBadges(['authX']);
    if (!hasXBadge) {
      throw XException.authenticationFailed('未获取到X徽章，授权可能未成功', {
        accountId: accountDetail.id,
        twitterAccount: accountDetail.twitterAccount,
      });
    }
    console.log('成功获取X徽章，任务完成');
    
    return {
      success: true,
      error: 'X授权完成',
    };
  }

  private async connectX(params: ScriptExecutionContext) {
    const { accountDetail } = params;
    await waitForPageLoad(this.absPage, {
      url: this.absRewardsUrl,
      requiredAnySelectors: ['h3:has-text("Badges")'],
    });
    console.log('abs 页面加载完成');
        // 登录后检查是否已有X徽章，如果有则直接跳过执行
    console.log('检查是否已存在X徽章...');
    const hasXBadge = await this.badgeChecker?.checkBadges(['authX']);
    if (hasXBadge) {
      console.log('检测到已有X徽章，更新状态并跳过执行');
      await this.taskResult.updateTaskResult({
        tasks: {
          authX: true,
        },
      });
      return
    }
    await this.checkSkipButton();
    const autoLoginX = new AutoLoginXTask();
    await autoLoginX.execute(params);

    // 如果没有这个按钮，则代表已授权
    const connectButton = this.absPage.locator('span:has-text("Connect")');
    const isConnectButtonVisible = await connectButton.isVisible({ timeout: this.timeout }).catch(() => false);
    
    if (isConnectButtonVisible) {
      // 按钮存在，需要点击
      await this.absPage.locator('span:has-text("Connect")').click({
        timeout: this.timeout,
        force: true
      });
      

    } else {
      await this.taskResult.updateTaskResult({
        xToken: accountDetail.twitterAccount?.token,
        tasks: {
          authX: true,
        },
      });
      return {
        success: true,
        error: 'X 已授权，跳过执行',
      };
    }

    let buttonRetryCount = 0;
    const buttonMaxRetries = 2;

    while (buttonRetryCount < buttonMaxRetries) {
      try {
        await this.absPage
          .locator('button[data-testid="OAuth_Consent_Button"]')
          .click({
            timeout: this.timeout,
          });
        console.log('X 授权按钮已点击');
        break; // 点击成功后跳出循环
      } catch (error) {
        buttonRetryCount++;
        console.error(`X 授权按钮未找到(第${buttonRetryCount}次尝试)`, error);

        if (buttonRetryCount >= buttonMaxRetries) {
          throw XException.authenticationFailed(`已经重试 ${buttonRetryCount} 次，X 授权失败`, {
            accountId: accountDetail.id,
            twitterAccount: accountDetail.twitterAccount,
          });
        }

        console.log('刷新页面后重试...');
        try {
          await this.absPage.reload({ timeout: this.timeout });
          await this.absPage.waitForLoadState('networkidle', {
            timeout: this.timeout,
          });
        } catch {
          throw XException.authenticationFailed('刷新X页面失败', {
            accountId: accountDetail.id,
            twitterAccount: accountDetail.twitterAccount,
          });
        }
      }
    }

    // 等待页面重定向回来
    let retryCount = 0;
    const maxRetries = 3;
    while (retryCount < maxRetries) {
      // https://portal.abs.xyz/rewards
      try {
        await this.absPage.waitForURL(/portal\.abs\.xyz\/rewards/, {
          timeout: this.timeout,
        });
        break;
      } catch (error) {
        console.error(`等待页面重定向失败(第${retryCount + 1}次尝试)`, error);
        retryCount++;
        if (retryCount === maxRetries) {
          throw XException.authenticationFailed('X 授权失败', {
            accountId: accountDetail.id,
            twitterAccount: accountDetail.twitterAccount,
          });
        }
      }
    }

    try {
      await this.taskResult.updateTaskResult({
        xToken: accountDetail.twitterAccount?.token ?? '没找到token',
        tasks: {
          authX: true,
        },
      });
      console.log('更新数据库成功');
    } catch (error) {
      console.error('更新数据库失败', error);
      throw XException.authenticationFailed('更新数据库失败', {
        accountId: accountDetail.id,
        twitterAccount: accountDetail.twitterAccount,
      });
    }

    return {
      success: true,
      error: '连接 X 完成',
    };
  }
}
