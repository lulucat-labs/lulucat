import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import AbsBase from './base';
import { waitForPageLoad } from '@lulucat/tdk/browser';
import {
  FallbackException,
  WalletException,
  XException,
} from '@lulucat/exceptions';

export default class ClaimBadges extends AbsBase {
  private readonly absRewardsUrl = 'https://abs.xyz/rewards';
  private readonly insufficientEthMessage =
    'You need at least 0.0001 ETH to claim a badge.';

  constructor(params: ScriptExecutionContext) {
    super(params);
  }

  public async execute(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    const { context, accountDetail } = params;
    const taskResult = await this.taskResult.getTaskResult();

    if (!(await this.checkExistAbsWallet())) {
      console.error('abs 钱包不存在');
      throw WalletException.walletNotFound(
        `账号组 #${accountDetail.id} 的 Abs 钱包不存在`,
        {
          accountId: accountDetail.id,
          evmWallet: accountDetail.evmWallet,
          absWallet: taskResult.absWallet,
        },
      );
    }
    // 如果没授权X，跳过执行
    if (!(await this.checkAuthX())) {
      console.error('X 授权不存在');
      throw XException.authenticationFailed(
        `账号组 #${accountDetail.id} 的 X 未授权`,
        {
          accountId: accountDetail.id,
          absWallet: taskResult.absWallet,
        },
      );
    }

    // 如果没有转账到ABS
    if (!(await this.checkTransferABS())) {
      console.error('未执行转账');
      throw FallbackException.executionFailed('未执行转账', {
        accountId: accountDetail.id,
        absWallet: taskResult.absWallet,
      });
    }

    this.absPage = await context.pages()[0];

    await this.loginOrRegister(params);
    return await this.claimAvailableBadges();
  }

  private async checkBadges() {
    const badges = (await this.badgeChecker?.checkBadges()) ?? [];
    if (Array.isArray(badges)) {
      return Boolean(badges.find((i) => !i.claimed));
    }
    return false;
  }

