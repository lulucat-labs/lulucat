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
import { EmailAccount } from './entities/email-account.entity';
import { CreateEmailAccountDto } from './dto/create-email-account.dto';
import { QueryEmailAccountDto } from './dto/query-email-account.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { AccountGroupsService } from '../account-groups/account-groups.service';
import { MemoryTasksService } from '../memory-tasks/memory-tasks.service';
import { MemoryTaskStatus } from '../memory-tasks/types/memory-task.type';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UpdateEmailAccountDto } from './dto/update-email-account.dto';
import { RefreshTokenValidatorService } from './services/refresh-token-validator.service';
import {
  RefreshTokenCheckResult,
  RefreshTokenCheckSummary,
} from './types/refresh-token-check.type';
import { AccountStatus } from '../../common/types/account-status.enum';

@Injectable()
export class EmailAccountsService {
  constructor(
    @InjectRepository(EmailAccount)
    private readonly emailAccountRepository: Repository<EmailAccount>,
    private readonly accountGroupsService: AccountGroupsService,
    private readonly memoryTasksService: MemoryTasksService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly refreshTokenValidator: RefreshTokenValidatorService,
  ) {}

  /**
   * 创建邮箱账号
   */
  async create(
    userId: number,
    createEmailAccountDto: CreateEmailAccountDto,
  ): Promise<EmailAccount> {
    const existingAccount = await this.emailAccountRepository.findOne({
      where: {
        emailAddress: createEmailAccountDto.emailAddress,
        userId: userId,
      },
    });

    if (existingAccount) {
      throw new ConflictException('邮箱地址已存在');
    }

    const account = this.emailAccountRepository.create({
      userId,
      ...createEmailAccountDto,
    });

    return this.emailAccountRepository.save(account);
  }

