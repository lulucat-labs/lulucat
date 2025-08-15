import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrowserFingerprint } from './entities/browser-fingerprint.entity';
import { CreateBrowserFingerprintDto } from './dto/create-browser-fingerprint.dto';
import { GenerateFingerprintsDto } from './dto/generate-fingerprints.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { QueryBrowserFingerprintDto } from './dto/query-browser-fingerprint.dto';
import { UpdateBrowserFingerprintDto } from './dto/update-browser-fingerprint.dto';
import { AccountGroupsService } from '../account-groups/account-groups.service';

@Injectable()
export class BrowserFingerprintsService {
  private readonly chromeVersions = [
    '120.0.6099.129',
    '120.0.6099.216',
    '120.0.6099.224',
    '121.0.6167.85',
    '121.0.6167.139',
    '121.0.6167.184',
    '122.0.6261.69',
    '122.0.6261.94',
    '122.0.6261.111',
    '123.0.6312.58',
    '123.0.6312.86',
    '123.0.6312.105',
  ];

  private readonly gpuVendors = ['NVIDIA', 'AMD', 'Intel'];

  private readonly gpuModels = {
    NVIDIA: [
      'GeForce RTX 4090',
      'GeForce RTX 4080',
      'GeForce RTX 4070 Ti',
      'GeForce RTX 4070',
      'GeForce RTX 4060 Ti',
      'GeForce RTX 4060',
      'GeForce RTX 3090 Ti',
      'GeForce RTX 3090',
      'GeForce RTX 3080 Ti',
      'GeForce RTX 3080',
      'GeForce RTX 3070 Ti',
      'GeForce RTX 3070',
      'GeForce RTX 3060 Ti',
      'GeForce RTX 3060',
      'GeForce GTX 1660 SUPER',
      'GeForce GTX 1660 Ti',
      'GeForce GTX 1660',
      'GeForce GTX 1650 SUPER',
      'GeForce GTX 1650',
    ],
    AMD: [
      'Radeon RX 7900 XTX',
      'Radeon RX 7900 XT',
      'Radeon RX 7800 XT',
      'Radeon RX 7700 XT',
      'Radeon RX 7600',
      'Radeon RX 6950 XT',
      'Radeon RX 6900 XT',
      'Radeon RX 6800 XT',
      'Radeon RX 6800',
      'Radeon RX 6750 XT',
      'Radeon RX 6700 XT',
      'Radeon RX 6650 XT',
      'Radeon RX 6600 XT',
      'Radeon RX 6600',
      'Radeon RX 6500 XT',
    ],
    Intel: [
      'Intel(R) Arc(TM) A770',
      'Intel(R) Arc(TM) A750',
      'Intel(R) Arc(TM) A580',
      'Intel(R) Arc(TM) A380',
      'Intel(R) Iris(R) Xe Graphics',
      'Intel(R) UHD Graphics 770',
      'Intel(R) UHD Graphics 750',
      'Intel(R) UHD Graphics 730',
      'Intel(R) UHD Graphics 630',
      'Intel(R) HD Graphics 530',
    ],
  };

  constructor(
    @InjectRepository(BrowserFingerprint)
    private readonly fingerprintRepository: Repository<BrowserFingerprint>,
    private readonly accountGroupsService: AccountGroupsService,
  ) {}

  private generateRandomMacAddress(): string {
    const hexDigits = '0123456789ABCDEF';
    const macParts: string[] = [];
    for (let i = 0; i < 6; i++) {
      let part = '';
      for (let j = 0; j < 2; j++) {
        part += hexDigits[Math.floor(Math.random() * 16)];
      }
      macParts.push(part);
    }
    return macParts.join('-');
  }

