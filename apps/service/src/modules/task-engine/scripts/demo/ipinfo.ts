import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';

export default class IPInfo {
  /**
   * 浏览器代理IP测试
   * @param params 执行参数，包含浏览器上下文和任务配置
   * @returns 任务执行结果
   */
  public async execute(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    const { context } = params;

    const page = await context.newPage();
    await page.goto('https://ipinfo.io/what-is-my-ip');

    // 等待10分钟
    await page.waitForTimeout(10 * 60 * 1000);

    return {
      success: true,
    };
  }
}