  private async claimAvailableBadges(): Promise<ScriptExecutionResult> {
    try {
      await waitForPageLoad(this.absPage, {
        url: this.absRewardsUrl,
        requiredAnySelectors: ['h3:has-text("Badges")'],
      });
      console.log('授权页面加载完成');

      await this.checkSkipButton();
      try {
        // 如果存在 Continue 按钮，则点击
        await this.absPage.locator('button:has-text("Continue")').click({
          timeout: 3000,
        });
      } catch (error) {
        console.log('没有找到 Continue 按钮，继续执行');
      }
      // 滚动到页面底部以加载所有徽章
      await this.absPage.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // 等待所有徽章加载完成
      await this.absPage.waitForSelector('.styles_badgeContainer__OdFVP', {
        timeout: this.timeout,
      });

      let badgesProcessed = 0;
      let processingComplete = false;
      let currentBadgeRetries = 0;
      const maxRetries = 3;

      // 使用循环直到没有更多可领取的徽章
      while (!processingComplete) {
        // 每次迭代重新获取可领取的徽章按钮
        const claimableButtons = await this.absPage
          .locator('button:has(span:text("Claim"))')
          .all();
        console.log(`找到 ${claimableButtons.length} 个可领取的徽章`);

        // 如果徽章按钮不存在，则退出循环
        if (claimableButtons.length === 0 || !(await this.checkBadges())) {
          processingComplete = true;
          console.log('没有更多可领取的徽章');
          break;
        }

        // 只处理第一个可见的徽章按钮
        const firstButton = claimableButtons[0];

        try {
          // 检查按钮是否可见和可点击
          const isVisible = await firstButton.isVisible();
          if (!isVisible) {
            console.log('徽章按钮不可见，跳过');
            processingComplete = true;
            break;
          }

          await firstButton.click({ timeout: this.timeout });
          console.log('点击领取徽章按钮');

          // 等待可能出现的错误弹窗
          try {
            const errorText = await this.absPage
              .locator('text=' + this.insufficientEthMessage)
              .textContent({
                timeout: 3000,
              });

            if (errorText?.includes(this.insufficientEthMessage)) {
              console.log('ETH余额不足，无法领取徽章');
              throw WalletException.transactionFailed('ETH余额不足', {
                message: 'ETH余额不足，无法领取徽章',
              });
            }
          } catch (error) {
            console.log('未发现错误消息，继续执行');
          }

          let claimSuccess = false;
          try {
            // 检查是否存在 Claim Badge 确认按钮
            const confirmButton = this.absPage.locator(
              'button:has-text("Claim Badge")',
            );
            const confirmButtonVisible = await confirmButton.isVisible({
              timeout: 3000,
            });

            if (confirmButtonVisible) {
              console.log('点击 Claim Badge 确认按钮');
              await confirmButton.click({ timeout: this.timeout });

              // 等待确认按钮消失
              await confirmButton.waitFor({
                state: 'hidden',
                timeout: this.timeout,
              });
              console.log('徽章领取确认成功');
              claimSuccess = true;
            }
          } catch (error) {
            console.log('确认按钮点击失败或未找到确认按钮');
            claimSuccess = false;
          }

          if (claimSuccess) {
            badgesProcessed++;
            currentBadgeRetries = 0; // 重置重试次数
          } else {
            currentBadgeRetries++;
            console.log(`领取失败，当前重试次数: ${currentBadgeRetries}`);

            if (currentBadgeRetries >= maxRetries) {
              console.log(`达到最大重试次数 ${maxRetries}，跳过当前徽章`);
              currentBadgeRetries = 0; // 重置重试次数，准备处理下一个徽章
              continue;
            }

            // 等待一段时间后重试
            await this.absPage.waitForTimeout(2000);
            continue; // 重试当前徽章
          }

          // 在使用页面前检查页面是否仍然有效
          if (this.absPage && !this.absPage.isClosed()) {
            try {
              // 等待任何可能的确认弹窗消失和页面更新
              await this.absPage.waitForTimeout(3000);

              // 确保页面刷新后重新加载徽章
              if (!this.absPage.isClosed()) {
                await this.absPage.evaluate(() => {
                  window.scrollTo(0, document.body.scrollHeight);
                });
              }
            } catch (pageError) {
              console.log('页面交互错误，可能页面已关闭:', pageError.message);
              processingComplete = true;
              break;
            }
          } else {
            console.log('页面已关闭，停止处理徽章');
            processingComplete = true;
            break;
          }
        } catch (error) {
          console.error('领取徽章失败:', error);
          currentBadgeRetries++;
          console.log(`领取出错，当前重试次数: ${currentBadgeRetries}`);

          if (currentBadgeRetries >= maxRetries) {
            console.log(`达到最大重试次数 ${maxRetries}，跳过当前徽章`);
            currentBadgeRetries = 0; // 重置重试次数，准备处理下一个徽章
            continue;
          }

          // 在使用页面前检查页面是否仍然有效
          if (this.absPage && !this.absPage.isClosed()) {
            try {
              // 如果出现错误，等待一段时间后重试
              await this.absPage.waitForTimeout(2000);
              continue; // 重试当前徽章
            } catch (pageError) {
              console.log('页面交互错误，可能页面已关闭:', pageError.message);
              processingComplete = true;
              break;
            }
          } else {
            console.log('页面已关闭，停止处理徽章');
            processingComplete = true;
            break;
          }
        }
      }

      return {
        success: true,
        error:
          badgesProcessed > 0
            ? `成功处理 ${badgesProcessed} 个徽章`
            : '没有可领取的徽章',
      };
    } catch (error) {
      console.error('领取徽章过程中发生错误:', error);
      throw FallbackException.executionFailed('领取徽章过程中发生错误');
    }
  }
}
