import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { merge } from 'lodash';
import { TaskResult } from './entities/task-result.entity';
import {
  CreateTaskResultDto,
  UpdateTaskResultDto,
  QueryTaskResultDto,
  QueryTaskResultByConditionsDto,
} from './dto';
import { Project } from '../projects/entities/project.entity';
import * as fs from 'fs/promises';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

/**
 * 任务结果服务
 * 提供操作任务结果的各种方法
 */
@Injectable()
export class TaskResultsService {
  constructor(
    @InjectRepository(TaskResult)
    private readonly taskResultRepository: Repository<TaskResult>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * 创建任务结果
   * @param createTaskResultDto 创建任务结果的数据
   * @returns 创建的任务结果
   */
  async createTaskResult(
    createTaskResultDto: CreateTaskResultDto,
  ): Promise<TaskResult> {
    const taskResult = this.taskResultRepository.create(createTaskResultDto);
    return this.taskResultRepository.save(taskResult);
  }

  /**
   * 查找所有任务结果
   * @param queryTaskResultDto 查询条件
   * @returns 任务结果列表和总数
   */
  async findAllTaskResults(
    queryTaskResultDto: QueryTaskResultDto,
  ): Promise<{ data: TaskResult[]; total: number }> {
    const {
      projectId,
      accountGroupItemId,
      page = 1,
      limit = 10,
    } = queryTaskResultDto;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.taskResultRepository.createQueryBuilder('taskResult');

    if (projectId) {
      queryBuilder.andWhere('taskResult.projectId = :projectId', { projectId });
    }

    if (accountGroupItemId) {
      queryBuilder.andWhere(
        'taskResult.accountGroupItemId = :accountGroupItemId',
        { accountGroupItemId },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('taskResult.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * 根据ID查找任务结果
   * @param id 任务结果ID
   * @returns 任务结果
   */
  async findTaskResultById(id: number): Promise<TaskResult> {
    const taskResult = await this.taskResultRepository.findOne({
      where: { id },
    });

    if (!taskResult) {
      throw new NotFoundException(`任务结果ID为${id}的记录不存在`);
    }

    return taskResult;
  }

  /**
   * 查找特定项目和账号组条目的最新结果
   * @param projectId 项目ID
   * @param accountGroupItemId 账号组条目ID
   * @returns 任务结果
   */
  async findLatestTaskResult(
    projectId: number,
    accountGroupItemId: number,
  ): Promise<TaskResult | null> {
    return this.taskResultRepository.findOne({
      where: { projectId, accountGroupItemId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 更新任务结果
   * @param id 任务结果ID
   * @param updateTaskResultDto 更新的数据
   * @returns 更新后的任务结果
   */
  async updateTaskResult(
    id: number,
    updateTaskResultDto: UpdateTaskResultDto,
  ): Promise<TaskResult> {
    const taskResult = await this.findTaskResultById(id);

    // 处理 result 字段的深度合并更新
    if (updateTaskResultDto.result && taskResult.result) {
      updateTaskResultDto.result = merge(
        {},
        taskResult.result,
        updateTaskResultDto.result,
      );
    }

    const updatedTaskResult = this.taskResultRepository.merge(
      taskResult,
      updateTaskResultDto,
    );
    return this.taskResultRepository.save(updatedTaskResult);
  }

  /**
   * 删除任务结果
   * @param id 任务结果ID
   * @returns 删除是否成功
   */
  async removeTaskResult(id: number): Promise<boolean> {
    const taskResult = await this.findTaskResultById(id);
    const result = await this.taskResultRepository.remove(taskResult);
    return !!result;
  }

  /**
   * 根据JSON字段条件查找一条符合的记录
   * @param projectId 项目ID
   * @param jsonConditions JSON字段条件，格式为{path: string, operator: string, value: any}[]
   * @param excludeAccountGroupItemId 要排除的账号组条目ID (可选)
   * @param randomOrder 是否随机排序返回结果 (默认为true)
   * @returns 找到的任务结果
   */
  async findOneByJsonCondition(
    projectId: number,
    jsonConditions: Array<{ path: string; operator: string; value: any }>,
    excludeAccountGroupItemId?: number,
  ): Promise<TaskResult | null> {
    // 构建基础查询
    const queryBuilder = this.taskResultRepository
      .createQueryBuilder('taskResult')
      .where('taskResult.projectId = :projectId', { projectId });

    // 添加排除账号条件
    if (excludeAccountGroupItemId) {
      queryBuilder.andWhere(
        'taskResult.accountGroupItemId != :excludeAccountGroupItemId',
        { excludeAccountGroupItemId },
      );
    }

    // 添加JSON字段条件
    jsonConditions.forEach((condition, index) => {
      const { path, operator, value } = condition;
      // 构建JSON提取表达式
      const jsonExtract = `JSON_EXTRACT(taskResult.result, '$.${path}')`;

      // 根据不同的操作符构建不同的SQL条件
      switch (operator) {
        case 'is':
          queryBuilder.andWhere(
            `${jsonExtract} IS ${value ? 'NOT NULL' : 'NULL'}`,
          );
          break;
        case '<':
          queryBuilder.andWhere(
            `CAST(${jsonExtract} AS UNSIGNED) < :value${index}`,
            { [`value${index}`]: value },
          );
          break;
        case '<=':
          queryBuilder.andWhere(
            `CAST(${jsonExtract} AS UNSIGNED) <= :value${index}`,
            { [`value${index}`]: value },
          );
          break;
        case '>':
          queryBuilder.andWhere(
            `CAST(${jsonExtract} AS UNSIGNED) > :value${index}`,
            { [`value${index}`]: value },
          );
          break;
        case '>=':
          queryBuilder.andWhere(
            `CAST(${jsonExtract} AS UNSIGNED) >= :value${index}`,
            { [`value${index}`]: value },
          );
          break;
        case '=':
          queryBuilder.andWhere(`${jsonExtract} = :value${index}`, {
            [`value${index}`]: JSON.stringify(value),
          });
          break;
        case '!=':
          queryBuilder.andWhere(`${jsonExtract} != :value${index}`, {
            [`value${index}`]: JSON.stringify(value),
          });
          break;
        default:
          // 默认使用等于操作符
          queryBuilder.andWhere(`${jsonExtract} = :value${index}`, {
            [`value${index}`]: JSON.stringify(value),
          });
      }
    });

    // // 添加排序和限制
    // if (randomOrder) {
    //   queryBuilder.orderBy('RAND()');
    // }

    queryBuilder.limit(1);

    return queryBuilder.getOne();
  }

  /**
   * 获取项目任务结果数据结构
   * @param projectName 项目名称
   * @returns 项目任务结果数据结构
   */
  async getProjectTaskSchema(
    projectName: string,
  ): Promise<Record<string, any>> {
    try {
      const schemaPath = `src/modules/task-engine/scripts/${projectName}/types/task-schema.json`;
      const schema = await fs.readFile(schemaPath, 'utf8');
      return JSON.parse(schema);
    } catch (error) {
      throw new NotFoundException(
        `项目 ${projectName} 的任务结果数据结构不存在`,
      );
    }
  }

  /**
   * 按条件查询任务结果
   * @param projectId 项目ID
   * @param dto 查询参数
   * @param userId 用户ID
   * @returns 分页的任务结果和账号组条目信息
   */
  async findTaskResultsByConditions(
    projectId: number,
    dto: QueryTaskResultByConditionsDto,
    userId: number,
  ): Promise<{ total: number; items: any[]; statTotal: number }> {
    const { conditions = [], page = 1, pageSize = 10 } = dto;
    const skip = (page - 1) * pageSize;

    // 创建查询构建器
    const createQueryBuilder = () =>
      this.taskResultRepository.manager
        .createQueryBuilder()
        .select([
          'account_group_items.id AS accountGroupItemId',
          'account_group_items.account_group_id AS accountGroupId',
          'account_groups.name AS accountGroupName',
          'ANY_VALUE(task_results.project_id) AS projectId',
          'ANY_VALUE(task_results.id) AS taskResultId',
          'ANY_VALUE(JSON_EXTRACT(task_results.result, "$.tasks")) AS taskResult',
        ])
        .from('account_group_items', 'account_group_items')
        .innerJoin(
          'account_groups',
          'account_groups',
          'account_groups.id = account_group_items.account_group_id AND account_groups.user_id = :userId',
          { userId },
        )
        .innerJoin(
          'task_account_groups',
          'task_account_groups',
          'task_account_groups.account_group_id = account_groups.id',
        )
        .innerJoin(
          'tasks',
          'tasks',
          'tasks.id = task_account_groups.task_id AND tasks.user_id = :userId AND tasks.project_id = :projectId',
          { userId, projectId },
        )
        .leftJoin(
          'task_results',
          'task_results',
          'task_results.account_group_item_id = account_group_items.id AND task_results.project_id = :projectId',
          { projectId },
        )
        .where('tasks.project_id = :projectId', { projectId });

    // 创建查询总数构建器
    const countQueryBuilder = createQueryBuilder();
    countQueryBuilder.groupBy('account_group_items.id');
    const statTotal = await countQueryBuilder.getCount();

    // 创建查询数据构建器
    const queryBuilder = createQueryBuilder();
    // 添加条件过滤
    conditions.forEach((condition, index) => {
      const { name, operator, value, type } = condition;

      // 处理嵌套路径，如果 name 不包含 . 符号，则添加 tasks. 前缀
      const jsonPath = name.includes('.') ? name : `tasks.${name}`;
      const jsonExtract = `JSON_EXTRACT(task_results.result, '$.${jsonPath}')`;

      // 根据不同类型和操作符构建查询条件
      switch (type) {
        case 'boolean':
          // 布尔类型特殊处理
          if (value === true) {
            // 处理值为 true 的情况
            queryBuilder.andWhere(`${jsonExtract} = true`);
          } else {
            // 处理值为 false 的情况，包括 NULL
            queryBuilder.andWhere(
              `(${jsonExtract} = false OR task_results.result IS NULL)`,
            );
          }
          break;

        case 'number':
          // 数字类型处理
          switch (operator) {
            case '=':
              queryBuilder.andWhere(
                `CAST(${jsonExtract} AS DECIMAL) = :value${index}`,
                {
                  [`value${index}`]: value,
                },
              );
              break;
            case '!=':
              queryBuilder.andWhere(
                `CAST(${jsonExtract} AS DECIMAL) != :value${index}`,
                {
                  [`value${index}`]: value,
                },
              );
              break;
            case '>':
              queryBuilder.andWhere(
                `CAST(${jsonExtract} AS DECIMAL) > :value${index}`,
                {
                  [`value${index}`]: value,
                },
              );
              break;
            case '<':
              queryBuilder.andWhere(
                `CAST(${jsonExtract} AS DECIMAL) < :value${index}`,
                {
                  [`value${index}`]: value,
                },
              );
              break;
            case '>=':
              queryBuilder.andWhere(
                `CAST(${jsonExtract} AS DECIMAL) >= :value${index}`,
                {
                  [`value${index}`]: value,
                },
              );
              break;
            case '<=':
              queryBuilder.andWhere(
                `CAST(${jsonExtract} AS DECIMAL) <= :value${index}`,
                {
                  [`value${index}`]: value,
                },
              );
              break;
            case 'isEmpty':
              queryBuilder.andWhere(`${jsonExtract} IS NULL`);
              break;
            case 'isNotEmpty':
              queryBuilder.andWhere(`${jsonExtract} IS NOT NULL`);
              break;
          }
          break;

        case 'string':
          // 字符串类型处理
          switch (operator) {
            case '=':
              queryBuilder.andWhere(`${jsonExtract} = :value${index}`, {
                [`value${index}`]: JSON.stringify(value),
              });
              break;
            case '!=':
              queryBuilder.andWhere(`${jsonExtract} != :value${index}`, {
                [`value${index}`]: JSON.stringify(value),
              });
              break;
            case 'contains':
              queryBuilder.andWhere(`${jsonExtract} LIKE :value${index}`, {
                [`value${index}`]: `%${value}%`,
              });
              break;
            case 'notContains':
              queryBuilder.andWhere(`${jsonExtract} NOT LIKE :value${index}`, {
                [`value${index}`]: `%${value}%`,
              });
              break;
            case 'isEmpty':
              queryBuilder.andWhere(
                `(${jsonExtract} IS NULL OR ${jsonExtract} = '""')`,
              );
              break;
            case 'isNotEmpty':
              queryBuilder.andWhere(
                `(${jsonExtract} IS NOT NULL AND ${jsonExtract} != '""')`,
              );
              break;
          }
          break;
      }
    });
    // 添加分组
    queryBuilder.groupBy('account_group_items.id');

    const total = await queryBuilder.getCount();

    // 执行查询
    const data = await queryBuilder.offset(skip).limit(pageSize).getRawMany();

    return {
      total,
      items: data,
      statTotal,
    };
  }

  /**
   * 获取当前用户创建过任务的项目列表
   * @param userId 用户ID
   * @returns 项目列表
   */
  async getUserProjects(userId: number): Promise<Project[]> {
    const results = await this.projectRepository
      .createQueryBuilder('project')
      .innerJoin('project.tasks', 'tasks')
      .where('tasks.userId = :userId', { userId })
      .orderBy('project.createdAt', 'DESC')
      .distinct(true)
      .getMany();

    return results;
  }
}
