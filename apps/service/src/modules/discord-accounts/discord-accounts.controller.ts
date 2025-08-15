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
import { DiscordAccountsService } from './discord-accounts.service';
import { CreateDiscordAccountDto } from './dto/create-discord-account.dto';
import { UpdateDiscordAccountDto } from './dto/update-discord-account.dto';
import { QueryDiscordAccountDto } from './dto/query-discord-account.dto';
import { ExportRequestDto } from '../../common/dto/import-export.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiFile } from '../../common/decorators/api-file.decorator';
import { FileUtil } from '../../common/utils/file.util';
import { DeleteDiscordAccountsDto } from './dto/delete-discord-accounts.dto';

@ApiTags('Discord账号')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('discord-accounts')
export class DiscordAccountsController {
  constructor(
    private readonly discordAccountsService: DiscordAccountsService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建Discord账号' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @CurrentUser('userId') userId: number,
    @Body() createDiscordAccountDto: CreateDiscordAccountDto,
  ) {
    return this.discordAccountsService.create(userId, createDiscordAccountDto);
  }

  @Get()
  @ApiOperation({ summary: '查询Discord账号列表' })
  async findAll(
    @CurrentUser('userId') userId: number,
    @Query() query: QueryDiscordAccountDto,
  ) {
    return this.discordAccountsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个Discord账号' })
  async findOne(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.discordAccountsService.findOne(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除Discord账号' })
  async remove(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.discordAccountsService.remove(userId, id);
  }

  @Delete()
  @ApiOperation({ summary: '批量删除Discord账号' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @HttpCode(HttpStatus.OK)
  async removeMany(
    @CurrentUser('userId') userId: number,
    @Body() deleteDto: DeleteDiscordAccountsDto,
  ) {
    await this.discordAccountsService.removeMany(userId, deleteDto.ids);
  }

  @Post('import')
  @ApiOperation({ summary: '导入Discord账号' })
  @ApiFile()
  async import(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.discordAccountsService.startImportTask(userId, file);
  }

  @Post('export')
  @ApiOperation({ summary: '导出选中的Discord账号' })
  async export(
    @CurrentUser('userId') userId: number,
    @Body() exportRequest: ExportRequestDto,
  ) {
    const accounts = await this.discordAccountsService.findAccountsForExport(
      userId,
      exportRequest.ids,
    );

    const content = FileUtil.generateExportFile(accounts, (account) =>
      this.discordAccountsService.formatAccountForExport(account),
    );

    return {
      filename: FileUtil.generateExportFileName('discord-accounts'),
      content,
    };
  }

  @Get('export/all')
  @ApiOperation({ summary: '导出所有Discord账号' })
  async exportAll(@CurrentUser('userId') userId: number) {
    const accounts =
      await this.discordAccountsService.findAccountsForExport(userId);

    const content = FileUtil.generateExportFile(accounts, (account) =>
      this.discordAccountsService.formatAccountForExport(account),
    );

    return {
      filename: FileUtil.generateExportFileName('discord-accounts'),
      content,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新Discord账号' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDiscordAccountDto: UpdateDiscordAccountDto,
  ) {
    return this.discordAccountsService.update(
      userId,
      id,
      updateDiscordAccountDto,
    );
  }
}
