// 给页面上的内容点赞
import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import { waitForPageLoad } from '@lulucat/tdk/browser';
import AbsBase from './base';
import {
  FallbackException,
  XException,
  WalletException,
} from '@lulucat/exceptions';

export default class DiscoverVote extends AbsBase {
  public readonly discoverUrl = 'https://portal.abs.xyz/discover';

  constructor(params: ScriptExecutionContext) {
    super(params);
  }

  /**
   * 验证页面是否有效，如果无效则创建新页面
   */
  private async ensureValidPage(context: any): Promise<void> {
    try {
      // 检查页面是否存在且有效
      if (!this.absPage || this.absPage.isClosed()) {
        // 获取所有打开的页面
        const pages = await context.pages();

        // 如果有页面，使用第一个
        if (pages.length > 0) {
          console.log(`找到 ${pages.length} 个打开的页面，使用第一个`);
          this.absPage = pages[0];
        } else {
          // 如果没有页面，创建一个新页面
          console.log('没有找到打开的页面，创建新页面');
          this.absPage = await context.newPage();
        }
      }

      // 再次确认页面有效
      if (!this.absPage || this.absPage.isClosed()) {
        throw FallbackException.pageLoadFailed('无法获取或创建有效的页面', {
          accountId: this.accountDetail.accountId,
        });
      }

      console.log('页面验证成功，页面有效');
    } catch (error) {
      console.error('确保页面有效时出错:', error);
      throw error;
    }
  }

  public async execute(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    const { context } = params;
    // 如果已点赞，则直接返回
    const taskResult = await this.taskResult.getTaskResult();

    if (!taskResult?.tasks.authX) {
      throw XException.authenticationFailed('X 未认证，跳过执行', {
        accountDetail: this.accountDetail.id,
        walletId: this.accountDetail.evmWallet.walletId,
      });
    }
    if (!taskResult.tasks.evmTransferABS) {
      throw WalletException.transactionFailed('没有执行EVM转账ABS', {
        accountId: this.accountDetail.id,
        walletId: this.accountDetail.evmWallet.walletId,
      });
    }

    if (taskResult?.tasks.discoverVote) {
      console.log('发现点赞任务已完成，跳过执行');
      return { success: true, error: '点赞任务已完成，跳过执行' };
    }
    this.absPage = await context.pages()[0];
    // 确保有有效的页面
    await this.ensureValidPage(context);

    console.log('开始登录或注册');
    await this.loginOrRegister(params);

    console.log('登录完成，开始执行发现和选择标签任务');
    const result = await this.discoverAndSelectTags(params);

    // 点赞完成后，确认是否成功获取了徽章
    console.log('点赞完成，检查是否成功获取点赞徽章...');
    const hasVoteBadge = await this.badgeChecker?.checkBadges(['discoverVote']);
    if (!hasVoteBadge) {
      console.warn('未检测到点赞徽章，点赞可能未成功，请稍后再试');
      throw new FallbackException('未检测到点赞徽章，任务可能未成功', {
        accountId: this.accountDetail.id,
      });
    }
    console.log('成功获取点赞徽章，任务完成');

    return result;
  }

  /**
   * 检查并关闭可能出现的任何模态对话框
   * @returns 如果成功关闭模态框返回true，否则返回false
   */
  private async closeModalIfPresent(): Promise<boolean> {
    try {
      // 检查特定的模态对话框元素是否存在
      const modalCloseButtonSelector =
        'div[role="button"][aria-label="Close modal"]';
      const isModalPresent = await this.absPage.isVisible(
        modalCloseButtonSelector,
        { timeout: 5000 },
      );
      if (isModalPresent) {
        console.log('发现模态对话框，尝试关闭');

        // 尝试点击关闭按钮
        await this.absPage.click(modalCloseButtonSelector, { force: true });

        // 等待模态框消失
        await this.absPage
          .waitForSelector(modalCloseButtonSelector, {
            state: 'hidden',
            timeout: 5000,
          })
          .catch(() => console.log('等待模态框消失超时，继续执行'));

        console.log('模态对话框已关闭或消失');
        return true;
      }

      // 检查其他可能的模态对话框形式
      const genericModalSelectors = [
        '.styles_backdrop__KYDuC',
        '.styles_modal__LNR7_',
        '[class*="modal"]',
        '[id="modal-root"] > div',
        '.styles_background__PKLer',
      ];

      for (const selector of genericModalSelectors) {
        if (await this.absPage.isVisible(selector, { timeout: 1000 })) {
          console.log(`发现模态元素 ${selector}，尝试关闭`);

          // 尝试按ESC键关闭
          await this.absPage.keyboard.press('Escape');
          await this.absPage.waitForTimeout(1000);

          // 尝试直接点击背景关闭模态框
          if (await this.absPage.isVisible(selector)) {
            try {
              await this.absPage.click(selector, {
                force: true,
                position: { x: 10, y: 10 },
                timeout: 3000,
              });
              await this.absPage.waitForTimeout(1000);
            } catch (error) {
              console.log(`点击模态元素 ${selector} 失败，尝试其他方法`);
              // 尝试再次按ESC
              await this.absPage.keyboard.press('Escape');
              await this.absPage.waitForTimeout(1000);
            }
          }

          if (!(await this.absPage.isVisible(selector))) {
            console.log('模态元素已关闭');
            return true;
          }
        }
      }

      console.log('页面上未发现模态对话框');
      return false;
    } catch (error) {
      console.error('关闭模态对话框时出错:', error);
      return false;
    }
  }

