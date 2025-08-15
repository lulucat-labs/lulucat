import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProxyIp } from './entities/proxy-ip.entity';
import { CreateProxyIpDto } from './dto/create-proxy-ip.dto';
import { QueryProxyIpDto } from './dto/query-proxy-ip.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import axios from 'axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { MemoryTasksService } from '../memory-tasks/memory-tasks.service';
import { MemoryTaskStatus } from '../memory-tasks/types/memory-task.type';
import { UpdateProxyIpDto } from './dto/update-proxy-ip.dto';
import { AccountGroupItem } from '../account-groups/entities/account-group-item.entity';
import { AccountGroupsService } from '../account-groups/account-groups.service';

@Injectable()
export class ProxyIpsService {
  @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger;

  constructor(
    @InjectRepository(ProxyIp)
    private readonly proxyIpRepository: Repository<ProxyIp>,
    @InjectRepository(AccountGroupItem)
    private readonly accountGroupItemRepository: Repository<AccountGroupItem>,
    private readonly memoryTasksService: MemoryTasksService,
    private readonly accountGroupsService: AccountGroupsService,
  ) {}

  /**
   * 创建代理IP
   */
  async create(
    userId: number,
    createProxyIpDto: CreateProxyIpDto,
  ): Promise<ProxyIp> {
    const existingProxy = await this.proxyIpRepository.findOne({
      where: {
        ipAddress: createProxyIpDto.ipAddress,
        port: createProxyIpDto.port,
      },
    });

    if (existingProxy) {
      throw new ConflictException('代理IP已存在');
    }

    const proxy = this.proxyIpRepository.create({
      userId,
      ...createProxyIpDto,
    });

    return this.proxyIpRepository.save(proxy);
  }

  /**
   * 查询代理IP列表
   */
  async findAll(
    userId: number,
    query: QueryProxyIpDto,
  ): Promise<PaginatedResponseDto<ProxyIp>> {
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

    // 使用QueryBuilder以支持关联账号组的过滤
    const queryBuilder = this.proxyIpRepository
      .createQueryBuilder('proxy')
      .where('proxy.userId = :userId', { userId });

    // 添加基本条件
    if (query.ipAddress) {
      queryBuilder.andWhere('proxy.ipAddress LIKE :ipAddress', {
        ipAddress: `%${query.ipAddress}%`,
      });
    }
    if (query.proxyType) {
      queryBuilder.andWhere('proxy.proxyType = :proxyType', {
        proxyType: query.proxyType,
      });
    }
    if (query.location) {
      queryBuilder.andWhere('proxy.location LIKE :location', {
        location: `%${query.location}%`,
      });
    }
    if (query.status) {
      queryBuilder.andWhere('proxy.status = :status', {
        status: query.status,
      });
    }

    // 添加日期范围条件
    if (query.createdAtStart) {
      queryBuilder.andWhere('proxy.createdAt >= :createdAtStart', {
        createdAtStart: query.createdAtStart,
      });
    }
    if (query.createdAtEnd) {
      const endDate = new Date(query.createdAtEnd);
      endDate.setHours(23, 59, 59, 999); // 设置为当天结束时间
      queryBuilder.andWhere('proxy.createdAt <= :createdAtEnd', {
        createdAtEnd: endDate,
      });
    }

    // 处理关联账号组的筛选条件
    if (query.hasAccountGroup !== undefined) {
      // 查找所有关联到账号组的代理IP的ID
      const linkedProxies = await this.accountGroupItemRepository
        .createQueryBuilder('item')
        .select('item.proxyIpId')
        .innerJoin('item.accountGroup', 'group')
        .where('group.userId = :userId', { userId })
        .andWhere('item.proxyIpId IS NOT NULL')
        .getRawMany();

      const linkedProxyIds = linkedProxies
        .map((item) => item.item_proxy_ip_id)
        .filter((id) => id !== null);

      this.logger.debug(
        `关联账号组筛选: hasAccountGroup=${query.hasAccountGroup}, 找到的代理IP IDs: ${JSON.stringify(linkedProxyIds)}`,
      );

      if (query.hasAccountGroup === true) {
        // 筛选关联了账号组的代理IP
        if (linkedProxyIds.length > 0) {
          queryBuilder.andWhere('proxy.proxyId IN (:...linkedProxyIds)', {
            linkedProxyIds,
          });
        } else {
          // 如果没有关联的代理IP，但要求关联，则返回空结果
          queryBuilder.andWhere('1 = 0');
        }
      } else if (query.hasAccountGroup === false) {
        // 筛选未关联账号组的代理IP
        if (linkedProxyIds.length > 0) {
          queryBuilder.andWhere('proxy.proxyId NOT IN (:...linkedProxyIds)', {
            linkedProxyIds,
          });
        }
        // 如果没有关联的代理IP，则所有代理IP都是未关联的，不需要额外条件
      }
    }

    // 添加分页
    queryBuilder.skip(query.actualSkip).take(query.actualTake);

    const [items, total] = await queryBuilder.getManyAndCount();

    // 获取所有关联到账号组的代理IP的ID
    const linkedProxies = await this.accountGroupItemRepository
      .createQueryBuilder('item')
      .select('item.proxyIpId')
      .innerJoin('item.accountGroup', 'group')
      .where('group.userId = :userId', { userId })
      .andWhere('item.proxyIpId IS NOT NULL')
      .getRawMany();

    const linkedProxyIds = linkedProxies
      .map((item) => item.item_proxy_ip_id)
      .filter((id) => id !== null);

    // 为每条记录添加hasAccountGroup字段
    const enrichedItems = items.map((item) => ({
      ...item,
      hasAccountGroup: linkedProxyIds.includes(item.proxyId),
    }));

    return new PaginatedResponseDto(enrichedItems, total);
  }

