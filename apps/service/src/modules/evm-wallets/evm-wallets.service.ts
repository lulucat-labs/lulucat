import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EvmWallet } from './entities/evm-wallet.entity';
import { CreateEvmWalletDto } from './dto/create-evm-wallet.dto';
import { QueryEvmWalletDto } from './dto/query-evm-wallet.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { ethers } from 'ethers';
import { AccountGroupsService } from '../account-groups/account-groups.service';
import { getEthBalance } from '@lulucat/tdk/wallet';
import { UpdateEvmWalletDto } from './dto/update-evm-wallet.dto';

@Injectable()
export class EvmWalletsService {
  constructor(
    @InjectRepository(EvmWallet)
    private readonly evmWalletRepository: Repository<EvmWallet>,
    private readonly accountGroupsService: AccountGroupsService,
  ) {}

  /**
   * 创建EVM钱包
   */
  async create(
    userId: number,
    createEvmWalletDto: CreateEvmWalletDto,
  ): Promise<EvmWallet> {
    console.log('Creating wallet with userId:', userId);
    console.log('Wallet data:', createEvmWalletDto);

    const existingWallet = await this.evmWalletRepository.findOne({
      where: { walletAddress: createEvmWalletDto.walletAddress },
    });

    if (existingWallet) {
      throw new ConflictException('钱包地址已存在');
    }

    const wallet = this.evmWalletRepository.create({
      userId,
      ...createEvmWalletDto,
    });

    console.log('Wallet entity before save:', wallet);
    return this.evmWalletRepository.save(wallet);
  }

  /**
   * 查询EVM钱包列表
   */
  async findAll(
    userId: number,
    query: QueryEvmWalletDto,
  ): Promise<PaginatedResponseDto<EvmWallet>> {
    const queryBuilder = this.evmWalletRepository
      .createQueryBuilder('wallet')
      .where('wallet.userId = :userId', { userId });

    // 按钱包地址查询
    if (query.walletAddress) {
      queryBuilder.andWhere('wallet.walletAddress = :walletAddress', {
        walletAddress: query.walletAddress,
      });
    }

    // 按最小余额查询
    if (query.minBalance !== undefined) {
      // 使用CAST和COALESCE处理可能为null的balance
      // 对于PostgreSQL数据库
      queryBuilder.andWhere(
        'COALESCE(CAST(wallet.balance AS DECIMAL(36, 18)), 0) >= :minBalance',
        {
          minBalance: query.minBalance,
        },
      );
    }

    // 按最大余额查询
    if (query.maxBalance !== undefined) {
      queryBuilder.andWhere(
        'COALESCE(CAST(wallet.balance AS DECIMAL(36, 18)), 0) <= :maxBalance',
        {
          maxBalance: query.maxBalance,
        },
      );
    }

    const [wallets, total] = await queryBuilder
      .skip(query.actualSkip)
      .take(query.actualTake)
      .getManyAndCount();

    console.log('Query result:', {
      total,
      itemsCount: wallets.length,
      skip: query.actualSkip,
      take: query.actualTake,
      minBalance: query.minBalance,
      maxBalance: query.maxBalance,
    });

    return new PaginatedResponseDto(wallets, total);
  }

  /**
   * 获取单个EVM钱包
   */
  async findOne(userId: number, walletId: number): Promise<EvmWallet> {
    const wallet = await this.evmWalletRepository.findOne({
      where: { userId, walletId },
    });

    if (!wallet) {
      throw new NotFoundException('钱包不存在');
    }

    return wallet;
  }

