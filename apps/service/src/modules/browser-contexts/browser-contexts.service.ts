import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrowserContext } from './entities/browser-context.entity';
import { CreateBrowserContextDto } from './dto/create-browser-context.dto';
import { UpdateBrowserContextDto } from './dto/update-browser-context.dto';

@Injectable()
export class BrowserContextsService {
  constructor(
    @InjectRepository(BrowserContext)
    private readonly browserContextRepository: Repository<BrowserContext>,
  ) {}

  async create(
    createBrowserContextDto: CreateBrowserContextDto,
  ): Promise<BrowserContext> {
    const browserContext = this.browserContextRepository.create(
      createBrowserContextDto,
    );
    return await this.browserContextRepository.save(browserContext);
  }

  async findAll(): Promise<BrowserContext[]> {
    return await this.browserContextRepository.find({
      relations: ['accountGroupItem'],
    });
  }

  async findOne(id: number): Promise<BrowserContext | null> {
    return await this.browserContextRepository.findOne({
      where: { id },
      relations: ['accountGroupItem'],
    });
  }

  async update(
    id: number,
    updateBrowserContextDto: UpdateBrowserContextDto,
  ): Promise<BrowserContext> {
    const browserContext = await this.findOne(id);
    if (!browserContext) {
      throw new NotFoundException(`Browser context with ID "${id}" not found`);
    }
    Object.assign(browserContext, updateBrowserContextDto);
    if (updateBrowserContextDto.state) {
      browserContext.lastUsedAt = new Date();
    }
    return await this.browserContextRepository.save(browserContext);
  }

  async remove(id: number): Promise<void> {
    const result = await this.browserContextRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Browser context with ID "${id}" not found`);
    }
  }
}