  private generateRandomDeviceName(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = 'DESKTOP-';
    for (let i = 0; i < 8; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private generateWebGLInfo(): { vendor: string; renderer: string } {
    const vendor =
      this.gpuVendors[Math.floor(Math.random() * this.gpuVendors.length)];
    const models = this.gpuModels[vendor];
    const model = models[Math.floor(Math.random() * models.length)];
    return {
      vendor: `Google Inc. (${vendor})`,
      renderer: `ANGLE (${vendor}, ${model} Direct3D11 vs_5_0 ps_5_0, D3D11)`,
    };
  }

  private generateUserAgent(): string {
    const version =
      this.chromeVersions[
        Math.floor(Math.random() * this.chromeVersions.length)
      ];
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
  }

  private generateFingerprint(): CreateBrowserFingerprintDto {
    const webGLInfo = this.generateWebGLInfo();
    const cpuCoreOptions = [2, 4, 6, 8, 12, 16, 20, 24];
    const memoryOptions = [4, 8];

    return {
      userAgent: this.generateUserAgent(),
      webglVendor: webGLInfo.vendor,
      webglRenderer: webGLInfo.renderer,
      deviceName: this.generateRandomDeviceName(),
      macAddress: this.generateRandomMacAddress(),
      cpuCores:
        cpuCoreOptions[Math.floor(Math.random() * cpuCoreOptions.length)],
      deviceMemory:
        memoryOptions[Math.floor(Math.random() * memoryOptions.length)],
    };
  }

  async create(
    createFingerprintDto: CreateBrowserFingerprintDto,
    userId: number,
  ): Promise<BrowserFingerprint> {
    const fingerprint = this.fingerprintRepository.create({
      ...createFingerprintDto,
      userId,
    });
    return await this.fingerprintRepository.save(fingerprint);
  }

  async findAll(
    userId: number,
    query: QueryBrowserFingerprintDto,
  ): Promise<PaginatedResponseDto<BrowserFingerprint>> {
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

    if (
      query.createdAtStart ||
      query.createdAtEnd ||
      query.browserType ||
      query.deviceName ||
      query.webglRenderer ||
      query.macAddress ||
      query.webglVendor ||
      query.cpuCores ||
      query.deviceMemory
    ) {
      const queryBuilder = this.fingerprintRepository
        .createQueryBuilder('fingerprint')
        .where('fingerprint.userId = :userId', { userId });

      if (query.browserType) {
        queryBuilder.andWhere('fingerprint.userAgent LIKE :browserType', {
          browserType: `%${query.browserType}%`,
        });
      }
      if (query.deviceName) {
        queryBuilder.andWhere('fingerprint.deviceName LIKE :deviceName', {
          deviceName: `%${query.deviceName}%`,
        });
      }
      if (query.webglRenderer) {
        queryBuilder.andWhere('fingerprint.webglRenderer LIKE :webglRenderer', {
          webglRenderer: `%${query.webglRenderer}%`,
        });
      }
      if (query.webglVendor) {
        queryBuilder.andWhere('fingerprint.webglVendor LIKE :webglVendor', {
          webglVendor: `%${query.webglVendor}%`,
        });
      }
      if (query.macAddress) {
        queryBuilder.andWhere('fingerprint.macAddress LIKE :macAddress', {
          macAddress: `%${query.macAddress}%`,
        });
      }
      if (query.cpuCores) {
        queryBuilder.andWhere('fingerprint.cpuCores = :cpuCores', {
          cpuCores: query.cpuCores,
        });
      }
      if (query.deviceMemory) {
        queryBuilder.andWhere('fingerprint.deviceMemory = :deviceMemory', {
          deviceMemory: query.deviceMemory,
        });
      }

      if (query.createdAtStart) {
        queryBuilder.andWhere('fingerprint.createdAt >= :createdAtStart', {
          createdAtStart: query.createdAtStart,
        });
      }
      if (query.createdAtEnd) {
        const endDate = new Date(query.createdAtEnd);
        endDate.setHours(23, 59, 59, 999);
        queryBuilder.andWhere('fingerprint.createdAt <= :createdAtEnd', {
          createdAtEnd: endDate,
        });
      }

      queryBuilder.skip(query.actualSkip).take(query.actualTake);

      const [items, total] = await queryBuilder.getManyAndCount();
      return new PaginatedResponseDto(items, total);
    }

    const { actualSkip, actualTake } = query;
    const [items, total] = await this.fingerprintRepository.findAndCount({
      where: { userId },
      skip: actualSkip,
      take: actualTake,
    });
    return new PaginatedResponseDto(items, total);
  }

  async findOne(id: number, userId: number): Promise<BrowserFingerprint> {
    const fingerprint = await this.fingerprintRepository.findOne({
      where: { id, userId },
    });

    if (!fingerprint) {
      throw new BadRequestException(
        `Browser fingerprint with ID "${id}" not found or not owned by user`,
      );
    }

    return fingerprint;
  }

  async remove(id: number, userId: number): Promise<void> {
    const fingerprint = await this.findOne(id, userId);

    const isInUse = await this.accountGroupsService.isResourceInUse(
      'browserFingerprintId',
      fingerprint.id,
    );
    if (isInUse) {
      throw new BadRequestException('该浏览器指纹已被项目使用，无法删除');
    }
    await this.fingerprintRepository.delete(id);
  }

  async generateFingerprints(
    dto: GenerateFingerprintsDto,
    userId: number,
  ): Promise<BrowserFingerprint[]> {
    const fingerprintDtos = Array.from({ length: dto.count }, () => ({
      ...this.generateFingerprint(),
      userId,
    }));
    const fingerprints = this.fingerprintRepository.create(fingerprintDtos);
    return await this.fingerprintRepository.save(fingerprints);
  }

  async regenerateFingerprint(
    id: number,
    userId: number,
  ): Promise<BrowserFingerprint> {
    const fingerprint = await this.findOne(id, userId);
    const newData = this.generateFingerprint();
    Object.assign(fingerprint, newData);
    return await this.fingerprintRepository.save(fingerprint);
  }

  /**
   * 更新浏览器指纹
   */
  async update(
    id: number,
    userId: number,
    updateDto: UpdateBrowserFingerprintDto,
  ): Promise<BrowserFingerprint> {
    const fingerprint = await this.findOne(id, userId);

    // 更新指纹属性
    Object.assign(fingerprint, updateDto);

    // 保存更新
    return await this.fingerprintRepository.save(fingerprint);
  }
}
