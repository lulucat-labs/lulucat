import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AccountGroupsService } from './account-groups.service';
import { QueryAccountGroupDto } from './dto/query-account-group.dto';
import { AccountGroup } from './entities/account-group.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CreateQuickAccountGroupDto } from './dto/create-quick-account-group.dto';
import { UpdateAccountItemsStatusDto } from './dto/update-account-items-status.dto';
import { ReplaceAccountItemsResourceDto } from './dto/replace-account-items-resource.dto';
import { ReplaceAllAccountItemsResourceDto } from './dto/replace-all-account-items-resource.dto';

@ApiTags('账号组')
@Controller('account-groups')
@UseGuards(AuthGuard)
export class AccountGroupsController {
  constructor(private readonly accountGroupsService: AccountGroupsService) {}

  @Post('quick')
  @ApiOperation({ summary: '快速创建账号组并关联指定数量的不同账号' })
  @ApiResponse({ status: 201, type: AccountGroup })
  createQuickGroup(
    @Body() createDto: CreateQuickAccountGroupDto,
    @CurrentUser('userId') userId: number,
  ): Promise<AccountGroup> {
    return this.accountGroupsService.createQuickGroup(createDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '查询账号组列表' })
  @ApiResponse({ status: 200, type: AccountGroup, isArray: true })
  findAll(
    @Query() query: QueryAccountGroupDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.accountGroupsService.findAll(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取账号组详情' })
  @ApiResponse({ status: 200, type: AccountGroup })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<AccountGroup> {
    return this.accountGroupsService.findOne(id, userId);
  }

  @Get(':id/items')
  @ApiOperation({ summary: '分页获取账号组关联的账号项' })
  @ApiResponse({
    status: 200,
    description: '账号组关联的账号项列表',
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', description: '账号项列表' },
        total: { type: 'number', description: '总数量' },
        page: { type: 'number', description: '当前页码' },
        pageSize: { type: 'number', description: '每页数量' },
      },
    },
  })
  findGroupItems(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @Query() query: QueryAccountGroupDto,
  ) {
    return this.accountGroupsService.findGroupItems(
      id,
      userId,
      query.page,
      query.pageSize,
      query.accountType,
      query.accountStatus,
    );
  }

  @Get(':id/task-logs')
  @ApiOperation({ summary: '获取账号组详情及关联项的任务日志' })
  @ApiResponse({
    status: 200,
    type: AccountGroup,
  })
  findOneWithTaskLogs(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @Query() query: QueryAccountGroupDto,
  ) {
    return this.accountGroupsService.findOneWithTaskLogs(
      id,
      userId,
      query.page,
      query.pageSize,
      query.taskId,
      query.status,
      query.errorCode,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除账号组' })
  @ApiResponse({ status: 200 })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<void> {
    return this.accountGroupsService.remove(id, userId);
  }

  @Patch('items/status')
  @ApiOperation({ summary: '批量更新账号项中指定账号类型的状态' })
  @ApiResponse({
    status: 200,
    description: '更新状态结果',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: '总处理数量' },
        success: { type: 'number', description: '成功更新数量' },
        failed: { type: 'number', description: '失败数量' },
        accountTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: '账号类型' },
              updated: { type: 'number', description: '该类型更新数量' },
            },
          },
        },
      },
    },
  })
  updateAccountItemsStatus(
    @Body() updateDto: UpdateAccountItemsStatusDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.accountGroupsService.updateAccountItemsStatus(
      updateDto,
      userId,
    );
  }

  @Patch('items/replace-resource')
  @ApiOperation({
    summary: '批量更换账号项关联的账号资源，用于账号组「更换账号」功能',
  })
  @ApiResponse({
    status: 200,
    description: '更换账号资源结果',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: '总处理数量' },
        success: { type: 'number', description: '成功更新数量' },
        failed: { type: 'number', description: '失败数量' },
      },
    },
  })
  replaceAccountItemsResource(
    @Body() replaceDto: ReplaceAccountItemsResourceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.accountGroupsService.replaceAccountItemsResource(
      replaceDto,
      userId,
    );
  }

  @Patch('items/replace-all-resource')
  @ApiOperation({
    summary:
      '全量更换账号组下所有账号项关联的账号资源，用于账号组「追加账号」功能',
  })
  @ApiResponse({
    status: 200,
    description: '更换账号资源结果',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: '总处理数量' },
        success: { type: 'number', description: '成功更新数量' },
        failed: { type: 'number', description: '失败数量' },
      },
    },
  })
  replaceAllAccountItemsResource(
    @Body() replaceDto: ReplaceAllAccountItemsResourceDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.accountGroupsService.replaceAllAccountItemsResource(
      replaceDto,
      userId,
    );
  }
}
