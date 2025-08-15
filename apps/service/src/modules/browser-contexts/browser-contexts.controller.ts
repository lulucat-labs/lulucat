import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrowserContextsService } from './browser-contexts.service';
import { CreateBrowserContextDto } from './dto/create-browser-context.dto';
import { UpdateBrowserContextDto } from './dto/update-browser-context.dto';
import { AuthGuard } from '../../common/guards/auth.guard';

@ApiTags('browser-contexts')
@Controller('browser-contexts')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BrowserContextsController {
  constructor(
    private readonly browserContextsService: BrowserContextsService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建浏览器上下文' })
  create(@Body() createBrowserContextDto: CreateBrowserContextDto) {
    return this.browserContextsService.create(createBrowserContextDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有浏览器上下文' })
  findAll() {
    return this.browserContextsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定浏览器上下文' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.browserContextsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新浏览器上下文' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBrowserContextDto: UpdateBrowserContextDto,
  ) {
    return this.browserContextsService.update(id, updateBrowserContextDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除浏览器上下文' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.browserContextsService.remove(id);
  }
}
