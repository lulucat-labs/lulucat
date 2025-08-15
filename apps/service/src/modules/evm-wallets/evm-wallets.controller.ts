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
import { EvmWalletsService } from './evm-wallets.service';
import { CreateEvmWalletDto } from './dto/create-evm-wallet.dto';
import { QueryEvmWalletDto } from './dto/query-evm-wallet.dto';
import { ExportRequestDto } from '../../common/dto/import-export.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiFile } from '../../common/decorators/api-file.decorator';
import { FileUtil } from '../../common/utils/file.util';
import { DeleteEvmWalletsDto } from './dto/delete-evm-wallets.dto';
import { GenerateEvmWalletsDto } from './dto/generate-evm-wallets.dto';
import { EvmWallet } from './entities/evm-wallet.entity';
import { UpdateEvmWalletDto } from './dto/update-evm-wallet.dto';

@ApiTags('EVM钱包')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('evm-wallets')
export class EvmWalletsController {
  constructor(private readonly evmWalletsService: EvmWalletsService) {}

  @Post()
  @ApiOperation({ summary: '创建EVM钱包' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @CurrentUser('userId') userId: number,
    @Body() createEvmWalletDto: CreateEvmWalletDto,
  ) {
    return this.evmWalletsService.create(userId, createEvmWalletDto);
  }

  @Get()
  @ApiOperation({ summary: '查询EVM钱包列表' })
  async findAll(
    @CurrentUser('userId') userId: number,
    @Query() query: QueryEvmWalletDto,
  ) {
    console.log('Controller findAll - userId:', userId);
    console.log('Controller findAll - query:', query);
    return this.evmWalletsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个EVM钱包' })
  async findOne(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evmWalletsService.findOne(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除EVM钱包' })
  async remove(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.evmWalletsService.remove(userId, id);
  }

  @Delete()
  @ApiOperation({ summary: '批量删除EVM钱包' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @HttpCode(HttpStatus.OK)
  async removeMany(
    @CurrentUser('userId') userId: number,
    @Body() deleteDto: DeleteEvmWalletsDto,
  ) {
    await this.evmWalletsService.removeMany(userId, deleteDto.ids);
  }

  @Post('import')
  @ApiOperation({ summary: '导入EVM钱包' })
  @ApiFile()
  async import(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return FileUtil.processImportFile(file, async (line) =>
      this.evmWalletsService.processImportedWallet(userId, line),
    );
  }

  @Post('export')
  @ApiOperation({ summary: '导出选中的EVM钱包' })
  async export(
    @CurrentUser('userId') userId: number,
    @Body() exportRequest: ExportRequestDto,
  ) {
    const wallets = await this.evmWalletsService.findWalletsForExport(
      userId,
      exportRequest.ids,
    );

    const content = FileUtil.generateExportFile(wallets, (wallet) =>
      this.evmWalletsService.formatWalletForExport(wallet),
    );

    return {
      filename: FileUtil.generateExportFileName('evm-wallets'),
      content,
    };
  }

  @Get('export/all')
  @ApiOperation({ summary: '导出所有EVM钱包' })
  async exportAll(@CurrentUser('userId') userId: number) {
    const wallets = await this.evmWalletsService.findWalletsForExport(userId);

    const content = FileUtil.generateExportFile(wallets, (wallet) =>
      this.evmWalletsService.formatWalletForExport(wallet),
    );

    return {
      filename: FileUtil.generateExportFileName('evm-wallets'),
      content,
    };
  }

  @Post('generate')
  @ApiOperation({ summary: '批量生成EVM钱包' })
  @ApiResponse({
    status: 201,
    description: '成功生成钱包',
    type: [EvmWallet],
  })
  async generateWallets(
    @CurrentUser('userId') userId: number,
    @Body() generateDto: GenerateEvmWalletsDto,
  ): Promise<EvmWallet[]> {
    return this.evmWalletsService.generateWallets(userId, generateDto.count);
  }

  @Post(':id/update-balance')
  @ApiOperation({ summary: '更新单个钱包余额' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @HttpCode(HttpStatus.OK)
  async updateBalance(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const wallet = await this.evmWalletsService.findOne(userId, id);
    return this.evmWalletsService.fetchAndUpdateBalance(wallet.walletId);
  }

  @Post('batch-update-balance')
  @ApiOperation({ summary: '批量更新钱包余额（异步）' })
  @ApiResponse({ status: 202, description: '请求已接受，正在异步处理' })
  @HttpCode(HttpStatus.ACCEPTED)
  async batchUpdateBalance(@CurrentUser('userId') userId: number) {
    // 使用用户ID直接查找该用户的所有钱包
    console.log(`用户 ${userId} 请求批量更新所有钱包余额`);

    // 调用service中的batchUpdateBalancesAsync方法，传递用户ID
    this.evmWalletsService.batchUpdateBalancesAsync(undefined, userId);

    return { message: `已启动所有钱包余额的更新，正在后台处理` };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新单个EVM钱包' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEvmWalletDto: UpdateEvmWalletDto,
  ) {
    return this.evmWalletsService.update(userId, id, updateEvmWalletDto);
  }
}
