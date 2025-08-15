import { Inject, Injectable, Logger } from '@nestjs/common';
import { TaskQueueJob, AccountTaskContext } from '../types';
import { TaskWorkerService } from '../workers/task-worker.service';
import { TasksService } from '../../tasks/tasks.service';
import { TaskStatus } from '../../tasks/entities/task.entity';
import { TaskLogsService } from '../../task-logs/task-logs.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as Queue from 'better-queue';
import type { ProcessFunctionCb } from 'better-queue';
import { TaskEngineException } from '@lulucat/exceptions';

@Injectable()
export class TaskQueueService {
  @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger;
  private readonly taskLogMap: Map<string, number> = new Map();
  public readonly queueMap: Map<number, Queue<TaskQueueJob>> = new Map();
  private readonly contextMap: Map<number, AccountTaskContext[]> = new Map();

  constructor(
    private readonly taskWorkerService: TaskWorkerService,
    private readonly tasksService: TasksService,
    private readonly taskLogsService: TaskLogsService,
  ) {}

  /**
   * 批量添加任务到队列
   */
  async addBulk(contexts: AccountTaskContext[]): Promise<void> {
    const { taskId, userId, config } = contexts[0];

    const queue = new Queue(this.process.bind(this), {
      concurrent: config.threadCount,
    });

    this.queueMap.set(taskId, queue);
    this.contextMap.set(taskId, contexts);

    // 监听队列事件
    queue.on('task_started', this.onStarted.bind(this));
    queue.on('task_finish', this.onFinished.bind(this));
    queue.on('task_failed', this.onFailed.bind(this));
    queue.on('task_progress', this.onProgress.bind(this));
    queue.on('drain', this.onDrain.bind(this, contexts[0]));

    // 添加任务到队列
    contexts.forEach((context) => {
      queue.push({
        id: context.id,
        taskId: context.taskId,
        context,
      });
    });

    this.logger.debug(`批量添加任务到队列完成: ${contexts.length} 个`);

    // 更新任务状态为运行中
    try {
      await this.tasksService.updateStatus(taskId, TaskStatus.RUNNING, userId);
      this.logger.debug(`任务 #${taskId} 状态已更新为运行中`);
    } catch (error) {
      this.logger.error(`更新任务 #${taskId} 状态失败: ${error.message}`);
    }
  }

  /**
   * 处理队列中的任务
   */
  async process(
    job: TaskQueueJob,
    callback: ProcessFunctionCb<TaskQueueJob>,
  ): Promise<void> {
    const { context } = job;

    try {
      // 执行任务
      await this.taskWorkerService.execute(context);
      callback(null, job);
    } catch (error) {
      callback(error, job);
    }
  }

  async onStarted(id: number, job: TaskQueueJob): Promise<void> {
    const { taskId, context } = job;

    this.logger.debug(
      `任务 #${taskId} (${context.accountGroupItemId}) 开始执行`,
    );

    try {
      // 更新任务日志为运行，如果日志不存在则创建
      const taskLog = await this.taskLogsService.update(
        taskId,
        context.accountGroupItemId,
        {
          status: TaskStatus.RUNNING,
          logs: '',
          errorMessage: '',
          errorCode: '',
        },
        context.userId,
      );

      // 保存日志ID以便后续更新
      const logKey = `${taskId}:${context.accountGroupItemId}`;
      this.taskLogMap.set(logKey, taskLog.id);

      // 记录开始日志
      await this.taskLogsService.appendLog(
        taskLog.id,
        `任务 #${taskId} (${context.accountGroupItemId}) 开始执行...`,
        context.userId,
      );
    } catch (error) {
      this.logger.error(`创建任务日志失败: ${error.message}`);
    }
  }

  async onFinished(id: number, job: TaskQueueJob): Promise<void> {
    const { taskId, context } = job;

    this.logger.debug(`任务 #${taskId} (${context.accountGroupItemId}) 已完成`);

    try {
      // 更新任务日志
      const logKey = `${taskId}:${context.accountGroupItemId}`;
      const logId = this.taskLogMap.get(logKey);

      if (logId) {
        // 添加完成日志
        await this.taskLogsService.appendLog(
          logId,
          `任务 #${taskId} (${context.accountGroupItemId}) 执行完成`,
          context.userId,
        );

        // 更新日志状态为完成
        await this.taskLogsService.complete(
          logId,
          TaskStatus.COMPLETED,
          context.userId,
        );

        // 清理日志ID映射
        this.taskLogMap.delete(logKey);
      } else {
        this.logger.error(`更新任务日志失败: 日志ID不存在`);
      }
    } catch (error) {
      this.logger.error(`更新任务日志失败: ${error.message}`);
    }
  }

  async onFailed(id: number, error: TaskEngineException): Promise<void> {
    const [taskId, accountGroupItemId] = id.toString().split('-').map(Number);
    const context = this.contextMap
      .get(taskId)
      .find((job) => job.accountGroupItemId === accountGroupItemId);

    this.logger.error(
      `任务 #${taskId} (${accountGroupItemId}) 失败: ${error.code} - ${error.message}`,
    );

    try {
      // 更新任务日志
      const logKey = `${taskId}:${accountGroupItemId}`;
      const logId = this.taskLogMap.get(logKey);

      if (logId) {
        // 添加失败日志
        await this.taskLogsService.appendLog(
          logId,
          `任务 #${taskId} (${accountGroupItemId}) 执行失败: ${error.code} - ${error.message}`,
          context.userId,
        );

        // 更新日志状态为失败，并记录错误信息
        await this.taskLogsService.update(
          taskId,
          accountGroupItemId,
          {
            status: TaskStatus.FAILED,
            errorMessage: error.message,
            errorCode: error.code?.toString() || '',
          },
          context.userId,
        );

        // 清理日志ID映射
        this.taskLogMap.delete(logKey);
      } else {
        this.logger.error(`更新任务日志失败: 日志ID不存在`);
      }
    } catch (logError) {
      this.logger.error(`更新任务日志失败: ${logError.message}`);
    }
  }

  async onDrain(data: AccountTaskContext): Promise<void> {
    this.logger.debug(`任务 #${data.taskId} 队列已清空`);

    try {
      await this.tasksService.updateStatus(
        data.taskId,
        TaskStatus.COMPLETED,
        data.userId,
      );
      this.logger.debug(`任务 #${data.taskId} 状态已更新为已完成`);
    } catch (error) {
      this.logger.error(`更新任务状态失败: ${error.message}`);
    }
  }

  async onProgress(
    id: number,
    job: TaskQueueJob,
    completed: number,
    total: number,
  ): Promise<void> {
    const { taskId, context } = job;

    this.logger.debug(
      `任务 #${taskId} (${context.accountGroupItemId}) 进度: ${completed}/${total}`,
    );

    try {
      // 更新任务日志，记录进度
      const logKey = `${taskId}:${context.accountGroupItemId}`;
      const logId = this.taskLogMap.get(logKey);

      if (logId) {
        // 添加进度日志
        await this.taskLogsService.appendLog(
          logId,
          `任务进度: ${completed}/${total}`,
          context.userId,
        );
      } else {
        this.logger.error(`更新任务日志失败: 日志ID不存在`);
      }
    } catch (error) {
      this.logger.error(`更新任务日志失败: ${error.message}`);
    }
  }
}