  /**
   * 安全点击元素，处理可能的拦截和异常
   */
  private async safeClick(
    selector: string,
    description: string,
    options = {},
  ): Promise<boolean> {
    try {
      console.log(`尝试点击 ${description}`);
      await this.absPage.click(selector, {
        force: true,
        timeout: 5000,
        ...options,
      });
      console.log(`成功点击 ${description}`);
      return true;
    } catch (error) {
      console.log(`点击 ${description} 失败: ${error.message}`);
      // 检查并处理模态框
      await this.closeModalIfPresent();
      return false;
    }
  }

  private async discoverAndSelectTags(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    console.log('开始浏览和选择标签');
    const { context, accountDetail } = params;
    let retryCount = 0;
    const maxRetries = 3;

    try {
      // 确保页面有效
      await this.ensureValidPage(context);

      // 导航到 discover 页面
      try {
        await waitForPageLoad(this.absPage, {
          url: this.discoverUrl,
          requiredAnySelectors: ['h2:has-text("Spotlight Apps")'],
        });
        console.log('发现页面加载完成');
      } catch (navigateError) {
        throw FallbackException.pageLoadFailed('页面加载失败', {
          accountDetail,
        });
      }
      console.log('检查是否已存在点赞徽章...');
      const hasVoteBadge = await this.badgeChecker?.checkBadges([
        'discoverVote',
      ]);
      if (hasVoteBadge) {
        console.log('检测到已有点赞徽章，更新状态并跳过执行');
        await this.taskResult.updateTaskResult({
          tasks: {
            discoverVote: true,
          },
        });
        return;
      }

      await this.checkSkipButton();
      // 页面加载后先处理可能出现的模态对话框
      await this.closeModalIfPresent();

      console.log('已导航到发现页面，等待标签加载');
      await this.closeModalIfPresent();

      // 使用locator而不是elementHandle来点击标签
      const tagSelector = '.styles_appItem__2SZK_ .styles_tag__r4Ygt';

      // 等待标签元素加载
      await this.absPage
        .waitForSelector(tagSelector, { timeout: 10000 })
        .catch(() => console.log('等待标签元素超时，尝试继续执行'));

      while (retryCount < maxRetries) {
        try {
          // 获取所有标签
          const tagCount = await this.absPage.locator(tagSelector).count();
          console.log(`找到 ${tagCount} 个标签`);

          if (tagCount === 0) {
            console.log('未找到任何标签，刷新页面重试');
            await this.absPage.reload();
            await this.absPage.waitForTimeout(3000);
            retryCount++;
            continue;
          }

          // 点击前3个标签（如果有）
          for (let i = 0; i < Math.min(3, tagCount); i++) {
            // 先确保没有模态框
            await this.closeModalIfPresent();

            // 使用nth选择器直接点击
            const clicked = await this.safeClick(
              `${tagSelector} >> nth=${i}`,
              `标签 ${i + 1}`,
            );

            if (clicked) {
              console.log(`成功点击了标签 ${i + 1}`);
              await this.absPage.waitForTimeout(1000);
            } else {
              console.log(`点击标签 ${i + 1} 失败，尝试继续`);
            }

            // 每次点击后检查和关闭模态框
            await this.closeModalIfPresent();
          }

          // 尝试点击Continue按钮
          try {
            await this.closeModalIfPresent();
            const continueButton = this.absPage.locator(
              'button:has-text("Continue")',
            );

            if (await continueButton.isVisible({ timeout: 5000 })) {
              await continueButton.click({ timeout: this.timeout });
              console.log('成功点击Continue按钮');
            } else {
              console.log('Continue按钮未出现或不可见，继续执行');
            }
          } catch (error) {
            console.log('点击Continue按钮失败，继续执行');
          }

          // 如果成功执行到这里，跳出循环
          break;
        } catch (error) {
          console.log(`第 ${retryCount + 1} 次尝试失败: ${error.message}`);
          retryCount++;

          if (retryCount >= maxRetries) {
            throw FallbackException.pageLoadFailed(
              `选择标签失败，已重试 ${maxRetries} 次`,
              {
                accountDetail,
              },
            );
          }

          // 刷新页面重试
          await this.absPage.reload();
          await this.absPage.waitForTimeout(3000);
        }
      }

      // 等待3秒
      await this.absPage.waitForTimeout(3000);
      // 更新任务状态
      console.log('点赞任务已完成，更新数据库中');
      await this.taskResult.updateTaskResult({
        tasks: {
          discoverVote: true,
        },
      });
      console.log('更新数据库完成');
      return;
    } catch (error) {
      console.error('选择标签失败:', error);
      throw FallbackException.executionFailed('执行点赞失败', {
        error: error,
        accountId: accountDetail.id,
        accountAddress: accountDetail.evmWallet,
      });
    }
  }
}
