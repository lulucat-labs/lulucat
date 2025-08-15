import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { DiscordAccount } from './entities/discord-account.entity';
import { CreateDiscordAccountDto } from './dto/create-discord-account.dto';
import { UpdateDiscordAccountDto } from './dto/update-discord-account.dto';
import { QueryDiscordAccountDto } from './dto/query-discord-account.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { AccountGroupsService } from '../account-groups/account-groups.service';
import { MemoryTasksService } from '../memory-tasks/memory-tasks.service';
import { MemoryTaskStatus } from '../memory-tasks/types/memory-task.type';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class DiscordAccountsService {
  constructor(
    @InjectRepository(DiscordAccount)
    private readonly discordAccountRepository: Repository<DiscordAccount>,
    private readonly accountGroupsService: AccountGroupsService,
    private readonly memoryTasksService: MemoryTasksService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * 创建Discord账号
   */
  async create(
    userId: number,
    createDiscordAccountDto: CreateDiscordAccountDto,
  ): Promise<DiscordAccount> {
    const existingAccount = await this.discordAccountRepository.findOne({
      where: { username: createDiscordAccountDto.username },
    });

    if (existingAccount) {
      throw new ConflictException('Discord账号已存在');
    }

    // 验证DTO必须包含token或密码
    if (!createDiscordAccountDto.token && !createDiscordAccountDto.password) {
      throw new BadRequestException(
        '必须提供访问令牌(token)或登录密码(password)中的至少一个',
      );
    }

    const account = this.discordAccountRepository.create({
      userId,
      ...createDiscordAccountDto,
    });

    return this.discordAccountRepository.save(account);
  }

  /**
   * 查询Discord账号列表
   */
  async findAll(
    userId: number,
    query: QueryDiscordAccountDto,
  ): Promise<PaginatedResponseDto<DiscordAccount>> {
    // 处理前端传递的createdAtRange参数
    if (query['createdAtRange'] && Array.isArray(query['createdAtRange'])) {
      const [start, end] = query['createdAtRange'];
      if (start) {
        query.createdAtStart = new Date(start);
      }
      if (end) {
        query.createdAtEnd = new Date(end);
      }
    }

    // 如果有日期范围查询，使用QueryBuilder
    if (query.createdAtStart || query.createdAtEnd) {
      const queryBuilder = this.discordAccountRepository
        .createQueryBuilder('account')
        .where('account.userId = :userId', { userId });

      // 添加其他过滤条件
      if (query.username) {
        queryBuilder.andWhere('account.username LIKE :username', {
          username: `%${query.username}%`,
        });
      }
      if (query.token) {
        queryBuilder.andWhere('account.token LIKE :token', {
          token: `%${query.token}%`,
        });
      }

      // 添加日期范围条件
      if (query.createdAtStart) {
        queryBuilder.andWhere('account.createdAt >= :createdAtStart', {
          createdAtStart: query.createdAtStart,
        });
      }
      if (query.createdAtEnd) {
        const endDate = new Date(query.createdAtEnd);
        endDate.setHours(23, 59, 59, 999); // 设置为当天结束时间
        queryBuilder.andWhere('account.createdAt <= :createdAtEnd', {
          createdAtEnd: endDate,
        });
      }

      // 添加分页
      queryBuilder.skip(query.actualSkip).take(query.actualTake);

      const [items, total] = await queryBuilder.getManyAndCount();

      return new PaginatedResponseDto(items, total);
    }

    // 如果没有日期范围查询，使用原始方法
    const where: any = { userId };

    if (query.username) {
      where.username = Like(`%${query.username}%`);
    }
    if (query.token) {
      where.token = Like(`%${query.token}%`);
    }

    const [items, total] = await this.discordAccountRepository.findAndCount({
      where,
      skip: query.actualSkip,
      take: query.actualTake,
    });

    return new PaginatedResponseDto(items, total);
  }

  /**
   * 获取单个Discord账号
   */
  async findOne(userId: number, discordId: number): Promise<DiscordAccount> {
    const account = await this.discordAccountRepository.findOne({
      where: { userId, discordId },
    });

    if (!account) {
      throw new NotFoundException('Discord账号不存在');
    }

    return account;
  }

  /**
   * 删除Discord账号
   */
  async remove(userId: number, discordId: number): Promise<void> {
    const isInUse = await this.accountGroupsService.isResourceInUse(
      'discordAccountId',
      discordId,
    );
    if (isInUse) {
      throw new BadRequestException('该Discord账号已被账号组使用，无法删除');
    }
    const result = await this.discordAccountRepository.delete({
      userId,
      discordId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Discord账号不存在');
    }
  }

  /**
   * 批量删除Discord账号
   */
  async removeMany(userId: number, discordIds: number[]): Promise<void> {
    await this.discordAccountRepository.delete({
      userId,
      discordId: In(discordIds),
    });
  }

  /**
   * 开始导入Discord账号任务，并返回任务ID
   */
  async startImportTask(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ taskId: string }> {
    // 处理文件名编码问题
    const decodedFilename = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );

    // 创建一个新的内存任务
    const task = this.memoryTasksService.createTask({
      name: `导入Discord账号 - ${decodedFilename}`,
      message: '正在开始处理导入文件...',
    });

    // 异步处理导入操作
    this.processImportInBackground(task.id, userId, file);

    return { taskId: task.id };
  }

  /**
   * 在后台处理导入操作
   */
  private async processImportInBackground(
    taskId: string,
    userId: number,
    file: Express.Multer.File,
  ): Promise<void> {
    try {
      // 开始处理导入
      this.memoryTasksService.updateTask(taskId, {
        message: '正在读取文件...',
      });

      // 读取文件内容
      const content = file.buffer.toString('utf8');
      const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // 更新任务状态
      this.memoryTasksService.updateTask(taskId, {
        message: `开始导入 ${lines.length} 条Discord账号...`,
      });

      // 处理统计信息
      let success = 0;
      let errors = [];

      // 逐行处理
      for (let i = 0; i < lines.length; i++) {
        try {
          await this.processImportedAccount(userId, lines[i]);
          success++;

          // 每处理10条记录更新一次状态
          if (i % 10 === 0 || i === lines.length - 1) {
            this.memoryTasksService.updateTask(taskId, {
              message: `已处理 ${i + 1}/${lines.length} 条Discord账号...`,
            });
          }
        } catch (err) {
          this.logger.error(
            `导入Discord账号失败 (行 ${i + 1}): ${err.message}`,
          );
          errors.push(`行 ${i + 1}: ${err.message}`);
        }
      }

      // 完成导入，更新最终结果
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.COMPLETED,
        message: `导入完成: 成功 ${success}/${lines.length} 条Discord账号${errors.length > 0 ? ', 失败 ' + errors.length + ' 条' : ''}`,
      });
    } catch (error) {
      // 处理整体错误
      this.logger.error(`导入Discord账号任务失败: ${error.message}`);
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.FAILED,
        message: `导入失败: ${error.message}`,
      });
    }
  }

  /**
   * 处理导入的Discord账号数据
   */
  async processImportedAccount(userId: number, line: string): Promise<void> {
    // ... 实现处理逻辑
    const parts = line.split('——');

    if (parts.length < 3) {
      throw new Error('无效的数据格式');
    }

    const createDto = new CreateDiscordAccountDto();

    // 模式：username——email——password——token
    if (parts.length >= 3) {
      createDto.username = parts[0].trim();
      createDto.email = parts[1].trim();
      createDto.password = parts[2].trim();

      if (parts.length >= 4) {
        createDto.token = parts[3].trim();
      }
    }

    await this.create(userId, createDto);
  }

  /**
   * 格式化账号数据用于导出
   */
  formatAccountForExport(account: DiscordAccount): string {
    const parts = [
      account.username,
      account.email,
      account.emailPassword || '',
      account.password || '',
      account.token || '',
    ];
    return parts.join(',');
  }

  /**
   * 获取要导出的Discord账号列表
   */
  async findAccountsForExport(
    userId: number,
    discordIds?: number[],
  ): Promise<DiscordAccount[]> {
    const queryBuilder = this.discordAccountRepository
      .createQueryBuilder('account')
      .where('account.userId = :userId', { userId });

    if (discordIds?.length) {
      queryBuilder.andWhereInIds(discordIds);
    }

    return queryBuilder.getMany();
  }

  /**
   * 更新Discord账号
   */
  async update(
    userId: number,
    discordId: number,
    updateDiscordAccountDto: UpdateDiscordAccountDto,
  ): Promise<DiscordAccount> {
    const account = await this.discordAccountRepository.findOne({
      where: { userId, discordId },
    });

    if (!account) {
      throw new NotFoundException('Discord账号不存在');
    }

    // 如果更新了用户名，检查是否存在冲突
    if (
      updateDiscordAccountDto.username &&
      updateDiscordAccountDto.username !== account.username
    ) {
      const existingAccount = await this.discordAccountRepository.findOne({
        where: { username: updateDiscordAccountDto.username },
      });

      if (existingAccount && existingAccount.discordId !== discordId) {
        throw new ConflictException('该Discord用户名已被使用');
      }
    }

    // 更新账号属性
    Object.assign(account, updateDiscordAccountDto);

    // 保存更新
    return this.discordAccountRepository.save(account);
  }
}
