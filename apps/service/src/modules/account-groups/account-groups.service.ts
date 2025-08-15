import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AccountGroup } from './entities/account-group.entity';
import { AccountGroupItem } from './entities/account-group-item.entity';
import { QueryAccountGroupDto } from './dto/query-account-group.dto';
import { DiscordAccount } from '../discord-accounts/entities/discord-account.entity';
import { EmailAccount } from '../email-accounts/entities/email-account.entity';
import { EvmWallet } from '../evm-wallets/entities/evm-wallet.entity';
import { TwitterAccount } from '../twitter-accounts/entities/twitter-account.entity';
import { TaskLog } from '../task-logs/entities/task-log.entity';
import { TaskExceptionCode } from '@lulucat/exceptions';
import {
  CreateQuickAccountGroupDto,
  AccountType,
} from './dto/create-quick-account-group.dto';
import { ProxyIp } from '../proxy-ips/entities/proxy-ip.entity';
import { BrowserFingerprint } from '../browser-fingerprints/entities/browser-fingerprint.entity';
import {
  UpdateAccountItemsStatusDto,
  AccountItemType,
} from './dto/update-account-items-status.dto';
import { AccountStatus } from '../../common/types/account-status.enum';
import {
  ReplaceAccountItemsResourceDto,
  AccountResourceType,
} from './dto/replace-account-items-resource.dto';
import { ReplaceAllAccountItemsResourceDto } from './dto/replace-all-account-items-resource.dto';

