import { Injectable } from '@nestjs/common';
import { TaskResultsService } from '../../task-results/task-results.service';
import {
  CreateTaskResultDto,
  UpdateTaskResultDto,
} from '../../task-results/dto';
import { TaskResult as TaskResultEntity } from '../../task-results/entities/task-result.entity';

/**
 * 任务结果处理类
 * 提供操作任务结果的简化方法，适用于脚本环境
 */
@Injectable()
export class TaskResult<T = any> {
  private static taskResultsService: TaskResultsService;

  /**
   * 设置共享的服务实例
   * @param service TaskResultsService 实例
   */
  public static setService(service: TaskResultsService): void {
    TaskResult.taskResultsService = service;
  }

  /**
   * 创建 TaskResult 实例的工厂方法
   * @param projectId 项目ID
   * @param accountGroupItemId 账号组条目ID
   * @returns TaskResult 实例
   */
  public static create(
    projectId: number,
    accountGroupItemId: number,
  ): TaskResult {
    if (!TaskResult.taskResultsService) {
      throw new Error(
        'TaskResultsService 未初始化，请先调用 TaskResult.setService()',
      );
    }
    return new TaskResult(
      TaskResult.taskResultsService,
      projectId,
      accountGroupItemId,
    );
  }

  constructor(
    private readonly taskResultsService: TaskResultsService,
    private readonly projectId: number,
    private readonly accountGroupItemId: number,
  ) {}

  /**
   * 获取当前项目和账号的最新任务结果
   * @returns 最新的任务结果，如果不存在则返回null
   */
  async getTaskResult(): Promise<T | null> {
    const result = await this.taskResultsService.findLatestTaskResult(
      this.projectId,
      this.accountGroupItemId,
    );
    return result?.result as T | null;
  }

  /**
   * 创建任务结果
   * @param result 任务结果数据
   * @returns 创建的任务结果
   */
  async createTaskResult(
    result: Record<string, any>,
  ): Promise<TaskResultEntity> {
    const createDto: CreateTaskResultDto = {
      projectId: this.projectId,
      accountGroupItemId: this.accountGroupItemId,
      result,
    };
    return this.taskResultsService.createTaskResult(createDto);
  }

  /**
   * 更新最新的任务结果
   * @param result 要更新的任务结果数据
   * @returns 更新后的任务结果，如果不存在原始数据则返回null
   */
  async updateTaskResult(
    result: Record<string, any>,
  ): Promise<TaskResultEntity | null> {
    const latestResult = await this.taskResultsService.findLatestTaskResult(
      this.projectId,
      this.accountGroupItemId,
    );

    if (!latestResult) {
      return null;
    }
    const updateDto: UpdateTaskResultDto = {
      result,
    };
    return this.taskResultsService.updateTaskResult(latestResult.id, updateDto);
  }
}