  /**
   * 获取单个代理IP
   */
  async findOne(userId: number, proxyId: number): Promise<ProxyIp> {
    const proxy = await this.proxyIpRepository.findOne({
      where: { userId, proxyId },
    });

    if (!proxy) {
      throw new NotFoundException('代理IP不存在');
    }

    return proxy;
  }

  /**
   * 删除代理IP
   */
  async remove(userId: number, proxyId: number): Promise<void> {
    const isInUse = await this.accountGroupsService.isResourceInUse(
      'proxyIpId',
      proxyId,
    );
    if (isInUse) {
      throw new BadRequestException('该代理IP已被项目使用，无法删除');
    }
    const result = await this.proxyIpRepository.delete({ userId, proxyId });
    if (result.affected === 0) {
      throw new NotFoundException('代理IP不存在');
    }
  }

  /**
   * 批量删除代理IP
   */
  async removeMany(userId: number, proxyIds: number[]): Promise<void> {
    // 检查所有要删除的代理IP是否有被项目使用的
    for (const proxyId of proxyIds) {
      const isInUse = await this.accountGroupsService.isResourceInUse(
        'proxyIpId',
        proxyId,
      );
      if (isInUse) {
        throw new BadRequestException(
          `代理IP(ID: ${proxyId})已被项目使用，无法删除`,
        );
      }
    }
    await this.proxyIpRepository.delete({
      userId,
      proxyId: In(proxyIds),
    });
  }

  /**
   * 处理导入的代理IP数据
   */
  async processImportedProxy(userId: number, line: string): Promise<void> {
    const [ipAddress, port, username, password, proxyType, location] =
      line.split('——');

    if (!ipAddress || !port) {
      throw new Error('无效的数据格式');
    }

    const createDto = new CreateProxyIpDto();
    createDto.ipAddress = ipAddress.trim();
    createDto.port = parseInt(port.trim(), 10);
    createDto.username = username?.trim();
    createDto.password = password?.trim();
    createDto.proxyType = (proxyType?.trim() || 'http') as 'http' | 'socks5';
    createDto.location = location?.trim();

    await this.create(userId, createDto);
  }

