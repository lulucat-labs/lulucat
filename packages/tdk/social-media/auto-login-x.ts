import { ScriptExecutionContext } from '../types';

export class AutoLoginXTask {
  /**
   * 执行任务：自动登录 X
   * @param params 执行参数，包含浏览器上下文和任务配置
   * @returns 任务执行结果
   */
  public async execute(params: ScriptExecutionContext): Promise<void> {
    const { context, accountDetail } = params;
    console.log(`X token: ${accountDetail.twitterAccount.token}`);

    console.log('开始写入cookie', context.addCookies);

    try {
      await context.addCookies([
        {
          name: 'auth_token',
          value: accountDetail.twitterAccount.token,
          domain: '.x.com',
          path: '/',
          secure: true,
          sameSite: 'None',
        },
      ]);
      await context.addCookies([
        {
          name: 'auth_token',
          value: accountDetail.twitterAccount.token,
          domain: '.twitter.com',
          path: '/',
          secure: true,
          sameSite: 'None',
        },
      ]);
      // 写入cookie
      console.log('写入cookie成功');
    } catch (error) {
      throw new Error(`执行任务失败: ${error.message}`);
    }
  }
}
