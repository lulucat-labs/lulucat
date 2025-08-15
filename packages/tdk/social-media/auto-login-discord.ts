import { ScriptExecutionContext, ScriptExecutionResult } from '../types';
import { waitForPageLoad } from '../browser/wait-for-page-load';
/**
 * Discord 自动登录任务类
 * 使用 token 进行自动登录
 */
export class AutoLoginDiscordTask {
  /**
   * 执行任务：自动登录 Discord
   * @param params 执行参数，包含浏览器上下文和任务配置
   * @returns 任务执行结果
   */
  private readonly timeout = 30000;
  public async execute(params: ScriptExecutionContext): Promise<ScriptExecutionResult> {
    const { context, accountDetail } = params;
    const { token } = accountDetail.discordAccount;

    console.log('开始执行 Discord 自动登录任务');
    try {
      const discordAuthExtUrl = `chrome-extension://kfjglmgfjedhhcddpfgfogkahmenikan/popup/index.html`;
      // 打开一个新窗口
      const discordPage = await context.newPage();
      await waitForPageLoad(discordPage, {
        url: discordAuthExtUrl,
        timeout: this.timeout,
        requiredSelectors: [discordPage.locator('#submit')],
      });
      console.log('已找到#submit按钮，准备输入token');
      // 在 #token 输入框输入 token
      await discordPage.locator('#token').fill(token);
      console.log('已输入token，准备点击#submit按钮');
      // 点击 #submit 按钮
      await discordPage.locator('#submit').click();
      console.log('已点击#submit按钮，准备等待重定向');
      // 如果打开新窗口了，则代表登录成功
      const newPage = await discordPage.context().waitForEvent('page');
      await newPage.waitForLoadState('load');
      console.log('discord 登录完成');
      return {
        success: true,
        error: 'discord 登录完成',
      };

    } catch (error) {
      throw new Error(`Discord 登录任务执行失败: ${error.message}`);
    }
  }
}
