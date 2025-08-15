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
import { TwitterAccount } from './entities/twitter-account.entity';
import { CreateTwitterAccountDto } from './dto/create-twitter-account.dto';
import { QueryTwitterAccountDto } from './dto/query-twitter-account.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { AccountGroupsService } from '../account-groups/account-groups.service';
import { MemoryTasksService } from '../memory-tasks/memory-tasks.service';
import { MemoryTaskStatus } from '../memory-tasks/types/memory-task.type';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UpdateTwitterAccountDto } from './dto/update-twitter-account.dto';

@Injectable()
export class TwitterAccountsService {
  constructor(
    @InjectRepository(TwitterAccount)
    private readonly twitterAccountRepository: Repository<TwitterAccount>,
    private readonly accountGroupsService: AccountGroupsService,
    private readonly memoryTasksService: MemoryTasksService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * 创建推特账号
   */
  async create(
    userId: number,
    createTwitterAccountDto: CreateTwitterAccountDto,
  ): Promise<TwitterAccount> {
    const existingAccount = await this.twitterAccountRepository.findOne({
      where: { username: createTwitterAccountDto.username },
    });

    if (existingAccount) {
      throw new ConflictException('推特账号已存在');
    }

    const account = this.twitterAccountRepository.create({
      userId,
      ...createTwitterAccountDto,
    });

    return this.twitterAccountRepository.save(account);
  }

  /**
   * 查询推特账号列表
   */
  async findAll(
    userId: number,
    query: QueryTwitterAccountDto,
  ): Promise<PaginatedResponseDto<TwitterAccount>> {
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
      const queryBuilder = this.twitterAccountRepository
        .createQueryBuilder('account')
        .where('account.userId = :userId', { userId });

      // 添加其他过滤条件
      if (query.username) {
        queryBuilder.andWhere('account.username LIKE :username', {
          username: `%${query.username}%`,
        });
      }
      if (query.recoveryEmail) {
        queryBuilder.andWhere('account.recoveryEmail LIKE :recoveryEmail', {
          recoveryEmail: `%${query.recoveryEmail}%`,
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
    if (query.recoveryEmail) {
      where.recoveryEmail = Like(`%${query.recoveryEmail}%`);
    }
    if (query.token) {
      where.token = Like(`%${query.token}%`);
    }

    const [items, total] = await this.twitterAccountRepository.findAndCount({
      where,
      skip: query.actualSkip,
      take: query.actualTake,
    });

    return new PaginatedResponseDto(items, total);
  }

  /**
   * 获取单个推特账号
   */
  async findOne(userId: number, twitterId: number): Promise<TwitterAccount> {
    const account = await this.twitterAccountRepository.findOne({
      where: { userId, twitterId },
    });

    if (!account) {
      throw new NotFoundException('推特账号不存在');
    }

    return account;
  }

  /**
   * 删除推特账号
   */
  async remove(userId: number, twitterId: number): Promise<void> {
    // 检查账号是否存在
    const account = await this.findOne(userId, twitterId);

    // 检查资源是否被账号组使用
    const isInUse = await this.accountGroupsService.isResourceInUse(
      'twitterAccountId',
      twitterId,
    );
    if (isInUse) {
      throw new BadRequestException('该推特账号正在被账号组使用，无法删除');
    }

    await this.twitterAccountRepository.remove(account);
  }

  /**
   * 批量删除推特账号
   */
  async removeMany(userId: number, twitterIds: number[]): Promise<void> {
    // 检查所有账号是否存在
    const accounts = await this.twitterAccountRepository.findBy({
      userId,
      twitterId: In(twitterIds),
    });

    if (accounts.length !== twitterIds.length) {
      throw new NotFoundException('部分推特账号不存在');
    }

    // 检查每个账号是否被使用
    const accountUsagePromises = twitterIds.map((id) =>
      this.accountGroupsService.isResourceInUse('twitterAccountId', id),
    );
    const accountUsageResults = await Promise.all(accountUsagePromises);

    const usedAccountIds = twitterIds.filter(
      (id, index) => accountUsageResults[index],
    );
    if (usedAccountIds.length > 0) {
      throw new BadRequestException(
        `以下推特账号正在被账号组使用，无法删除: ${usedAccountIds.join(', ')}`,
      );
    }

    await this.twitterAccountRepository.remove(accounts);
  }

  /**
   * 处理导入的推特账号数据
   */
  async processImportedAccount(userId: number, line: string): Promise<void> {
    const parts = line.split('——');
    const createDto = new CreateTwitterAccountDto();

    switch (parts.length) {
      case 3: // 模式1：账号——密码——token
        [createDto.username, createDto.password, createDto.token] = parts;
        break;
      case 4: // 模式2：账号——密码——2FA——token
        [
          createDto.username,
          createDto.password,
          createDto.twoFactorAuth,
          createDto.token,
        ] = parts;
        break;
      case 5: // 模式3：账号——密码——辅助邮箱——辅助邮箱密码——token
        [
          createDto.username,
          createDto.password,
          createDto.recoveryEmail,
          createDto.recoveryEmailPassword,
          createDto.token,
        ] = parts;
        break;
      default:
        throw new Error('无效的数据格式');
    }

    // 清理数据
    Object.keys(createDto).forEach((key) => {
      if (typeof createDto[key] === 'string') {
        createDto[key] = createDto[key].trim();
      }
    });

    await this.create(userId, createDto);
  }

  /**
   * 格式化导出的推特账号数据
   */
  formatAccountForExport(account: TwitterAccount): string {
    const parts = [account.username, account.password];

    if (account.twoFactorAuth) {
      parts.push(account.twoFactorAuth);
    }
    if (account.recoveryEmail && account.recoveryEmailPassword) {
      parts.push(account.recoveryEmail);
      parts.push(account.recoveryEmailPassword);
    }
    if (account.token) {
      parts.push(account.token);
    }

    return parts.join('——');
  }

  /**
   * 获取要导出的推特账号列表
   */
  async findAccountsForExport(
    userId: number,
    twitterIds?: number[],
  ): Promise<TwitterAccount[]> {
    const queryBuilder = this.twitterAccountRepository
      .createQueryBuilder('account')
      .where('account.userId = :userId', { userId });

    if (twitterIds?.length) {
      queryBuilder.andWhereInIds(twitterIds);
    }

    return queryBuilder.getMany();
  }

  /**
   * 开始导入Twitter账号任务，并返回任务ID
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
      name: `导入Twitter账号 - ${decodedFilename}`,
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
        message: `开始导入 ${lines.length} 条Twitter账号...`,
      });

      // 处理统计信息
      let success = 0;
      const errors = [];

      // 逐行处理
      for (let i = 0; i < lines.length; i++) {
        try {
          await this.processImportedAccount(userId, lines[i]);
          success++;

          // 每处理10条记录更新一次状态
          if (i % 10 === 0 || i === lines.length - 1) {
            this.memoryTasksService.updateTask(taskId, {
              message: `已处理 ${i + 1}/${lines.length} 条Twitter账号...`,
            });
          }
        } catch (err) {
          this.logger.error(
            `导入Twitter账号失败 (行 ${i + 1}): ${err.message}`,
          );
          errors.push(`行 ${i + 1}: ${err.message}`);
        }
      }

      // 完成导入，更新最终结果
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.COMPLETED,
        message: `导入完成: 成功 ${success}/${lines.length} 条Twitter账号${errors.length > 0 ? ', 失败 ' + errors.length + ' 条' : ''}`,
      });
    } catch (error) {
      // 处理整体错误
      this.logger.error(`导入Twitter账号任务失败: ${error.message}`);
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.FAILED,
        message: `导入失败: ${error.message}`,
      });
    }
  }

  /**
   * 更新Twitter账号
   */
  async update(
    userId: number,
    twitterId: number,
    updateTwitterAccountDto: UpdateTwitterAccountDto,
  ): Promise<TwitterAccount> {
    const account = await this.twitterAccountRepository.findOne({
      where: { userId, twitterId },
    });

    if (!account) {
      throw new NotFoundException('Twitter账号不存在');
    }

    // 如果更新了用户名，检查是否存在冲突
    if (
      updateTwitterAccountDto.username &&
      updateTwitterAccountDto.username !== account.username
    ) {
      const existingAccount = await this.twitterAccountRepository.findOne({
        where: { username: updateTwitterAccountDto.username },
      });

      if (existingAccount && existingAccount.twitterId !== twitterId) {
        throw new ConflictException('该Twitter用户名已被使用');
      }
    }

    // 更新账号属性
    Object.assign(account, updateTwitterAccountDto);

    // 保存更新
    return await this.twitterAccountRepository.save(account);
  }
}
