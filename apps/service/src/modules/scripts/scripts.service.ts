import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Script } from './entities/script.entity';
import { CreateScriptDto } from './dto/create-script.dto';
import { ProjectsService } from '../projects/projects.service';
import { QueryScriptDto } from './dto/query-script.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ScriptsService {
  constructor(
    @InjectRepository(Script)
    private readonly scriptRepository: Repository<Script>,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(createScriptDto: CreateScriptDto): Promise<Script> {
    const script = this.scriptRepository.create(createScriptDto);

    if (!createScriptDto.isPublic && createScriptDto.projectId) {
      const project = await this.projectsService.findOne(
        createScriptDto.projectId,
      );
      script.project = project;
    }

    return await this.scriptRepository.save(script);
  }

  async findAll(
    query?: QueryScriptDto,
  ): Promise<Script[] | PaginatedResponseDto<Script>> {
    if (!query) {
      return await this.scriptRepository.find({
        relations: ['project', 'tasks'],
      });
    }

    const where: any = {};
    
    if (query.name) {
      where.name = Like(`%${query.name}%`);
    }

    const [items, total] = await this.scriptRepository.findAndCount({
      where,
      relations: ['project', 'tasks'],
      skip: query.skip,
      take: query.take,
    });

    return new PaginatedResponseDto(items, total);
  }

  async findOne(id: number): Promise<Script> {
    const script = await this.scriptRepository.findOne({
      where: { id },
      relations: ['project', 'tasks'],
    });

    if (!script) {
      throw new NotFoundException(`脚本ID ${id} 不存在`);
    }

    return script;
  }

  async update(
    id: number,
    updateScriptDto: Partial<CreateScriptDto>,
  ): Promise<Script> {
    const script = await this.findOne(id);

    if (updateScriptDto.projectId !== undefined) {
      if (!updateScriptDto.isPublic && updateScriptDto.projectId) {
        const project = await this.projectsService.findOne(
          updateScriptDto.projectId,
        );
        script.project = project;
      } else {
        script.project = null;
      }
      delete updateScriptDto.projectId;
    }

    Object.assign(script, updateScriptDto);
    return await this.scriptRepository.save(script);
  }

  async remove(id: number): Promise<void> {
    const script = await this.findOne(id);
    await this.scriptRepository.remove(script);
  }

  async findByProject(
    projectId: number,
    query?: QueryScriptDto,
  ): Promise<Script[] | PaginatedResponseDto<Script>> {
    if (!query) {
      return await this.scriptRepository.find({
        where: [{ project: { id: projectId } }, { isPublic: true }],
        relations: ['project', 'tasks'],
      });
    }

    const where: any = [{ project: { id: projectId } }, { isPublic: true }];
    
    if (query.name) {
      where[0].name = Like(`%${query.name}%`);
      where[1].name = Like(`%${query.name}%`);
    }

    const [items, total] = await this.scriptRepository.findAndCount({
      where,
      relations: ['project', 'tasks'],
      skip: query.skip,
      take: query.take,
    });

    return new PaginatedResponseDto(items, total);
  }
}
