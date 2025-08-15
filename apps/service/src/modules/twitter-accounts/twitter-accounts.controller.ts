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
import { TwitterAccountsService } from './twitter-accounts.service';
import { CreateTwitterAccountDto } from './dto/create-twitter-account.dto';
import { QueryTwitterAccountDto } from './dto/query-twitter-account.dto';
import { ExportRequestDto } from '../../common/dto/import-export.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiFile } from '../../common/decorators/api-file.decorator';
import { FileUtil } from '../../common/utils/file.util';
import { DeleteTwitterAccountsDto } from './dto/delete-twitter-accounts.dto';
import { UpdateTwitterAccountDto } from './dto/update-twitter-account.dto';

@ApiTags('推特账号')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('twitter-accounts')
export class TwitterAccountsController {
  constructor(
    private readonly twitterAccountsService: TwitterAccountsService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建推特账号' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @CurrentUser('userId') userId: number,
    @Body() createTwitterAccountDto: CreateTwitterAccountDto,
  ) {
    return this.twitterAccountsService.create(userId, createTwitterAccountDto);
  }

  @Get()
  @ApiOperation({ summary: '查询推特账号列表' })
  async findAll(
    @CurrentUser('userId') userId: number,
    @Query() query: QueryTwitterAccountDto,
  ) {
    return this.twitterAccountsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个推特账号' })
  async findOne(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.twitterAccountsService.findOne(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除推特账号' })
  async remove(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.twitterAccountsService.remove(userId, id);
  }

  @Delete()
  @ApiOperation({ summary: '批量删除推特账号' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @HttpCode(HttpStatus.OK)
  async removeMany(
    @CurrentUser('userId') userId: number,
    @Body() deleteDto: DeleteTwitterAccountsDto,
  ) {
    await this.twitterAccountsService.removeMany(userId, deleteDto.ids);
  }

  @Post('import')
  @ApiOperation({ summary: '导入推特账号' })
  @ApiFile()
  async import(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.twitterAccountsService.startImportTask(userId, file);
  }

  @Post('export')
  @ApiOperation({ summary: '导出选中的推特账号' })
  async export(
    @CurrentUser('userId') userId: number,
    @Body() exportRequest: ExportRequestDto,
  ) {
    const accounts = await this.twitterAccountsService.findAccountsForExport(
      userId,
      exportRequest.ids,
    );

    const content = FileUtil.generateExportFile(accounts, (account) =>
      this.twitterAccountsService.formatAccountForExport(account),
    );

    return {
      filename: FileUtil.generateExportFileName('twitter-accounts'),
      content,
    };
  }

  @Get('export/all')
  @ApiOperation({ summary: '导出所有推特账号' })
  async exportAll(@CurrentUser('userId') userId: number) {
    const accounts =
      await this.twitterAccountsService.findAccountsForExport(userId);

    const content = FileUtil.generateExportFile(accounts, (account) =>
      this.twitterAccountsService.formatAccountForExport(account),
    );

    return {
      filename: FileUtil.generateExportFileName('twitter-accounts'),
      content,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新Twitter账号' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTwitterAccountDto: UpdateTwitterAccountDto,
  ) {
    return this.twitterAccountsService.update(
      userId,
      id,
      updateTwitterAccountDto,
    );
  }
}
