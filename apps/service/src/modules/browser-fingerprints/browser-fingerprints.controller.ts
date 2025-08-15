import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BrowserFingerprintsService } from './browser-fingerprints.service';
import { CreateBrowserFingerprintDto } from './dto/create-browser-fingerprint.dto';
import { GenerateFingerprintsDto } from './dto/generate-fingerprints.dto';
import { BrowserFingerprint } from './entities/browser-fingerprint.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { QueryBrowserFingerprintDto } from './dto/query-browser-fingerprint.dto';
import { UpdateBrowserFingerprintDto } from './dto/update-browser-fingerprint.dto';

@ApiTags('browser-fingerprints')
@Controller('browser-fingerprints')
@UseGuards(AuthGuard)
export class BrowserFingerprintsController {
  constructor(
    private readonly fingerprintsService: BrowserFingerprintsService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建单个浏览器指纹' })
  @ApiResponse({ status: 201, type: BrowserFingerprint })
  create(
    @Body() createFingerprintDto: CreateBrowserFingerprintDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BrowserFingerprint> {
    return this.fingerprintsService.create(createFingerprintDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取所有浏览器指纹' })
  @ApiResponse({ status: 200, type: [BrowserFingerprint] })
  findAll(
    @CurrentUser('userId') userId: number,
    @Query() query: QueryBrowserFingerprintDto,
  ): Promise<PaginatedResponseDto<BrowserFingerprint>> {
    return this.fingerprintsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定ID的浏览器指纹' })
  @ApiResponse({ status: 200, type: BrowserFingerprint })
  findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ): Promise<BrowserFingerprint> {
    return this.fingerprintsService.findOne(+id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除指定ID的浏览器指纹' })
  @ApiResponse({ status: 200 })
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ): Promise<void> {
    return this.fingerprintsService.remove(+id, userId);
  }

  @Post('generate')
  @ApiOperation({ summary: '批量生成浏览器指纹' })
  @ApiResponse({ status: 201, type: [BrowserFingerprint] })
  generateFingerprints(
    @Body() generateDto: GenerateFingerprintsDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BrowserFingerprint[]> {
    return this.fingerprintsService.generateFingerprints(generateDto, userId);
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: '重新生成指定ID的浏览器指纹' })
  @ApiResponse({ status: 200, type: BrowserFingerprint })
  regenerateFingerprint(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ): Promise<BrowserFingerprint> {
    return this.fingerprintsService.regenerateFingerprint(+id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新浏览器指纹' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: BrowserFingerprint,
  })
  async update(
    @Param('id') id: number,
    @CurrentUser('userId') userId: number,
    @Body() updateDto: UpdateBrowserFingerprintDto,
  ): Promise<BrowserFingerprint> {
    return this.fingerprintsService.update(id, userId, updateDto);
  }
}
