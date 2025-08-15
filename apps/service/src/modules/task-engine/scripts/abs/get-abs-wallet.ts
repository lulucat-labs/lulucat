import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import AbsBase from './base';

export default class AbsGetWallet extends AbsBase {
  constructor(params: ScriptExecutionContext) {
    super(params);
  }
  /**
   * 执行任务：访问 abs 页面，执行任务
   * @param params 执行参数，包含浏览器上下文和任务配置
   * @returns 任务执行结果
   */
  public async execute(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    const { context } = params;

    const taskResult = await this.taskResult.getTaskResult();
    console.log('taskResult', taskResult);
    if (taskResult?.tasks.registerABS) {
      console.log('[JSON DB] 账号已注册，跳过该任务');
      return {
        success: true,
      };
    }

    this.absPage = await context.pages()[0];

    await this.loginOrRegister(params);
    await this.checkSkipButton();

    await this.getInnerWallet();
  }

  private async getInnerWallet() {
    await this.checkSkipButton();
    await this.absPage.click('div[class*="styles_copyButton"]');
    console.log('Copy 按钮已点击');

    // 点击 copy 按钮后，内容被复制到剪贴板，等待 1 秒
    await this.absPage.waitForTimeout(1000);

    // 获取剪贴板内容
    const walletAddress = await this.absPage.evaluate(() => {
      return navigator.clipboard.readText();
    });

    console.log('钱包地址', walletAddress);

    try {
      console.log('开始点击 I understand 按钮');
      await this.absPage.click('span:has-text("I understand")', {
        timeout: 10000,
      });
      console.log('点击 I understand 成功');
    } catch (error) {
      console.error('点击 I understand 失败，继续执行');
    }

    // 获取剪贴板内容
    let walletKey = '';
    try {
      // 获取第二个 button[class*="styles_userControl"]
      const userControlButtons = await this.absPage
        .locator('button[class*="styles_userControl"]')
        .all();
      if (userControlButtons.length > 1) {
        await userControlButtons[1].click();
      } else {
        console.error('没有找到第二个 userControl 按钮');
      }

      await this.absPage.click(
        'xpath=//*[@id="modal-root"]/aside/div[2]/section/div/div/div/section/div/article[4]/button/span',
      );
      console.log('点击 export wallet 按钮成功');

      await this.absPage.click('button:has-text("Yes, export")');
      console.log('点击 Yes, export 按钮成功');

      await this.absPage
        .frameLocator('iframe[allow="clipboard-write self *"]')
        .locator('button:has-text("Copy Key")')
        .click();
      console.log('点击 Copy Key 按钮成功');
      walletKey = await this.absPage.evaluate(() => {
        return navigator.clipboard.readText();
      });
      console.log('钱包私钥', walletKey);
    } catch (error) {
      console.error('获取钱包私钥失败，将使用空值继续', error);
      // 继续执行，使用空私钥
    }

    try {
      console.log('[JSON DB] 开始更新账号数据');
      await this.insertInnerWallet({ walletAddress, walletKey });
      console.log('[JSON DB] 更新账号数据成功');
    } catch (error) {
      console.error('[JSON DB] 更新账号数据失败', error);
      throw error;
    }
  }
}