@Injectable()
export class AccountGroupsService {
  constructor(
    @InjectRepository(AccountGroup)
    private readonly accountGroupRepository: Repository<AccountGroup>,
    @InjectRepository(AccountGroupItem)
    private readonly accountGroupItemRepository: Repository<AccountGroupItem>,
    @InjectRepository(DiscordAccount)
    private readonly discordAccountRepository: Repository<DiscordAccount>,
    @InjectRepository(EmailAccount)
    private readonly emailAccountRepository: Repository<EmailAccount>,
    @InjectRepository(EvmWallet)
    private readonly evmWalletRepository: Repository<EvmWallet>,
    @InjectRepository(TwitterAccount)
    private readonly twitterAccountRepository: Repository<TwitterAccount>,
    @InjectRepository(TaskLog)
    private readonly taskLogRepository: Repository<TaskLog>,
    @InjectRepository(ProxyIp)
    private readonly proxyIpRepository: Repository<ProxyIp>,
    @InjectRepository(BrowserFingerprint)
    private readonly browserFingerprintRepository: Repository<BrowserFingerprint>,
  ) {}
  async findAll(query: QueryAccountGroupDto, userId: number) {
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

    const qb = this.accountGroupRepository
      .createQueryBuilder('accountGroup')
      .where('accountGroup.userId = :userId', { userId });

    if (query.name) {
      qb.andWhere('accountGroup.name LIKE :name', {
        name: `%${query.name}%`,
      });
    }

    // 添加日期范围条件
    if (query.createdAtStart) {
      qb.andWhere('accountGroup.createdAt >= :createdAtStart', {
        createdAtStart: query.createdAtStart,
      });
    }
    if (query.createdAtEnd) {
      const endDate = new Date(query.createdAtEnd);
      endDate.setHours(23, 59, 59, 999); // 设置为当天结束时间
      qb.andWhere('accountGroup.createdAt <= :createdAtEnd', {
        createdAtEnd: endDate,
      });
    }

    const [items, total] = await qb
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findOne(id: number, userId: number): Promise<AccountGroup> {
    const accountGroup = await this.accountGroupRepository.findOne({
      where: { id, userId },
      relations: [
        'items',
        'items.discordAccount',
        'items.emailAccount',
        'items.evmWallet',
        'items.twitterAccount',
        'items.proxyIp',
        'items.browserFingerprint',
      ],
    });

    if (!accountGroup) {
      throw new BadRequestException(`账号组ID"${id}"不存在或不属于当前用户`);
    }

    return accountGroup;
  }

  async remove(id: number, userId: number): Promise<void> {
    const accountGroup = await this.findOne(id, userId);
    await this.accountGroupRepository.remove(accountGroup);
  }

  /**
   * 检查资源是否被账号组使用
   * @param resourceType 资源类型
   * @param resourceId 资源ID
   * @returns 如果资源被使用，返回true；否则返回false
   */
  async isResourceInUse(
    resourceType:
      | 'discordAccountId'
      | 'emailAccountId'
      | 'evmWalletId'
      | 'twitterAccountId'
      | 'proxyIpId'
      | 'browserFingerprintId',
    resourceId: number,
  ): Promise<boolean> {
    const qb = this.accountGroupItemRepository.createQueryBuilder('item');
    qb.where(`item.${resourceType} = :resourceId`, { resourceId });
    const count = await qb.getCount();
    return count > 0;
  }

  /**
   * 获取单个账号组及其关联项的详细信息，并关联任务日志
   * @param id 账号组ID
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @param taskId 任务ID，用于筛选特定任务的日志
   * @param status 任务日志状态，用于筛选特定状态的日志
   * @param errorType 错误类型，用于筛选特定类型的错误（wallet, twitter, discord, email, ip, other）
   * @returns 包含分页结果的对象
   */
  async findOneWithTaskLogs(
    id: number,
    userId: number,
    page: number = 1,
    pageSize: number = 10,
    taskId: number,
    status?: string,
    errorType?: string,
  ): Promise<{
    items: (AccountGroupItem & { taskLogs?: TaskLog[] })[];
    total: number;
    page: number;
    pageSize: number;
    accountGroup: AccountGroup;
  }> {
    const accountGroup = await this.accountGroupRepository.findOne({
      where: { id, userId },
      select: ['id', 'name', 'userId', 'createdAt', 'updatedAt'],
    });

    if (!accountGroup) {
      throw new BadRequestException(`账号组ID"${id}"不存在或不属于当前用户`);
    }

    // 先查询所有符合条件的任务日志对应的 accountGroupItemId
    const taskLogsSubQuery = this.accountGroupItemRepository.manager
      .createQueryBuilder(TaskLog, 'taskLog')
      .select('taskLog.accountGroupItemId')
      .innerJoin('taskLog.task', 'task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.id = :taskId', { taskId });

    // 添加基于 status 的过滤
    if (status) {
      taskLogsSubQuery.andWhere('taskLog.status = :status', { status });
    }

    // 添加基于 errorType 的错误代码范围过滤
    if (errorType) {
      // 获取基于错误类型的错误代码范围
      const errorCodes = this.getErrorCodesByType(errorType);
      if (errorCodes.length > 0) {
        taskLogsSubQuery.andWhere('taskLog.errorCode IN (:...errorCodes)', {
          errorCodes,
        });
      }
    }

    const queryBuilder = this.accountGroupItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.discordAccount', 'discordAccount')
      .leftJoinAndSelect('item.emailAccount', 'emailAccount')
      .leftJoinAndSelect('item.evmWallet', 'evmWallet')
      .leftJoinAndSelect('item.twitterAccount', 'twitterAccount')
      .leftJoinAndSelect('item.proxyIp', 'proxyIp')
      .leftJoinAndSelect('item.browserFingerprint', 'browserFingerprint')
      .where('item.accountGroupId = :accountGroupId', { accountGroupId: id });

    // 如果提供了 taskId，添加过滤条件，只包含有符合条件的任务日志的账号项
    if (taskId) {
      queryBuilder.andWhere('item.id IN (' + taskLogsSubQuery.getQuery() + ')');
      queryBuilder.setParameters(taskLogsSubQuery.getParameters());
    }

    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // 查询每个账号组项的任务日志
    if (items.length > 0) {
      const itemIds = items.map((item) => item.id);
      // 获取所有相关的任务日志
      const taskLogsQueryBuilder = this.accountGroupItemRepository.manager
        .createQueryBuilder(TaskLog, 'taskLog')
        .leftJoinAndSelect('taskLog.task', 'task')
        .where('taskLog.accountGroupItemId IN (:...itemIds)', { itemIds })
        .andWhere('task.userId = :userId', { userId })
        .andWhere('task.id = :taskId', { taskId });

      // 添加基于 status 的过滤
      if (status) {
        taskLogsQueryBuilder.andWhere('taskLog.status = :status', { status });
      }

      // 添加基于 errorType 的错误代码范围过滤
      if (errorType) {
        // 获取基于错误类型的错误代码范围
        const errorCodes = this.getErrorCodesByType(errorType);
        if (errorCodes.length > 0) {
          taskLogsQueryBuilder.andWhere(
            'taskLog.errorCode IN (:...errorCodes)',
            {
              errorCodes,
            },
          );
        }
      }

      const taskLogs = await taskLogsQueryBuilder
        .orderBy('taskLog.createdAt', 'DESC')
        .getMany();

      // 按账号组项ID分组任务日志
      const taskLogsByItemId = taskLogs.reduce((acc, log) => {
        if (!acc[log.accountGroupItemId]) {
          acc[log.accountGroupItemId] = [];
        }
        acc[log.accountGroupItemId].push(log);
        return acc;
      }, {});

      // 将任务日志添加到相应的账号组项中
      items.forEach((item) => {
        item['taskLogs'] = taskLogsByItemId[item.id] || [];
      });
    }

    return {
      items,
      total,
      page,
      pageSize,
      accountGroup,
    };
  }

  /**
   * 根据错误类型获取对应的错误代码集合
   * @param errorType 错误类型 (wallet, twitter, discord, email, ip, other)
   * @returns 错误代码数组
   */
  private getErrorCodesByType(errorType: string): number[] {
    const allCodes = Object.values(TaskExceptionCode).filter(
      (value) => typeof value === 'number',
    ) as number[];

    switch (errorType) {
      case 'wallet':
        // 钱包相关异常 (11000-11999)
        return allCodes.filter((code) => code >= 11000 && code < 12000);
      case 'twitter':
        // X(Twitter)相关异常 (12000-12999)
        return allCodes.filter((code) => code >= 12000 && code < 13000);
      case 'discord':
        // Discord相关异常 (13000-13999)
        return allCodes.filter((code) => code >= 13000 && code < 14000);
      case 'email':
        // 邮箱相关异常 (14000-14999)
        return allCodes.filter((code) => code >= 14000 && code < 15000);
      case 'ip':
        // IP/代理相关异常 (15000-15999)
        return allCodes.filter((code) => code >= 15000 && code < 16000);
      case 'other':
        // 通用异常 (10000-10999)
        return allCodes.filter((code) => code >= 10000 && code < 11000);
      default:
        return [];
    }
  }

  /**
   * 快速创建账号组并关联指定数量的不同账号
   * @param createDto 快速创建账号组的DTO
   * @param userId 用户ID
   * @returns 创建的账号组
   */
  async createQuickGroup(
    createDto: CreateQuickAccountGroupDto,
    userId: number,
  ): Promise<AccountGroup> {
    // 校验账号类型参数
    this.validateAccountTypes(createDto.accountTypes);

    // 查询符合条件的账号ID
    const accountIds = await this.findEligibleAccounts(
      createDto.accountTypes,
      createDto.count,
      createDto.excludeAssociated,
      createDto.excludeInvalid,
      userId,
    );

    // 创建账号组
    const accountGroup = new AccountGroup();
    accountGroup.name = createDto.name;
    accountGroup.userId = userId;
    accountGroup.items = [];

    // 保存账号组
    const savedAccountGroup =
      await this.accountGroupRepository.save(accountGroup);

    // 创建账号组条目
    const accountGroupItems = accountIds.map((ids) => {
      const groupItem = new AccountGroupItem();
      groupItem.accountGroupId = savedAccountGroup.id;
      groupItem.discordAccountId = ids.discordAccountId || null;
      groupItem.emailAccountId = ids.emailAccountId || null;
      groupItem.evmWalletId = ids.evmWalletId || null;
      groupItem.twitterAccountId = ids.twitterAccountId || null;
      groupItem.proxyIpId = ids.proxyIpId || null;
      groupItem.browserFingerprintId = ids.browserFingerprintId || null;
      return groupItem;
    });

    await this.accountGroupItemRepository.save(accountGroupItems);

    return this.findOne(savedAccountGroup.id, userId);
  }

  /**
   * 验证账号类型
   * @param accountTypes 账号类型数组
   */
  private validateAccountTypes(accountTypes: AccountType[]): void {
    const mainAccountTypes = [
      AccountType.TWITTER,
      AccountType.DISCORD,
      AccountType.EMAIL,
      AccountType.WALLET,
    ];

    // 检查是否至少包含一个主要账号类型
    const hasMainType = accountTypes.some((type) =>
      mainAccountTypes.includes(type),
    );
    if (!hasMainType) {
      throw new BadRequestException(
        '账号类型至少需要包含 twitter、discord、email、wallet 中的一种',
      );
    }
  }

  /**
   * 查找符合条件的账号ID
   * @param accountTypes 账号类型数组
   * @param count 需要的账号数量
   * @param excludeAssociated 是否排除已关联的账号
   * @param excludeInvalid 是否排除状态为invalid的账号
   * @param userId 用户ID
   * @returns 符合条件的账号ID列表
   */
  private async findEligibleAccounts(
    accountTypes: AccountType[],
    count: number,
    excludeAssociated: boolean = false,
    excludeInvalid: boolean = false,
    userId: number,
  ): Promise<
    Array<{
      discordAccountId?: number;
      emailAccountId?: number;
      evmWalletId?: number;
      twitterAccountId?: number;
      proxyIpId?: number;
      browserFingerprintId?: number;
    }>
  > {
    // 获取各类型账号的ID
    const accountQueries = [];

    // Twitter账号
    if (accountTypes.includes(AccountType.TWITTER)) {
      accountQueries.push(
        this.getEligibleTwitterAccounts(
          excludeAssociated,
          excludeInvalid,
          userId,
        ),
      );
    }

    // Discord账号
    if (accountTypes.includes(AccountType.DISCORD)) {
      accountQueries.push(
        this.getEligibleDiscordAccounts(
          excludeAssociated,
          excludeInvalid,
          userId,
        ),
      );
    }

    // 邮箱账号
    if (accountTypes.includes(AccountType.EMAIL)) {
      accountQueries.push(
        this.getEligibleEmailAccounts(
          excludeAssociated,
          excludeInvalid,
          userId,
        ),
      );
    }

    // 钱包账号
    if (accountTypes.includes(AccountType.WALLET)) {
      accountQueries.push(
        this.getEligibleWalletAccounts(
          excludeAssociated,
          excludeInvalid,
          userId,
        ),
      );
    }

    // 代理IP
    if (accountTypes.includes(AccountType.IP)) {
      accountQueries.push(
        this.getEligibleProxyIps(excludeAssociated, excludeInvalid, userId),
      );
    }

    // 浏览器指纹
    if (accountTypes.includes(AccountType.BROWSER_FINGERPRINT)) {
      accountQueries.push(
        this.getEligibleBrowserFingerprints(
          excludeAssociated,
          excludeInvalid,
          userId,
        ),
      );
    }

    // 执行所有查询
    const results = await Promise.all(accountQueries);

    // 检查每种账号类型是否都有足够的数量
    results.forEach((result) => {
      if (result.ids.length < count) {
        throw new BadRequestException(
          `${this.getAccountTypeName(result.type)}账号数量不足，需要${count}个，但只找到${result.ids.length}个`,
        );
      }
    });

    // 合并结果
    const eligibleItems = [];
    for (let i = 0; i < count; i++) {
      const item: any = {};

      // 尝试添加每种类型的账号
      for (let j = 0; j < results.length; j++) {
        const accountData = results[j];
        if (
          accountData.type === AccountType.TWITTER &&
          accountData.ids.length > i
        ) {
          item.twitterAccountId = accountData.ids[i];
        } else if (
          accountData.type === AccountType.DISCORD &&
          accountData.ids.length > i
        ) {
          item.discordAccountId = accountData.ids[i];
        } else if (
          accountData.type === AccountType.EMAIL &&
          accountData.ids.length > i
        ) {
          item.emailAccountId = accountData.ids[i];
        } else if (
          accountData.type === AccountType.WALLET &&
          accountData.ids.length > i
        ) {
          item.evmWalletId = accountData.ids[i];
        } else if (
          accountData.type === AccountType.IP &&
          accountData.ids.length > i
        ) {
          item.proxyIpId = accountData.ids[i];
        } else if (
          accountData.type === AccountType.BROWSER_FINGERPRINT &&
          accountData.ids.length > i
        ) {
          item.browserFingerprintId = accountData.ids[i];
        }
      }

      // 检查是否有至少一个账号类型被添加
      if (
        item.twitterAccountId ||
        item.discordAccountId ||
        item.emailAccountId ||
        item.evmWalletId ||
        item.proxyIpId ||
        item.browserFingerprintId
      ) {
        eligibleItems.push(item);
      } else {
        // 如果没有足够的账号，则中断循环
        break;
      }
    }

    if (eligibleItems.length === 0) {
      throw new BadRequestException('没有找到符合条件的账号');
    }

    if (eligibleItems.length < count) {
      throw new BadRequestException(
        `只找到 ${eligibleItems.length} 个符合条件的账号，少于请求的 ${count} 个`,
      );
    }

    return eligibleItems;
  }

  /**
   * 获取账号类型的中文名称
   * @param type 账号类型
   * @returns 账号类型的中文名称
   */
  private getAccountTypeName(type: AccountType): string {
    switch (type) {
      case AccountType.TWITTER:
        return 'Twitter';
      case AccountType.DISCORD:
        return 'Discord';
      case AccountType.EMAIL:
        return '邮箱';
      case AccountType.WALLET:
        return '钱包';
      case AccountType.IP:
        return 'IP';
      case AccountType.BROWSER_FINGERPRINT:
        return '浏览器指纹';
      default:
        return '未知';
    }
  }

  /**
   * 获取符合条件的Twitter账号
   */
  private async getEligibleTwitterAccounts(
    excludeAssociated: boolean,
    excludeInvalid: boolean,
    userId: number,
  ): Promise<{ type: AccountType; ids: number[] }> {
    const queryBuilder = this.twitterAccountRepository
      .createQueryBuilder('account')
      .select('account.twitterId')
      .where('account.userId = :userId', { userId });

    // 排除已关联的账号
    if (excludeAssociated) {
      const subQuery = this.accountGroupItemRepository
        .createQueryBuilder('item')
        .select('item.twitterAccountId')
        .where('item.twitterAccountId IS NOT NULL');

      queryBuilder.andWhere(
        `account.twitterId NOT IN (${subQuery.getQuery()})`,
      );
    }

    // 排除状态为invalid的账号
    if (excludeInvalid) {
      queryBuilder.andWhere('account.status != :status', { status: 'invalid' });
    }

    const accounts = await queryBuilder.getMany();
    return {
      type: AccountType.TWITTER,
      ids: accounts.map((acc) => acc.twitterId),
    };
  }

  /**
   * 获取符合条件的Discord账号
   */
  private async getEligibleDiscordAccounts(
    excludeAssociated: boolean,
    excludeInvalid: boolean,
    userId: number,
  ): Promise<{ type: AccountType; ids: number[] }> {
    const queryBuilder = this.discordAccountRepository
      .createQueryBuilder('account')
      .select('account.discordId')
      .where('account.userId = :userId', { userId });

    // 排除已关联的账号
    if (excludeAssociated) {
      const subQuery = this.accountGroupItemRepository
        .createQueryBuilder('item')
        .select('item.discordAccountId')
        .where('item.discordAccountId IS NOT NULL');

      queryBuilder.andWhere(
        `account.discordId NOT IN (${subQuery.getQuery()})`,
      );
    }

    // 排除状态为invalid的账号
    if (excludeInvalid) {
      queryBuilder.andWhere('account.status != :status', { status: 'invalid' });
    }

    const accounts = await queryBuilder.getMany();
    return {
      type: AccountType.DISCORD,
      ids: accounts.map((acc) => acc.discordId),
    };
  }

  /**
   * 获取符合条件的Email账号
   */
  private async getEligibleEmailAccounts(
    excludeAssociated: boolean,
    excludeInvalid: boolean,
    userId: number,
  ): Promise<{ type: AccountType; ids: number[] }> {
    const queryBuilder = this.emailAccountRepository
      .createQueryBuilder('account')
      .select('account.emailId')
      .where('account.userId = :userId', { userId });

    // 排除已关联的账号
    if (excludeAssociated) {
      const subQuery = this.accountGroupItemRepository
        .createQueryBuilder('item')
        .select('item.emailAccountId')
        .where('item.emailAccountId IS NOT NULL');

      queryBuilder.andWhere(`account.emailId NOT IN (${subQuery.getQuery()})`);
    }

    // 排除状态为invalid的账号
    if (excludeInvalid) {
      queryBuilder.andWhere('account.status != :status', { status: 'invalid' });
    }

    const accounts = await queryBuilder.getMany();
    return {
      type: AccountType.EMAIL,
      ids: accounts.map((acc) => acc.emailId),
    };
  }

  /**
   * 获取符合条件的钱包账号
   */
  private async getEligibleWalletAccounts(
    excludeAssociated: boolean,
    excludeInvalid: boolean,
    userId: number,
  ): Promise<{ type: AccountType; ids: number[] }> {
    const queryBuilder = this.evmWalletRepository
      .createQueryBuilder('account')
      .select('account.walletId')
      .where('account.userId = :userId', { userId });

    // 排除已关联的账号
    if (excludeAssociated) {
      const subQuery = this.accountGroupItemRepository
        .createQueryBuilder('item')
        .select('item.evmWalletId')
        .where('item.evmWalletId IS NOT NULL');

      queryBuilder.andWhere(`account.walletId NOT IN (${subQuery.getQuery()})`);
    }

    // 排除状态为invalid的账号
    if (excludeInvalid) {
      queryBuilder.andWhere('account.status != :status', { status: 'invalid' });
    }

    const accounts = await queryBuilder.getMany();
    return {
      type: AccountType.WALLET,
      ids: accounts.map((acc) => acc.walletId),
    };
  }

  /**
   * 获取符合条件的代理IP
   */
  private async getEligibleProxyIps(
    excludeAssociated: boolean,
    excludeInvalid: boolean,
    userId: number,
  ): Promise<{ type: AccountType; ids: number[] }> {
    const queryBuilder = this.proxyIpRepository
      .createQueryBuilder('proxy')
      .where('proxy.userId = :userId', { userId })
      .andWhere('proxy.proxyType != :proxyType', { proxyType: 'socks5' }); // 排除 socks5 类型的代理

    // 排除已关联的代理IP
    if (excludeAssociated) {
      const subQuery = this.accountGroupItemRepository
        .createQueryBuilder('item')
        .select('item.proxyIpId')
        .where('item.proxyIpId IS NOT NULL');

      queryBuilder.andWhere(`proxy.proxyId NOT IN (${subQuery.getQuery()})`);
    }

    // 排除状态为invalid的代理IP
    if (excludeInvalid) {
      queryBuilder.andWhere('proxy.status != :status', { status: 'invalid' });
    }

    const proxies = await queryBuilder.getMany();
    return {
      type: AccountType.IP,
      ids: proxies.map((proxy) => proxy.proxyId),
    };
  }

  /**
   * 获取符合条件的浏览器指纹
   */
  private async getEligibleBrowserFingerprints(
    excludeAssociated: boolean,
    excludeInvalid: boolean,
    userId: number,
  ): Promise<{ type: AccountType; ids: number[] }> {
    const queryBuilder = this.browserFingerprintRepository
      .createQueryBuilder('fingerprint')
      .where('fingerprint.userId = :userId', { userId });

    // 排除已关联的浏览器指纹
    if (excludeAssociated) {
      const subQuery = this.accountGroupItemRepository
        .createQueryBuilder('item')
        .select('item.browserFingerprintId')
        .where('item.browserFingerprintId IS NOT NULL');

      queryBuilder.andWhere(`fingerprint.id NOT IN (${subQuery.getQuery()})`);
    }

    // 排除状态为invalid的浏览器指纹
    if (excludeInvalid) {
      queryBuilder.andWhere('fingerprint.status != :status', {
        status: 'invalid',
      });
    }

    const fingerprints = await queryBuilder.getMany();
    return {
      type: AccountType.BROWSER_FINGERPRINT,
      ids: fingerprints.map((fingerprint) => fingerprint.id),
    };
  }

  /**
   * 批量更新账号项中指定账号类型的状态
   * @param updateDto 包含账号项IDs、账号类型和目标状态的DTO
   * @param userId 用户ID
   * @returns 更新结果统计
   */
  async updateAccountItemsStatus(
    updateDto: UpdateAccountItemsStatusDto,
    userId: number,
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    accountTypes: { type: string; updated: number }[];
  }> {
    const { accountItemIds, accountTypes, status } = updateDto;

    // 验证账号项是否存在且属于当前用户
    const accountItems = await this.accountGroupItemRepository.find({
      where: {
        id: In(accountItemIds),
        accountGroup: { userId },
      },
      relations: ['accountGroup'],
    });

    if (accountItems.length === 0) {
      throw new BadRequestException('所选账号项不存在或不属于当前用户');
    }

    const result = {
      total: accountItemIds.length,
      success: 0,
      failed: 0,
      accountTypes: accountTypes.map((type) => ({ type, updated: 0 })),
    };

    // 批量更新各类型账号的状态
    for (const accountItem of accountItems) {
      for (const accountType of accountTypes) {
        try {
          let updated = false;

          switch (accountType) {
            case AccountItemType.EVM_WALLET:
              if (accountItem.evmWalletId) {
                await this.evmWalletRepository.update(
                  { walletId: accountItem.evmWalletId, userId },
                  { status },
                );
                updated = true;
              }
              break;
            case AccountItemType.TWITTER:
              if (accountItem.twitterAccountId) {
                await this.twitterAccountRepository.update(
                  { twitterId: accountItem.twitterAccountId, userId },
                  { status },
                );
                updated = true;
              }
              break;
            case AccountItemType.DISCORD:
              if (accountItem.discordAccountId) {
                await this.discordAccountRepository.update(
                  { discordId: accountItem.discordAccountId, userId },
                  { status },
                );
                updated = true;
              }
              break;
            case AccountItemType.EMAIL:
              if (accountItem.emailAccountId) {
                await this.emailAccountRepository.update(
                  { emailId: accountItem.emailAccountId, userId },
                  { status },
                );
                updated = true;
              }
              break;
            case AccountItemType.PROXY_IP:
              if (accountItem.proxyIpId) {
                await this.proxyIpRepository.update(
                  { proxyId: accountItem.proxyIpId, userId },
                  { status },
                );
                updated = true;
              }
              break;
            case AccountItemType.BROWSER_FINGERPRINT:
              if (accountItem.browserFingerprintId) {
                await this.browserFingerprintRepository.update(
                  { id: accountItem.browserFingerprintId, userId },
                  { status },
                );
                updated = true;
              }
              break;
          }

          if (updated) {
            result.success++;
            const typeIndex = result.accountTypes.findIndex(
              (t) => t.type === accountType,
            );
            if (typeIndex !== -1) {
              result.accountTypes[typeIndex].updated++;
            }
          }
        } catch (error) {
          result.failed++;
          console.error(
            `Failed to update ${accountType} status for item ${accountItem.id}:`,
            error,
          );
        }
      }
    }

    return result;
  }

  /**
   * 分页获取账号组关联的账号项
   * @param id 账号组ID
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @param accountType 账号类型
   * @param accountStatus 账号状态
   * @returns 分页结果
   */
  async findGroupItems(
    id: number,
    userId: number,
    page: number = 1,
    pageSize: number = 10,
    accountType?: string,
    accountStatus?: AccountStatus,
  ): Promise<{
    accountGroup: AccountGroup;
    items: AccountGroupItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    // 验证账号组是否存在且属于当前用户
    const accountGroup = await this.accountGroupRepository.findOne({
      where: { id, userId },
      select: ['id', 'name', 'userId', 'updatedAt', 'createdAt'],
    });

    if (!accountGroup) {
      throw new BadRequestException(`账号组ID"${id}"不存在或不属于当前用户`);
    }

    // 查询关联的账号项
    const queryBuilder = this.accountGroupItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.discordAccount', 'discordAccount')
      .leftJoinAndSelect('item.emailAccount', 'emailAccount')
      .leftJoinAndSelect('item.evmWallet', 'evmWallet')
      .leftJoinAndSelect('item.twitterAccount', 'twitterAccount')
      .leftJoinAndSelect('item.proxyIp', 'proxyIp')
      .leftJoinAndSelect('item.browserFingerprint', 'browserFingerprint')
      .where('item.accountGroupId = :accountGroupId', { accountGroupId: id });

    // 根据账号类型和状态添加过滤条件
    switch (accountType) {
      case 'evmWallet':
        queryBuilder.andWhere('item.evmWalletId IS NOT NULL');
        if (accountStatus) {
          queryBuilder.andWhere('evmWallet.status = :status', {
            status: accountStatus,
          });
        }
        break;
      case 'twitter':
        queryBuilder.andWhere('item.twitterAccountId IS NOT NULL');
        if (accountStatus) {
          queryBuilder.andWhere('twitterAccount.status = :status', {
            status: accountStatus,
          });
        }
        break;
      case 'discord':
        queryBuilder.andWhere('item.discordAccountId IS NOT NULL');
        if (accountStatus) {
          queryBuilder.andWhere('discordAccount.status = :status', {
            status: accountStatus,
          });
        }
        break;
      case 'email':
        queryBuilder.andWhere('item.emailAccountId IS NOT NULL');
        if (accountStatus) {
          queryBuilder.andWhere('emailAccount.status = :status', {
            status: accountStatus,
          });
        }
        break;
      case 'proxyIp':
        queryBuilder.andWhere('item.proxyIpId IS NOT NULL');
        if (accountStatus) {
          queryBuilder.andWhere('proxyIp.status = :status', {
            status: accountStatus,
          });
        }
        break;
      case 'browserFingerprint':
        queryBuilder.andWhere('item.browserFingerprintId IS NOT NULL');
        if (accountStatus) {
          queryBuilder.andWhere('browserFingerprint.status = :status', {
            status: accountStatus,
          });
        }
        break;
      default:
        break;
    }

    // 获取总数和分页数据
    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      accountGroup,
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 批量更换账号项关联的账号资源
   * @param replaceDto 包含账号项IDs和账号类型的DTO
   * @param userId 用户ID
   * @returns 替换结果统计
   */
  async replaceAccountItemsResource(
    replaceDto: ReplaceAccountItemsResourceDto,
    userId: number,
  ): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    const {
      accountItemIds,
      accountType,
      excludeAssociated,
      excludeInvalid,
      replaceIfExists = true,
    } = replaceDto;

    // 验证账号项是否存在且属于当前用户
    const accountItems = await this.accountGroupItemRepository.find({
      where: {
        id: In(accountItemIds),
        accountGroup: { userId },
      },
      relations: ['accountGroup'],
    });

    if (accountItems.length === 0) {
      throw new BadRequestException('所选账号项不存在或不属于当前用户');
    }

    // 获取符合条件的账号资源
    let eligibleAccounts: { type: any; ids: number[] };
    const accountsNeeded = accountItems.length;

    // 统计需要更换的账号数量
    switch (accountType) {
      case AccountResourceType.TWITTER:
        eligibleAccounts = await this.getEligibleTwitterAccounts(
          excludeAssociated,
          excludeInvalid,
          userId,
        );
        break;
      case AccountResourceType.DISCORD:
        eligibleAccounts = await this.getEligibleDiscordAccounts(
          excludeAssociated,
          excludeInvalid,
          userId,
        );
        break;
      case AccountResourceType.EMAIL:
        eligibleAccounts = await this.getEligibleEmailAccounts(
          excludeAssociated,
          excludeInvalid,
          userId,
        );
        break;
      case AccountResourceType.EVM_WALLET:
        eligibleAccounts = await this.getEligibleWalletAccounts(
          excludeAssociated,
          excludeInvalid,
          userId,
        );
        break;
      case AccountResourceType.PROXY_IP:
        eligibleAccounts = await this.getEligibleProxyIps(
          excludeAssociated,
          excludeInvalid,
          userId,
        );
        break;
      case AccountResourceType.BROWSER_FINGERPRINT:
        eligibleAccounts = await this.getEligibleBrowserFingerprints(
          excludeAssociated,
          excludeInvalid,
          userId,
        );
        break;
      default:
        throw new BadRequestException('不支持的账号类型');
    }

    // 检查是否有足够的账号资源
    if (eligibleAccounts.ids.length < accountsNeeded) {
      throw new BadRequestException(
        `${this.getAccountTypeName(eligibleAccounts.type)}账号资源不足，需要${accountsNeeded}个，但只找到${eligibleAccounts.ids.length}个`,
      );
    }

    // 批量更新账号项关联的账号资源
    const result = {
      total: accountsNeeded,
      success: 0,
      failed: 0,
    };

    let accountIndex = 0;
    for (const accountItem of accountItems) {
      try {
        // 如果 replaceIfExists 为 false，且当前账号项的目标资源字段已有值，则跳过
        let hasValue = false;
        switch (accountType) {
          case AccountResourceType.EVM_WALLET:
            hasValue = !!accountItem.evmWalletId;
            break;
          case AccountResourceType.TWITTER:
            hasValue = !!accountItem.twitterAccountId;
            break;
          case AccountResourceType.DISCORD:
            hasValue = !!accountItem.discordAccountId;
            break;
          case AccountResourceType.EMAIL:
            hasValue = !!accountItem.emailAccountId;
            break;
          case AccountResourceType.PROXY_IP:
            hasValue = !!accountItem.proxyIpId;
            break;
          case AccountResourceType.BROWSER_FINGERPRINT:
            hasValue = !!accountItem.browserFingerprintId;
            break;
        }
        if (replaceIfExists === false && hasValue) {
          continue;
        }

        let updated = false;

        switch (accountType) {
          case AccountResourceType.EVM_WALLET:
            accountItem.evmWalletId = eligibleAccounts.ids[accountIndex++];
            updated = true;
            break;
          case AccountResourceType.TWITTER:
            accountItem.twitterAccountId = eligibleAccounts.ids[accountIndex++];
            updated = true;
            break;
          case AccountResourceType.DISCORD:
            accountItem.discordAccountId = eligibleAccounts.ids[accountIndex++];
            updated = true;
            break;
          case AccountResourceType.EMAIL:
            accountItem.emailAccountId = eligibleAccounts.ids[accountIndex++];
            updated = true;
            break;
          case AccountResourceType.PROXY_IP:
            accountItem.proxyIpId = eligibleAccounts.ids[accountIndex++];
            updated = true;
            break;
          case AccountResourceType.BROWSER_FINGERPRINT:
            accountItem.browserFingerprintId =
              eligibleAccounts.ids[accountIndex++];
            updated = true;
            break;
        }

        if (updated) {
          await this.accountGroupItemRepository.save(accountItem);
          result.success++;
        }
      } catch (error) {
        result.failed++;
        console.error(
          `更换账号项 ${accountItem.id} 的 ${accountType} 资源失败:`,
          error,
        );
      }
    }

    return result;
  }

  /**
   * 全量更换账号组下所有账号项关联的账号资源
   * @param replaceDto 包含账号组ID和账号类型的DTO
   * @param userId 用户ID
   * @returns 替换结果统计
   */
  async replaceAllAccountItemsResource(
    replaceDto: ReplaceAllAccountItemsResourceDto,
    userId: number,
  ): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    const { accountGroupId, accountType, excludeAssociated, excludeInvalid } =
      replaceDto;

    // 检查账号组是否存在且属于当前用户
    const accountGroup = await this.accountGroupRepository.findOne({
      where: { id: accountGroupId, userId },
    });

    if (!accountGroup) {
      throw new BadRequestException(
        `账号组ID"${accountGroupId}"不存在或不属于当前用户`,
      );
    }

    // 获取账号组下所有的账号项IDs
    const accountItems = await this.accountGroupItemRepository.find({
      where: { accountGroupId },
      select: ['id'],
    });

    if (accountItems.length === 0) {
      throw new BadRequestException(
        `账号组ID"${accountGroupId}"下没有任何账号项`,
      );
    }

    const accountItemIds = accountItems.map((item) => item.id);

    // 调用replaceAccountItemsResource方法进行替换
    const result = await this.replaceAccountItemsResource(
      {
        accountItemIds,
        accountType,
        excludeAssociated,
        excludeInvalid,
        replaceIfExists: false,
      },
      userId,
    );

    return result;
  }
}
