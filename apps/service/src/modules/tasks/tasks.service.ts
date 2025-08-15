import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { ProjectsService } from '../projects/projects.service';
import { ScriptsService } from '../scripts/scripts.service';
import { AccountGroupsService } from '../account-groups/account-groups.service';
import { TaskStatus } from './entities/task.entity';
import { TaskLog } from '../task-logs/entities/task-log.entity';
import { AccountGroupItem } from '../account-groups/entities/account-group-item.entity';
import { MachineIdService } from '../../common/services/machine-id.service';
import { TaskExceptionCode } from '@lulucat/exceptions';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskLog)
    private readonly taskLogRepository: Repository<TaskLog>,
    private readonly projectsService: ProjectsService,
    private readonly scriptsService: ScriptsService,
    private readonly accountGroupsService: AccountGroupsService,
    private readonly machineIdService: MachineIdService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: number): Promise<Task> {
    const task = this.taskRepository.create({
      name: createTaskDto.name,
      threadCount: createTaskDto.threadCount,
      status: TaskStatus.PENDING,
      projectId: createTaskDto.projectId,
      userId,
      machineId: this.machineIdService.getMachineId(),
    });

    // 关联项目
    const project = await this.projectsService.findOne(createTaskDto.projectId);
    task.project = project;

    // 关联账号组
    const accountGroups = await Promise.all(
      createTaskDto.accountGroupIds.map((id) =>
        this.accountGroupsService.findOne(id, userId),
      ),
    );
    task.accountGroups = accountGroups;

    // 验证并关联脚本
    const scripts = await Promise.all(
      createTaskDto.scriptIds.map((id) => this.scriptsService.findOne(id)),
    );

    // 验证所有脚本是否属于该项目或是公共脚本
    const invalidScripts = scripts.filter(
      (script) => !script.isPublic && script.projectId !== project.id,
    );
    if (invalidScripts.length > 0) {
      throw new BadRequestException(
        `以下脚本不属于该项目: ${invalidScripts.map((s) => s.name).join(', ')}`,
      );
    }

    task.scripts = scripts;

    // 保存任务
    const savedTask = await this.taskRepository.save(task);

    // 为每个账号组中的所有账号项创建初始任务日志记录
    const allAccountGroupItems: AccountGroupItem[] = [];
    for (const accountGroup of accountGroups) {
      allAccountGroupItems.push(...accountGroup.items);
    }

    // 创建任务日志
    const taskLogs = allAccountGroupItems.map((item) => {
      return this.taskLogRepository.create({
        taskId: savedTask.id,
        accountGroupItemId: item.id,
        status: TaskStatus.PENDING,
        startTime: new Date(),
        logs: '',
      });
    });

    // 保存所有任务日志
    if (taskLogs.length > 0) {
      await this.taskLogRepository.save(taskLogs);
    }

    return savedTask;
  }

  async findAll(
    query: QueryTaskDto,
    userId: number,
  ): Promise<{
    data: Task[];
    total: number;
    current: number;
    pageSize: number;
  }> {
    const { current = 1, pageSize = 10, status } = query;

    // 构建查询条件
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    // 查询总数
    const total = await this.taskRepository.count({ where });

    // 查询数据
    const data = await this.taskRepository.find({
      where,
      relations: [],
      order: {
        createdAt: 'DESC',
      },
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

  async findOne(id: number, userId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, userId },
      relations: ['project', 'accountGroups', 'scripts'],
    });

    if (!task) {
      throw new NotFoundException(`任务ID ${id} 不存在或不属于当前用户`);
    }

    return task;
  }

  /**
   * 仅根据ID查找任务，不进行用户ID验证
   * 用于系统内部操作，如任务调度和日志记录
   */
  async findOneByIdOnly(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['project', 'accountGroups', 'scripts'],
    });

    if (!task) {
      throw new NotFoundException(`任务ID ${id} 不存在`);
    }

    return task;
  }

  async update(
    id: number,
    updateTaskDto: Partial<CreateTaskDto>,
    userId: number,
  ): Promise<Task> {
    const task = await this.findOne(id, userId);

    if (updateTaskDto.projectId) {
      const project = await this.projectsService.findOne(
        updateTaskDto.projectId,
      );
      task.project = project;

      // 如果更新了项目，需要验证现有脚本是否属于新项目
      if (task.scripts.length > 0) {
        const invalidScripts = task.scripts.filter(
          (script) => !script.isPublic && script.projectId !== project.id,
        );
        if (invalidScripts.length > 0) {
          throw new BadRequestException(
            `以下脚本不属于新项目，请先更新脚本列表: ${invalidScripts.map((s) => s.name).join(', ')}`,
          );
        }
      }
    }

    if (updateTaskDto.accountGroupIds) {
      task.accountGroups = await Promise.all(
        updateTaskDto.accountGroupIds.map((id) =>
          this.accountGroupsService.findOne(id, userId),
        ),
      );
    }

    if (updateTaskDto.scriptIds) {
      const scripts = await Promise.all(
        updateTaskDto.scriptIds.map((id) => this.scriptsService.findOne(id)),
      );

      // 验证所有脚本是否属于该项目或是公共脚本
      const invalidScripts = scripts.filter(
        (script) => !script.isPublic && script.projectId !== task.project.id,
      );
      if (invalidScripts.length > 0) {
        throw new BadRequestException(
          `以下脚本不属于该项目: ${invalidScripts.map((s) => s.name).join(', ')}`,
        );
      }

      task.scripts = scripts;
    }

    if (updateTaskDto.name) {
      task.name = updateTaskDto.name;
    }

    if (updateTaskDto.threadCount) {
      task.threadCount = updateTaskDto.threadCount;
    }

    return await this.taskRepository.save(task);
  }

  async remove(id: number, userId: number): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.taskRepository.remove(task);
  }

  async updateStatus(
    id: number,
    status: TaskStatus,
    userId: number,
  ): Promise<Task> {
    const task = await this.findOne(id, userId);
    task.status = status;

    // 如果任务状态变为RUNNING，更新硬件ID
    if (status === TaskStatus.RUNNING) {
      task.machineId = this.machineIdService.getMachineId();
    }

    return await this.taskRepository.save(task);
  }

  /**
   * 查找指定状态的所有任务
   * 用于系统内部操作，如任务清理
   */
  async findAllByStatuses(statuses: TaskStatus[]): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { status: In(statuses) },
      relations: ['project', 'accountGroups', 'scripts'],
    });
  }

  /**
   * 获取账号组及其关联的账号项详细信息
   */
  async getAccountGroupWithDetails(
    accountGroupId: number,
    userId: number,
  ): Promise<any> {
    return this.accountGroupsService.findOne(accountGroupId, userId);
  }

  /**
   * 将当前设备上所有运行中的任务标记为失败
   */
  async markRunningTasksAsFailed(): Promise<void> {
    const machineId = this.machineIdService.getMachineId();

    const runningTasks = await this.taskRepository.find({
      where: {
        machineId,
        status: TaskStatus.RUNNING,
      },
      select: ['id'],
    });

    const taskIds = runningTasks.map((task) => task.id);

    if (taskIds.length > 0) {
      await this.taskLogRepository
        .createQueryBuilder()
        .update(TaskLog)
        .set({
          status: TaskStatus.STOPPED,
          endTime: new Date(),
          errorMessage: '程序执行任务时出现中断',
          errorCode: String(TaskExceptionCode.PROGRAM_INTERRUPTED),
        })
        .where('task_id IN (:...taskIds) AND status = :status', {
          taskIds,
          status: TaskStatus.RUNNING,
        })
        .execute();

      await this.taskRepository
        .createQueryBuilder()
        .update(Task)
        .set({
          status: TaskStatus.STOPPED,
        })
        .where('id IN (:...taskIds)', {
          taskIds,
        })
        .execute();
    }
  }
}
