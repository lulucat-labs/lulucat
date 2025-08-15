import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProxyIpsService } from './proxy-ips.service';
import { CreateProxyIpDto } from './dto/create-proxy-ip.dto';
import { QueryProxyIpDto } from './dto/query-proxy-ip.dto';
import { ExportRequestDto } from '../../common/dto/import-export.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiFile } from '../../common/decorators/api-file.decorator';
import { FileUtil } from '../../common/utils/file.util';
import { DeleteProxyIpsDto } from './dto/delete-proxy-ips.dto';
import { UpdateIpInfoResultDto } from './dto/update-ip-info-result.dto';
import { UpdateProxyIpDto } from './dto/update-proxy-ip.dto';
import { UpdateIpInfoDto } from './dto/update-ip-info.dto';

@ApiTags('代理IP')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('proxy-ips')
export class ProxyIpsController {
  constructor(private readonly proxyIpsService: ProxyIpsService) {}

  @Post()
  @ApiOperation({ summary: '创建代理IP' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @CurrentUser('userId') userId: number,
    @Body() createProxyIpDto: CreateProxyIpDto,
  ) {
    return this.proxyIpsService.create(userId, createProxyIpDto);
  }

  @Get()
  @ApiOperation({ summary: '查询代理IP列表' })
  async findAll(
    @CurrentUser('userId') userId: number,
    @Query() query: QueryProxyIpDto,
  ) {
    console.log('接收到的查询参数:', JSON.stringify(query));
    return this.proxyIpsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个代理IP' })
  async findOne(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.proxyIpsService.findOne(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除代理IP' })
  async remove(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.proxyIpsService.remove(userId, id);
  }

  @Delete()
  @ApiOperation({ summary: '批量删除代理IP' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @HttpCode(HttpStatus.OK)
  async removeMany(
    @CurrentUser('userId') userId: number,
    @Body() deleteDto: DeleteProxyIpsDto,
  ) {
    await this.proxyIpsService.removeMany(userId, deleteDto.ids);
  }

  @Post('import')
  @ApiOperation({ summary: '导入代理IP' })
  @ApiFile()
  async import(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.proxyIpsService.startImportTask(userId, file);
  }

  @Post('export')
  @ApiOperation({ summary: '导出选中的代理IP' })
  async export(
    @CurrentUser('userId') userId: number,
    @Body() exportRequest: ExportRequestDto,
  ) {
    const proxies = await this.proxyIpsService.findProxiesForExport(
      userId,
      exportRequest.ids,
    );

    const content = FileUtil.generateExportFile(proxies, (proxy) =>
      this.proxyIpsService.formatProxyForExport(proxy),
    );

    return {
      filename: FileUtil.generateExportFileName('proxy-ips'),
      content,
    };
  }

  @Get('export/all')
  @ApiOperation({ summary: '导出所有代理IP' })
  async exportAll(@CurrentUser('userId') userId: number) {
    const proxies = await this.proxyIpsService.findProxiesForExport(userId);

    const content = FileUtil.generateExportFile(proxies, (proxy) =>
      this.proxyIpsService.formatProxyForExport(proxy),
    );

    return {
      filename: FileUtil.generateExportFileName('proxy-ips'),
      content,
    };
  }

  @Post('update-ip-info')
  @ApiOperation({ summary: '更新代理IP的详细信息' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UpdateIpInfoResultDto,
  })
  @HttpCode(HttpStatus.OK)
  async updateIpInfo(@Body() dto: UpdateIpInfoDto) {
    return this.proxyIpsService.startUpdateIpInfoTask(dto.proxyIds);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新单个代理IP' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProxyIpDto: UpdateProxyIpDto,
  ) {
    return this.proxyIpsService.update(userId, id, updateProxyIpDto);
  }
}
