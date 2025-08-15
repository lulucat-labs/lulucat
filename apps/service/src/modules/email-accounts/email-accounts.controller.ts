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
import { EmailAccountsService } from './email-accounts.service';
import { CreateEmailAccountDto } from './dto/create-email-account.dto';
import { QueryEmailAccountDto } from './dto/query-email-account.dto';
import { ExportRequestDto } from '../../common/dto/import-export.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiFile } from '../../common/decorators/api-file.decorator';
import { FileUtil } from '../../common/utils/file.util';
import { DeleteEmailAccountsDto } from './dto/delete-email-accounts.dto';
import { UpdateEmailAccountDto } from './dto/update-email-account.dto';
import { CheckRefreshTokensDto } from './dto/check-refresh-tokens.dto';
import { AccountStatus } from '../../common/types/account-status.enum';

@ApiTags('邮箱账号')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('email-accounts')
export class EmailAccountsController {
  constructor(private readonly emailAccountsService: EmailAccountsService) {}

  @Post()
  @ApiOperation({ summary: '创建邮箱账号' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @CurrentUser('userId') userId: number,
    @Body() createEmailAccountDto: CreateEmailAccountDto,
  ) {
    return this.emailAccountsService.create(userId, createEmailAccountDto);
  }

  @Get()
  @ApiOperation({ summary: '查询邮箱账号列表' })
  async findAll(
    @CurrentUser('userId') userId: number,
    @Query() query: QueryEmailAccountDto,
  ) {
    return this.emailAccountsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个邮箱账号' })
  async findOne(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.emailAccountsService.findOne(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除邮箱账号' })
  async remove(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.emailAccountsService.remove(userId, id);
  }

  @Delete()
  @ApiOperation({ summary: '批量删除邮箱账号' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @HttpCode(HttpStatus.OK)
  async removeMany(
    @CurrentUser('userId') userId: number,
    @Body() deleteDto: DeleteEmailAccountsDto,
  ) {
    await this.emailAccountsService.removeMany(userId, deleteDto.ids);
  }

  @Post('import')
  @ApiOperation({ summary: '导入邮箱账号' })
  @ApiFile()
  async import(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.emailAccountsService.startImportTask(userId, file);
  }

  @Post('export')
  @ApiOperation({ summary: '导出邮箱账号' })
  async export(
    @CurrentUser('userId') userId: number,
    @Body() exportRequest: ExportRequestDto,
  ) {
    const accounts = await this.emailAccountsService.findAccountsForExport(
      userId,
      exportRequest.ids,
    );

    const content = FileUtil.generateExportFile(accounts, (account) =>
      this.emailAccountsService.formatAccountForExport(account),
    );

    return {
      filename: FileUtil.generateExportFileName('email-accounts'),
      content: content.toString('utf-8'),
    };
  }

  @Post('export-invalid')
  @ApiOperation({ summary: '批量导出全部失效邮箱账号' })
  async exportInvalid(@CurrentUser('userId') userId: number) {
    // 查询所有失效邮箱账号
    const invalidAccounts = await this.emailAccountsService.findAll(userId, {
      status: AccountStatus.INVALID,
      actualSkip: 0,
      actualTake: 100000,
    });
    const ids = invalidAccounts.items.map((item) => item.emailId);
    // 复用导出逻辑
    const accounts = await this.emailAccountsService.findAccountsForExport(
      userId,
      ids,
    );
    const content = FileUtil.generateExportFile(accounts, (account) =>
      this.emailAccountsService.formatAccountForExport(account),
    );
    return {
      filename: FileUtil.generateExportFileName('email-accounts-invalid'),
      content: content.toString('utf-8'),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新邮箱账号' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmailAccountDto: UpdateEmailAccountDto,
  ) {
    return this.emailAccountsService.update(userId, id, updateEmailAccountDto);
  }

  @Post('check-refresh-tokens')
  @ApiOperation({ summary: '批量检测邮箱账号refreshToken有效性' })
  @ApiResponse({
    status: 200,
    description: '检测结果',
    schema: {
      properties: {
        total: { type: 'number', example: 10, description: '总处理数量' },
        success: { type: 'number', example: 8, description: '成功数量' },
        failed: { type: 'number', example: 2, description: '失败数量' },
        results: {
          type: 'array',
          description: '详细结果',
          items: {
            properties: {
              emailId: { type: 'number', example: 1 },
              emailAddress: { type: 'string', example: 'user@gmail.com' },
              serviceType: {
                type: 'string',
                enum: ['gmail', 'outlook', 'unknown'],
              },
              valid: { type: 'boolean', example: true },
              errorMessage: {
                type: 'string',
                example: 'Gmail令牌验证失败',
                nullable: true,
              },
            },
          },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async checkRefreshTokens(
    @CurrentUser('userId') userId: number,
    @Body() checkDto: CheckRefreshTokensDto,
  ) {
    return this.emailAccountsService.checkRefreshTokens(userId, checkDto.ids);
  }
}
