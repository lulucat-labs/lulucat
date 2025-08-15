import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskLog } from './entities/task-log.entity';
import { CreateTaskLogDto } from './dto/create-task-log.dto';
import { TaskStatus, Task } from '../tasks/entities/task.entity';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class TaskLogsService {
  constructor(
    @InjectRepository(TaskLog)
    private readonly taskLogRepository: Repository<TaskLog>,
  ) {}

  /**
   * 创建任务日志
   */
  async create(
    createTaskLogDto: CreateTaskLogDto,
    userId: number,
  ): Promise<TaskLog> {
    // 获取任务信息并验证用户权限
    const task = (await this.taskLogRepository.manager.findOne('tasks', {
      where: { id: createTaskLogDto.taskId },
    })) as Task;

    if (!task) {
      throw new NotFoundException(`任务ID ${createTaskLogDto.taskId} 不存在`);
    }

    // 验证用户是否有权限操作该任务
    if (task.userId !== userId) {
      throw new ForbiddenException('您没有权限操作此任务');
    }

    const taskLog = this.taskLogRepository.create({
      taskId: createTaskLogDto.taskId,
      accountGroupItemId: createTaskLogDto.accountGroupItemId,
      status: createTaskLogDto.status,
      startTime: new Date(),
      logs: '',
      errorMessage: createTaskLogDto.errorMessage,
      errorCode: createTaskLogDto.errorCode,
    });

    return this.taskLogRepository.save(taskLog);
  }

  /**
   * 更新任务日志
   */
  async update(
    taskId: number,
    accountGroupItemId: number,
    updateTaskLogDto: Partial<
      Omit<CreateTaskLogDto, 'taskId' | 'accountGroupItemId'>
    >,
    userId: number,
  ): Promise<TaskLog> {
    // 验证用户是否有权限操作该任务
    await this.verifyTaskOwnership(taskId, userId);

    const taskLog = await this.taskLogRepository.findOne({
      where: { taskId, accountGroupItemId },
    });

    if (!taskLog) {
      return this.create(
        {
          taskId,
          accountGroupItemId,
          status: TaskStatus.PENDING,
          ...updateTaskLogDto,
        },
        userId,
      );
    }

    Object.assign(taskLog, updateTaskLogDto);
    return this.taskLogRepository.save(taskLog);
  }

  /**
   * 获取任务的所有日志
   */
  async findByTaskId(taskId: number, userId: number): Promise<TaskLog[]> {
    // 验证用户是否有权限查看该任务
    await this.verifyTaskOwnership(taskId, userId);

    return await this.taskLogRepository.find({
      where: { taskId },
      relations: ['accountGroupItem'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取账号的所有任务日志
   */
  async findByAccountGroupItemId(
    accountGroupItemId: number,
    userId: number,
  ): Promise<TaskLog[]> {
    // 获取与该账号组条目相关的所有任务日志
    const taskLogs = await this.taskLogRepository.find({
      where: { accountGroupItemId },
      relations: ['task'],
      order: { createdAt: 'DESC' },
    });

    // 过滤出用户有权限的任务日志
    const userTaskLogs = [];
    for (const log of taskLogs) {
      if (log.task && log.task.userId === userId) {
        userTaskLogs.push(log);
      }
    }

    return userTaskLogs;
  }

  /**
   * 获取用户所有任务日志
   */
  async findAll(userId: number): Promise<TaskLog[]> {
    return await this.taskLogRepository.find({
      where: { task: { userId } },
      relations: ['task', 'accountGroupItem'],
      order: { startTime: 'DESC' },
    });
  }

  /**
   * 获取指定任务日志
   */
  async findOne(id: number, userId: number): Promise<TaskLog> {
    const taskLog = await this.taskLogRepository.findOne({
      where: { id },
      relations: ['task', 'accountGroupItem'],
    });

    if (!taskLog) {
      throw new NotFoundException(`任务日志ID ${id} 不存在`);
    }

    // 验证用户是否有权限查看该任务日志
    if (taskLog.task.userId !== userId) {
      throw new ForbiddenException('您没有权限查看此任务日志');
    }

    return taskLog;
  }

  /**
   * 获取任务的日志
   */
  async findByTask(taskId: number, userId: number): Promise<TaskLog[]> {
    // 验证用户是否有权限查看该任务
    await this.verifyTaskOwnership(taskId, userId);

    return await this.taskLogRepository.find({
      where: { task: { id: taskId } },
      relations: ['task', 'accountGroupItem'],
      order: { startTime: 'DESC' },
    });
  }

  /**
   * 追加任务日志
   */
  async appendLog(id: number, log: string, userId: number): Promise<TaskLog> {
    const taskLog = await this.findOne(id, userId);
    taskLog.logs += log + '\n';
    return await this.taskLogRepository.save(taskLog);
  }

  /**
   * 完成任务日志
   */
  async complete(
    id: number,
    status: TaskStatus,
    userId: number,
  ): Promise<TaskLog> {
    const taskLog = await this.findOne(id, userId);
    taskLog.status = status;
    taskLog.endTime = new Date();
    return await this.taskLogRepository.save(taskLog);
  }

  /**
   * 清空当前用户所有任务日志
   */
  async clearAllLogs(userId: number): Promise<void> {
    const taskLogs = await this.taskLogRepository.find({
      where: { task: { userId } },
      relations: ['task'],
    });

    if (taskLogs.length > 0) {
      await this.taskLogRepository.delete(
        taskLogs.map((taskLog) => taskLog.id),
      );
    }
  }

  /**
   * 分页获取用户任务日志
   */
  async findAllPaginated(
    current: number,
    pageSize: number,
    userId: number,
  ): Promise<PaginatedResponse<TaskLog>> {
    const [data, total] = await this.taskLogRepository.findAndCount({
      where: { task: { userId } },
      relations: ['task', 'accountGroupItem'],
      order: { startTime: 'DESC' },
      skip: (current - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      total,
      current,
      pageSize,
    };
  }

  /**
   * 验证用户是否有权限操作指定任务
   * @private
   */
  private async verifyTaskOwnership(
    taskId: number,
    userId: number,
  ): Promise<void> {
    const task = (await this.taskLogRepository.manager.findOne('tasks', {
      where: { id: taskId },
    })) as Task;

    if (!task) {
      throw new NotFoundException(`任务ID ${taskId} 不存在`);
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('您没有权限操作此任务');
    }
  }
}