  /**
   * 查询邮箱账号列表
   */
  async findAll(
    userId: number,
    query: QueryEmailAccountDto,
  ): Promise<PaginatedResponseDto<EmailAccount>> {
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
      const queryBuilder = this.emailAccountRepository
        .createQueryBuilder('account')
        .where('account.userId = :userId', { userId });

      // 添加其他过滤条件
      if (query.emailAddress) {
        queryBuilder.andWhere('account.emailAddress LIKE :emailAddress', {
          emailAddress: `${query.emailAddress}%`,
        });
      }
      if (query.verificationEmail) {
        queryBuilder.andWhere(
          'account.verificationEmail LIKE :verificationEmail',
          { verificationEmail: `${query.verificationEmail}%` },
        );
      }
      if (query.status) {
        queryBuilder.andWhere('account.status = :status', {
          status: query.status,
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

    if (query.emailAddress) {
      where.emailAddress = Like(`${query.emailAddress}%`); // 前缀查询
    }
    if (query.verificationEmail) {
      where.verificationEmail = Like(`${query.verificationEmail}%`); // 前缀查询
    }
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await this.emailAccountRepository.findAndCount({
      where,
      skip: query.actualSkip,
      take: query.actualTake,
    });

    return new PaginatedResponseDto(items, total);
  }

  /**
   * 获取单个邮箱账号
   */
  async findOne(userId: number, emailId: number): Promise<EmailAccount> {
    const account = await this.emailAccountRepository.findOne({
      where: { userId, emailId },
    });

    if (!account) {
      throw new NotFoundException('邮箱账号不存在');
    }

    return account;
  }

  /**
   * 删除邮箱账号
   */
  async remove(userId: number, emailId: number): Promise<void> {
    const isInUse = await this.accountGroupsService.isResourceInUse(
      'emailAccountId',
      emailId,
    );
    if (isInUse) {
      throw new BadRequestException('该邮箱账号已被账号组使用，无法删除');
    }
    const result = await this.emailAccountRepository.delete({
      userId,
      emailId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('邮箱账号不存在');
    }
  }

  /**
   * 批量删除邮箱账号
   */
  async removeMany(userId: number, emailIds: number[]): Promise<void> {
    await this.emailAccountRepository.delete({
      userId,
      emailId: In(emailIds),
    });
  }

  /**
   * 开始导入邮箱账号任务，并返回任务ID
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
      name: `导入邮箱账号 - ${decodedFilename}`,
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
        message: `开始导入 ${lines.length} 条邮箱账号...`,
      });

      // 处理统计信息
      let created = 0;
      let updated = 0;
      let unchanged = 0;
      const errors = [];

      // 逐行处理
      for (let i = 0; i < lines.length; i++) {
        try {
          const result = await this.processImportedAccount(userId, lines[i]);
          if (result === 'created') {
            created++;
          } else if (result === 'updated') {
            updated++;
          } else {
            unchanged++;
          }

          // 每处理10条记录更新一次状态
          if (i % 10 === 0 || i === lines.length - 1) {
            this.memoryTasksService.updateTask(taskId, {
              message: `已处理 ${i + 1}/${lines.length} 条邮箱账号...`,
            });
          }
        } catch (err) {
          this.logger.error(`导入邮箱账号失败 (行 ${i + 1}): ${err.message}`);
          errors.push(`行 ${i + 1}: ${err.message}`);
        }
      }

      // 完成导入，更新最终结果
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.COMPLETED,
        message: `导入完成: 新增 ${created} 条, 更新 ${updated} 条${unchanged > 0 ? ', 无变化 ' + unchanged + ' 条' : ''}${errors.length > 0 ? ', 失败 ' + errors.length + ' 条' : ''}`,
      });
    } catch (error) {
      // 处理整体错误
      this.logger.error(`导入邮箱账号任务失败: ${error.message}`);
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.FAILED,
        message: `导入失败: ${error.message}`,
      });
    }
  }

  /**
   * 处理导入的邮箱账号数据
   * @returns 'created' | 'updated' | 'unchanged' 返回处理结果
   */
  async processImportedAccount(userId: number, line: string): Promise<string> {
    // 处理一行数据
    const [
      emailAddress,
      emailPassword,
      refreshToken,
      clientId,
      verificationEmail,
    ] = line.split('——');

    if (!emailAddress) {
      throw new Error('邮箱地址不能为空');
    }

    // 检查邮箱是否已存在
    const existingAccount = await this.emailAccountRepository.findOne({
      where: {
        emailAddress: emailAddress.trim(),
        userId: userId,
      },
    });

    // 准备数据对象
    const accountData = {
      emailAddress: emailAddress.trim(),
      emailPassword: emailPassword?.trim(),
      verificationEmail: verificationEmail?.trim(),
      refreshToken: refreshToken?.trim(),
      clientId: clientId?.trim(),
    };

    // 如果邮箱不存在，则创建新账号
    if (!existingAccount) {
      const createDto = new CreateEmailAccountDto();
      Object.assign(createDto, accountData);
      await this.create(userId, createDto);
      return 'created';
    }

    // 邮箱已存在，检查是否需要更新
    const needsUpdate =
      (existingAccount.emailPassword !== accountData.emailPassword &&
        accountData.emailPassword !== undefined) ||
      (existingAccount.verificationEmail !== accountData.verificationEmail &&
        accountData.verificationEmail !== undefined) ||
      (existingAccount.refreshToken !== accountData.refreshToken &&
        accountData.refreshToken !== undefined) ||
      (existingAccount.clientId !== accountData.clientId &&
        accountData.clientId !== undefined);

    // 如果数据有差异，则更新账号
    if (needsUpdate) {
      const updateDto = new UpdateEmailAccountDto();
      // 只更新非空字段
      if (accountData.emailPassword !== undefined) {
        updateDto.emailPassword = accountData.emailPassword;
      }
      if (accountData.verificationEmail !== undefined) {
        updateDto.verificationEmail = accountData.verificationEmail;
      }
      if (accountData.refreshToken !== undefined) {
        updateDto.refreshToken = accountData.refreshToken;
      }
      if (accountData.clientId !== undefined) {
        updateDto.clientId = accountData.clientId;
      }

      await this.update(userId, existingAccount.emailId, updateDto);
      return 'updated';
    }

    return 'unchanged';
  }

  /**
   * 格式化导出的邮箱账号数据
   */
  formatAccountForExport(account: EmailAccount): string {
    const parts = [account.emailAddress, account.emailPassword];

    if (account.verificationEmail) {
      parts.push(account.verificationEmail);
    }

    // 如果有刷新令牌和客户端ID，则添加到导出数据中
    if (account.refreshToken) {
      // 如果没有验证邮箱但有刷新令牌，需要添加一个空的验证邮箱占位
      if (!account.verificationEmail) {
        parts.push('');
      }
      parts.push(account.refreshToken);
    }

    if (account.clientId) {
      // 如果没有验证邮箱和刷新令牌但有客户端ID，需要添加空占位
      if (!account.verificationEmail) {
        parts.push('');
      }
      if (!account.refreshToken) {
        parts.push('');
      }
      parts.push(account.clientId);
    }

    return parts.join('——');
  }

  /**
   * 获取要导出的邮箱账号列表
   */
  async findAccountsForExport(
    userId: number,
    emailIds?: number[],
  ): Promise<EmailAccount[]> {
    const queryBuilder = this.emailAccountRepository
      .createQueryBuilder('account')
      .where('account.userId = :userId', { userId });

    if (emailIds?.length) {
      queryBuilder.andWhereInIds(emailIds);
    }

    return queryBuilder.getMany();
  }

  /**
   * 更新邮箱账号
   */
  async update(
    userId: number,
    emailId: number,
    updateEmailAccountDto: UpdateEmailAccountDto,
  ): Promise<EmailAccount> {
    const account = await this.emailAccountRepository.findOne({
      where: { userId, emailId },
    });

    if (!account) {
      throw new NotFoundException('邮箱账号不存在');
    }

    // 如果更新了邮箱地址，检查是否存在冲突
    if (
      updateEmailAccountDto.emailAddress &&
      updateEmailAccountDto.emailAddress !== account.emailAddress
    ) {
      const existingAccount = await this.emailAccountRepository.findOne({
        where: { emailAddress: updateEmailAccountDto.emailAddress },
      });

      if (existingAccount && existingAccount.emailId !== emailId) {
        throw new ConflictException('该邮箱地址已被使用');
      }
    }

    // 更新账号属性
    Object.assign(account, updateEmailAccountDto);

    // 保存更新
    return await this.emailAccountRepository.save(account);
  }

  /**
   * 批量检测邮箱账号的refreshToken是否有效
   */
  async checkRefreshTokens(
    userId: number,
    ids?: number[],
  ): Promise<{ taskId: string }> {
    // 根据传入的ID或查询所有邮箱账号
    const query: any = { userId };
    if (ids && ids.length > 0) {
      query.emailId = In(ids);
    }

    const accounts = await this.emailAccountRepository.find({ where: query });

    const task = this.memoryTasksService.createTask({
      name: `批量检测邮箱账号的refreshToken是否有效`,
      message: `开始处理 ${accounts.length} 个邮箱账号...`,
    });

    this.processCheckRefreshTokens(task.id, accounts);

    return {
      taskId: task.id,
    };
  }

  /**
   * 处理邮箱账号的refreshToken是否有效任务
   */
  async processCheckRefreshTokens(
    taskId: string,
    accounts: EmailAccount[],
  ): Promise<RefreshTokenCheckSummary> {
    // 使用并发但限制速率的方式验证refreshToken
    const batchSize = 5; // 每批次处理的数量
    const delayBetweenBatches = 1000; // 每批次之间的延迟时间(毫秒)
    const results: RefreshTokenCheckResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    // 将账号分成多个批次
    const batches: EmailAccount[][] = [];
    for (let i = 0; i < accounts.length; i += batchSize) {
      batches.push(accounts.slice(i, i + batchSize));
    }

    // 逐批次处理
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      // 并行处理每个批次中的账号
      const batchPromises = batch.map(async (account) => {
        const { emailId, emailAddress, refreshToken, clientId } = account;

        // 创建基本结果对象
        const result: RefreshTokenCheckResult = {
          emailId,
          emailAddress,
          serviceType:
            this.refreshTokenValidator.getEmailServiceType(emailAddress),
          valid: false,
        };

        // 检查是否有必要的令牌信息
        if (!refreshToken || !clientId) {
          result.errorMessage = '账号缺少刷新令牌或客户端ID';
          failedCount++;
          return result;
        }

        // 检查邮箱类型是否受支持
        if (result.serviceType === 'unknown') {
          result.errorMessage = '不支持的邮箱类型';
          failedCount++;
          return result;
        }

        // 验证令牌
        try {
          const checkResult =
            await this.refreshTokenValidator.validateRefreshToken(
              emailAddress,
              refreshToken,
              clientId,
            );

          result.valid = checkResult.valid;
          result.errorMessage = checkResult.errorMessage;

          if (checkResult.valid) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          result.errorMessage = `验证失败: ${error.message}`;
          failedCount++;
        }

        return result;
      });

      // 等待当前批次处理完成
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 处理失败的账号，将状态标记为失效
      const failedAccountIds = batchResults
        .filter((result) => !result.valid)
        .map((result) => result.emailId);

      if (failedAccountIds.length > 0) {
        await this.updateAccountsStatus(
          failedAccountIds,
          AccountStatus.INVALID,
        );
        this.logger.log(
          'info',
          `已将 ${failedAccountIds.length} 个失效账号标记为失效状态`,
        );
      }

      // 处理成功的账号，将状态标记为正常
      const successAccountIds = batchResults
        .filter((result) => result.valid)
        .map((result) => result.emailId);

      if (successAccountIds.length > 0) {
        await this.updateAccountsStatus(
          successAccountIds,
          AccountStatus.NORMAL,
        );
        this.logger.log(
          'info',
          `已将 ${successAccountIds.length} 个成功账号标记为正常状态`,
        );
      }

      // 更新任务状态
      this.memoryTasksService.updateTask(taskId, {
        message: `已处理 ${(i + 1) * batchSize}/${accounts.length} 条邮箱账号...`,
      });

      // 如果不是最后一批，添加延迟
      if (batch !== batches[batches.length - 1]) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenBatches),
        );
      }
    }

    // 完成导入，更新最终结果
    this.memoryTasksService.updateTask(taskId, {
      status: MemoryTaskStatus.COMPLETED,
      message: `检测完成: 成功 ${successCount}/${accounts.length} 条邮箱账号${failedCount > 0 ? ', 失败 ' + failedCount + ' 条' : ''}`,
    });

    return {
      total: accounts.length,
      success: successCount,
      failed: failedCount,
      results,
    };
  }

  /**
   * 批量更新邮箱账号状态
   */
  private async updateAccountsStatus(
    emailIds: number[],
    status: AccountStatus,
  ): Promise<void> {
    if (emailIds.length === 0) return;

    await this.emailAccountRepository
      .createQueryBuilder()
      .update(EmailAccount)
      .set({ status })
      .whereInIds(emailIds)
      .execute();
  }
}
