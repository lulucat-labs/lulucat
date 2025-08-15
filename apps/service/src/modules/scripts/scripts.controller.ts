import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ScriptsService } from './scripts.service';
import { CreateScriptDto } from './dto/create-script.dto';
import { Script } from './entities/script.entity';
import { QueryScriptDto } from './dto/query-script.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@ApiTags('scripts')
@Controller('scripts')
export class ScriptsController {
  constructor(private readonly scriptsService: ScriptsService) {}

  @Post()
  @ApiOperation({ summary: '创建脚本' })
  @ApiResponse({ status: 201, description: '脚本创建成功', type: Script })
  create(@Body() createScriptDto: CreateScriptDto): Promise<Script> {
    return this.scriptsService.create(createScriptDto);
  }

  @Get()
  @ApiOperation({ summary: '获取脚本列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/Script' },
        },
        {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/Script' },
            },
            total: { type: 'number' },
          },
        },
      ],
    },
  })
  findAll(
    @Query() query: QueryScriptDto,
  ): Promise<Script[] | PaginatedResponseDto<Script>> {
    if (query.projectId) {
      return this.scriptsService.findByProject(query.projectId, query);
    }
    return this.scriptsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定脚本' })
  @ApiResponse({ status: 200, description: '获取成功', type: Script })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Script> {
    return this.scriptsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新脚本' })
  @ApiResponse({ status: 200, description: '更新成功', type: Script })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateScriptDto: Partial<CreateScriptDto>,
  ): Promise<Script> {
    return this.scriptsService.update(id, updateScriptDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除脚本' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.scriptsService.remove(id);
  }
}