  /**
   * 删除EVM钱包
   */
  async remove(userId: number, walletId: number): Promise<void> {
    const isInUse = await this.accountGroupsService.isResourceInUse(
      'evmWalletId',
      walletId,
    );
    if (isInUse) {
      throw new BadRequestException('该EVM钱包已被账号组使用，无法删除');
    }
    const result = await this.evmWalletRepository.delete({
      userId,
      walletId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('EVM钱包不存在');
    }
  }

  /**
   * 批量删除EVM钱包
   */
  async removeMany(userId: number, walletIds: number[]): Promise<void> {
    await this.evmWalletRepository.delete({
      userId,
      walletId: In(walletIds),
    });
  }

  /**
   * 处理导入的钱包数据
   */
  async processImportedWallet(userId: number, line: string): Promise<void> {
    const [walletAddress, privateKey] = line.split('——');

    if (!walletAddress || !privateKey) {
      throw new Error('无效的数据格式');
    }

    const createDto = new CreateEvmWalletDto();
    createDto.walletAddress = walletAddress.trim();
    createDto.privateKey = privateKey.trim();

    await this.create(userId, createDto);
  }

  /**
   * 格式化导出的钱包数据
   */
  formatWalletForExport(wallet: EvmWallet): string {
    return `${wallet.walletAddress}——${wallet.getDecryptedPrivateKey()}`;
  }

  /**
   * 获取要导出的钱包列表
   */
  async findWalletsForExport(
    userId: number,
    walletIds?: number[],
  ): Promise<EvmWallet[]> {
    const queryBuilder = this.evmWalletRepository
      .createQueryBuilder('wallet')
      .where('wallet.userId = :userId', { userId });

    if (walletIds?.length) {
      queryBuilder.andWhereInIds(walletIds);
    }

    return queryBuilder.getMany();
  }

  /**
   * 批量生成EVM钱包
   */
  async generateWallets(userId: number, count: number): Promise<EvmWallet[]> {
    const wallets: EvmWallet[] = [];

    for (let i = 0; i < count; i++) {
      const wallet = ethers.Wallet.createRandom();
      const createDto = new CreateEvmWalletDto();
      createDto.walletAddress = wallet.address;
      createDto.privateKey = wallet.privateKey;

      const evmWallet = await this.create(userId, createDto);
      wallets.push(evmWallet);
    }

    return wallets;
  }

  /**
   * 更新钱包余额
   * @param walletId 钱包ID
   * @param balance 余额字符串
   */
  async updateBalance(walletId: number, balance: string): Promise<EvmWallet> {
    const wallet = await this.evmWalletRepository.findOne({
      where: { walletId },
    });

    if (!wallet) {
      throw new NotFoundException(`钱包 ID ${walletId} 不存在`);
    }

    wallet.balance = balance;
    return this.evmWalletRepository.save(wallet);
  }

  /**
   * 获取并更新钱包余额
   * @param walletId 钱包ID
   */
  async fetchAndUpdateBalance(walletId: number): Promise<EvmWallet> {
    const wallet = await this.evmWalletRepository.findOne({
      where: { walletId },
    });

    if (!wallet) {
      throw new NotFoundException(`钱包 ID ${walletId} 不存在`);
    }

    try {
      const balanceResult = await getEthBalance(wallet.walletAddress);
      wallet.balance = balanceResult.totalBalance.toString();
      return this.evmWalletRepository.save(wallet);
    } catch (error) {
      throw new BadRequestException(`获取钱包余额失败: ${error.message}`);
    }
  }

  /**
   * 批量更新钱包余额 - 异步执行，带速率限制（每秒3个请求）
   * @param walletIds 钱包ID数组, 为空则更新所有钱包
   * @param userId 用户ID, 为空则更新所有用户的钱包
   */
  async batchUpdateBalancesAsync(
    walletIds?: number[],
    userId?: number,
  ): Promise<void> {
    // 如果未提供钱包ID，则获取所有钱包
    let wallets: EvmWallet[] = [];

    try {
      if (walletIds && walletIds.length > 0) {
        // 如果提供了钱包ID列表，则按ID查询
        wallets = await this.evmWalletRepository.find({
          where: { walletId: In(walletIds) },
        });
      } else {
        // 如果提供了用户ID，则按用户ID查询
        if (userId) {
          console.log(`查询用户 ${userId} 的所有钱包`);
          wallets = await this.evmWalletRepository.find({
            where: { userId },
          });
        } else {
          // 否则获取所有钱包
          console.log('查询所有钱包');
          wallets = await this.evmWalletRepository.find();
        }
      }

      if (!wallets.length) {
        console.log('没有找到需要更新的钱包');
        return;
      }

      console.log(`开始批量更新 ${wallets.length} 个钱包余额，每秒处理3个请求`);

      // 创建处理队列，使用速率限制
      const processWallets = async () => {
        // 每批处理3个钱包
        const batchSize = 3;
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < wallets.length; i += batchSize) {
          const batch = wallets.slice(i, i + batchSize);
          console.log(
            `处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(wallets.length / batchSize)}, 钱包数: ${batch.length}`,
          );

          // 并行处理当前批次
          const results = await Promise.allSettled(
            batch.map(async (wallet) => {
              try {
                console.log(`正在更新钱包 ${wallet.walletAddress} 的余额`);
                const balanceResult = await getEthBalance(wallet.walletAddress);
                await this.evmWalletRepository.update(wallet.walletId, {
                  balance: balanceResult.totalBalance.toString(),
                });
                console.log(
                  `钱包 ${wallet.walletAddress} 余额更新成功: ${balanceResult.totalBalance} ETH`,
                );
                return true;
              } catch (error) {
                console.error(
                  `更新钱包 ${wallet.walletAddress} 余额失败:`,
                  error,
                );
                return false;
              }
            }),
          );

          // 统计成功和失败的数量
          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value === true) {
              successCount++;
            } else {
              failCount++;
            }
          });

          // 如果还有更多钱包需要处理，等待1秒再继续
          if (i + batchSize < wallets.length) {
            console.log(`等待1秒后继续处理下一批钱包...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        console.log(
          `所有钱包余额更新完成。成功: ${successCount}, 失败: ${failCount}, 总计: ${wallets.length}`,
        );
      };

      // 异步执行，不等待结果
      processWallets().catch((err) => {
        console.error('批量更新钱包余额时发生错误:', err);
      });
    } catch (error) {
      console.error('准备批量更新钱包余额时发生错误:', error);
    }
  }

  /**
   * 按钱包地址查找钱包
   */
  async findByAddress(walletAddress: string): Promise<EvmWallet> {
    const wallet = await this.evmWalletRepository.findOne({
      where: { walletAddress },
    });

    if (!wallet) {
      throw new NotFoundException(`钱包地址 ${walletAddress} 不存在`);
    }

    return wallet;
  }

  /**
   * 更新单个EVM钱包
   */
  async update(
    userId: number,
    walletId: number,
    updateEvmWalletDto: UpdateEvmWalletDto,
  ): Promise<EvmWallet> {
    const wallet = await this.evmWalletRepository.findOne({
      where: { userId, walletId },
    });

    if (!wallet) {
      throw new NotFoundException('钱包不存在');
    }

    // 如果更新钱包地址，需要检查新地址是否已存在
    if (
      updateEvmWalletDto.walletAddress &&
      updateEvmWalletDto.walletAddress !== wallet.walletAddress
    ) {
      const existingWallet = await this.evmWalletRepository.findOne({
        where: { walletAddress: updateEvmWalletDto.walletAddress },
      });

      if (existingWallet) {
        throw new ConflictException('钱包地址已存在');
      }
    }

    Object.assign(wallet, updateEvmWalletDto);

    return this.evmWalletRepository.save(wallet);
  }
}