  /**
   * 开始导入代理IP任务，并返回任务ID
   */
  async startImportTask(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ taskId: string }> {
    // 创建一个新的内存任务
    const task = this.memoryTasksService.createTask({
      name: `导入代理IP - ${file.originalname}`,
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
        message: `开始导入 ${lines.length} 条记录...`,
      });

      // 处理统计信息
      let success = 0;
      const errors = [];

      // 逐行处理
      for (let i = 0; i < lines.length; i++) {
        try {
          await this.processImportedProxy(userId, lines[i]);
          success++;

          // 每处理10条记录更新一次状态
          if (i % 10 === 0 || i === lines.length - 1) {
            this.memoryTasksService.updateTask(taskId, {
              message: `已处理 ${i + 1}/${lines.length} 条记录...`,
            });
          }
        } catch (err) {
          this.logger.error(`导入代理IP失败 (行 ${i + 1}): ${err.message}`);
          errors.push(`行 ${i + 1}: ${err.message}`);
        }
      }

      // 完成导入，更新最终结果
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.COMPLETED,
        message: `导入完成: 成功 ${success}/${lines.length} 条记录${errors.length > 0 ? ', 失败 ' + errors.length + ' 条' : ''}`,
      });
    } catch (error) {
      // 处理整体错误
      this.logger.error(`导入代理IP任务失败: ${error.message}`);
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.FAILED,
        message: `导入失败: ${error.message}`,
      });
    }
  }

  /**
   * 格式化导出的代理IP数据
   */
  formatProxyForExport(proxy: ProxyIp): string {
    const parts = [
      proxy.ipAddress,
      proxy.port.toString(),
      proxy.username || '',
      proxy.password || '',
      proxy.proxyType,
      proxy.location || '',
    ];

    return parts.join('——');
  }

  /**
   * 获取要导出的代理IP列表
   */
  async findProxiesForExport(
    userId: number,
    proxyIds?: number[],
  ): Promise<ProxyIp[]> {
    const queryBuilder = this.proxyIpRepository
      .createQueryBuilder('proxy')
      .where('proxy.userId = :userId', { userId });

    if (proxyIds?.length) {
      queryBuilder.andWhereInIds(proxyIds);
    }

    return queryBuilder.getMany();
  }

  /**
   * 获取单个 IP 的详细信息
   */
  private async getIpInfo(ipAddress: string): Promise<any> {
    try {
      const response = await axios.get(`https://ipinfo.io/${ipAddress}/json`);
      return response.data;
    } catch (error) {
      this.logger.error(`获取 IP ${ipAddress} 信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新 IP 信息到数据库
   */
  private async updateIpInfoInDb(proxy: ProxyIp, ipInfo: any): Promise<void> {
    try {
      const [latitude, longitude] = (ipInfo.loc || '').split(',').map(Number);

      proxy.city = ipInfo.city;
      proxy.region = ipInfo.region;
      proxy.country = ipInfo.country;
      proxy.latitude = latitude || null;
      proxy.longitude = longitude || null;
      proxy.org = ipInfo.org;
      proxy.postal = ipInfo.postal;
      proxy.timezone = ipInfo.timezone;
      proxy.location =
        `${ipInfo.city || ''}, ${ipInfo.region || ''}, ${ipInfo.country || ''}`
          .replace(/^, /, '')
          .replace(/, $/, '');
      proxy.ipInfoUpdatedAt = new Date();

      await this.proxyIpRepository.save(proxy);
    } catch (error) {
      this.logger.error(
        `更新 IP ${proxy.ipAddress} 信息到数据库失败: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 开始更新代理IP信息任务，并返回任务ID
   * @param proxyIds 可选，仅更新指定 proxyId
   */
  async startUpdateIpInfoTask(
    proxyIds?: number[],
  ): Promise<{ taskId: string }> {
    // 创建一个新的内存任务
    const task = this.memoryTasksService.createTask({
      name: '更新代理IP信息',
      message: '正在准备更新IP信息...',
    });

    // 异步处理更新操作
    this.processUpdateIpInfoInBackground(task.id, proxyIds);

    return { taskId: task.id };
  }

  /**
   * 在后台处理更新IP信息操作
   * @param proxyIds 可选，仅更新指定 proxyId
   */
  private async processUpdateIpInfoInBackground(
    taskId: string,
    proxyIds?: number[],
  ): Promise<void> {
    try {
      // 开始处理更新
      this.memoryTasksService.updateTask(taskId, {
        message: '正在查询需要更新的IP...',
      });

      let proxies: ProxyIp[];
      if (proxyIds && proxyIds.length > 0) {
        proxies = await this.proxyIpRepository.find({
          where: { proxyId: In(proxyIds) },
        });
      } else {
        proxies = await this.proxyIpRepository.find();
      }
      const total = proxies.length;

      // 更新任务状态
      this.memoryTasksService.updateTask(taskId, {
        message: `开始更新 ${total} 个IP的信息...`,
      });

      // 处理统计信息
      let success = 0;
      const errors = [];

      for (const proxy of proxies) {
        try {
          // 检查是否需要更新（24小时内更新过的跳过）
          if (
            proxy.ipInfoUpdatedAt &&
            Date.now() - proxy.ipInfoUpdatedAt.getTime() < 24 * 60 * 60 * 1000
          ) {
            success++;

            // 每处理10条记录更新一次状态
            if (success % 10 === 0 || success === total) {
              this.memoryTasksService.updateTask(taskId, {
                message: `已处理 ${success}/${total} 个IP...`,
              });
            }

            continue;
          }

          const ipInfo = await this.getIpInfo(proxy.ipAddress);
          await this.updateIpInfoInDb(proxy, ipInfo);

          // 添加延迟以避免请求过快
          await new Promise((resolve) => setTimeout(resolve, 1000));

          success++;

          // 每处理10条记录更新一次状态
          if (success % 10 === 0 || success === total) {
            this.memoryTasksService.updateTask(taskId, {
              message: `已处理 ${success}/${total} 个IP...`,
            });
          }
        } catch (error) {
          errors.push(proxy.ipAddress);
          this.logger.error(
            `处理 IP ${proxy.ipAddress} 失败: ${error.message}`,
          );
        }
      }

      // 完成更新，更新最终结果
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.COMPLETED,
        message: `更新完成: 成功 ${success}/${total} 个IP${errors.length > 0 ? ', 失败 ' + errors.length + ' 个' : ''}`,
      });
    } catch (error) {
      // 处理整体错误
      this.logger.error(`更新IP信息任务失败: ${error.message}`);
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.FAILED,
        message: `更新失败: ${error.message}`,
      });
    }
  }

  /**
   * 更新单个代理IP
   */
  async update(
    userId: number,
    proxyId: number,
    updateProxyIpDto: UpdateProxyIpDto,
  ): Promise<ProxyIp> {
    const proxy = await this.proxyIpRepository.findOne({
      where: { userId, proxyId },
    });

    if (!proxy) {
      throw new NotFoundException('代理IP不存在');
    }

    // 如果更新IP地址和端口，需要检查是否与其他代理冲突
    if (
      (updateProxyIpDto.ipAddress || updateProxyIpDto.port) &&
      (updateProxyIpDto.ipAddress !== proxy.ipAddress ||
        updateProxyIpDto.port !== proxy.port)
    ) {
      const checkIpAddress = updateProxyIpDto.ipAddress || proxy.ipAddress;
      const checkPort = updateProxyIpDto.port || proxy.port;

      const existingProxy = await this.proxyIpRepository.findOne({
        where: {
          ipAddress: checkIpAddress,
          port: checkPort,
        },
      });

      if (existingProxy && existingProxy.proxyId !== proxy.proxyId) {
        throw new ConflictException('代理IP已存在');
      }
    }

    Object.assign(proxy, updateProxyIpDto);

    return this.proxyIpRepository.save(proxy);
  }
}
