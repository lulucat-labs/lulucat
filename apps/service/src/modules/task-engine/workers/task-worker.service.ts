import { join } from 'path';
import { BrowserContext } from 'patchright';
import { AccountTaskContext } from '../types';
import { BrowserContextService } from '../browser-context/browser-context.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class TaskWorkerService {
  @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger;

  constructor(private readonly browserContextService: BrowserContextService) {}

  /**
   * 执行任务脚本
   */
  private async executeScript(
    scriptPath: string,
    userId: number,
    projectId: number,
    taskId: number,
    context: BrowserContext,
    taskContext: AccountTaskContext,
    accountGroupItemId: number,
    accountDetail: any,
  ): Promise<void> {
    try {
      this.logger.debug(`开始执行脚本: ${scriptPath}`);
      const absolutePath = join(__dirname, '..', 'scripts', scriptPath);
      this.logger.debug(`脚本绝对路径: ${absolutePath}`);

      const scriptModule = await import(absolutePath);
      const scriptExecutionContext = {
        context,
        userId,
        projectId,
        taskId,
        taskContext,
        accountGroupItemId,
        accountDetail,
        baseDir: process.cwd(),
      };

      const script = new scriptModule.default(scriptExecutionContext);

      // 执行脚本
      this.logger.debug(
        `正在执行脚本 ${scriptPath}, accountGroupItemId: ${accountGroupItemId}`,
      );
      const result = await script.execute(scriptExecutionContext);

      this.logger.debug(`脚本执行成功，返回结果: ${scriptPath}`, result);
    } catch (error) {
      this.logger.error(`脚本执行失败: ${scriptPath}`, error);
      throw error;
    }
  }

  /**
   * 执行任务
   */
  async execute(taskContext: AccountTaskContext): Promise<void> {
    let browserContext: BrowserContext | null = null;
    try {
      const {
        projectId,
        taskId,
        accountGroupItemId,
        scriptPaths,
        accountDetail,
        userId,
      } = taskContext;

      this.logger.debug(
        `开始执行任务 - ProjectId: ${projectId}, TaskId: ${taskId}, accountGroupItemId: ${accountGroupItemId}`,
      );
      this.logger.debug(`待执行脚本数量: ${scriptPaths.length}`);

      browserContext =
        await this.browserContextService.createBrowserContext(taskContext);

      // 执行所有脚本
      for (const scriptPath of scriptPaths) {
        this.logger.debug(
          `执行脚本 ${scriptPath} [${scriptPaths.indexOf(scriptPath) + 1}/${scriptPaths.length}]`,
        );
        await this.executeScript(
          scriptPath,
          userId,
          projectId,
          taskId,
          browserContext,
          taskContext,
          accountGroupItemId,
          accountDetail,
        );
      }

      this.logger.debug(
        `任务执行完成 - ProjectId: ${projectId}, TaskId: ${taskId}, accountGroupItemId: ${accountGroupItemId}`,
      );
    } catch (error) {
      throw error;
    } finally {
      if (browserContext) {
        this.logger.debug('正在关闭浏览器上下文');
        await browserContext.close();
      }
    }
  }
}
