import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaskResultsService } from './task-results.service';
import { TaskResult } from './entities/task-result.entity';
import {
  CreateTaskResultDto,
  UpdateTaskResultDto,
  QueryTaskResultDto,
  QueryTaskResultByConditionsDto,
} from './dto';
import { Project } from '../projects/entities/project.entity';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

/**
 * 任务结果控制器
 * 提供任务结果相关的API接口
 */
@ApiTags('任务结果')
@Controller('task-results')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class TaskResultsController {
  constructor(private readonly taskResultsService: TaskResultsService) {}

  /**
   * 创建任务结果
   */
  @Post()
  @ApiOperation({ summary: '创建任务结果' })
  @ApiBody({ type: CreateTaskResultDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: TaskResult })
  createTaskResult(
    @Body() createTaskResultDto: CreateTaskResultDto,
  ): Promise<TaskResult> {
    return this.taskResultsService.createTaskResult(createTaskResultDto);
  }

  /**
   * 获取任务结果列表
   */
  @Get()
  @ApiOperation({ summary: '获取任务结果列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '返回任务结果列表和总数',
  })
  findAllTaskResults(
    @Query() queryTaskResultDto: QueryTaskResultDto,
  ): Promise<{ data: TaskResult[]; total: number }> {
    return this.taskResultsService.findAllTaskResults(queryTaskResultDto);
  }

  /**
   * 获取当前用户执行过任务的项目列表
   * 重要：此路由必须放在 :id 路由之前，否则会被误认为是 id 参数
   */
  @Get('user-projects')
  @ApiOperation({ summary: '获取当前用户执行过任务的项目列表' })
  @ApiResponse({ status: HttpStatus.OK, type: [Project] })
  getUserProjects(@CurrentUser('userId') userId: number): Promise<Project[]> {
    return this.taskResultsService.getUserProjects(userId);
  }

  /**
   * 获取指定ID的任务结果
   */
  @Get(':id')
  @ApiOperation({ summary: '获取指定ID的任务结果' })
  @ApiParam({ name: 'id', description: '任务结果ID' })
  @ApiResponse({ status: HttpStatus.OK, type: TaskResult })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '任务结果不存在' })
  findTaskResultById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TaskResult> {
    return this.taskResultsService.findTaskResultById(id);
  }

  /**
   * 获取指定项目和账号组条目的最新结果
   */
  @Get('latest/:projectId/:accountGroupItemId')
  @ApiOperation({ summary: '获取指定项目和账号组条目的最新结果' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiParam({ name: 'accountGroupItemId', description: '账号组条目ID' })
  @ApiResponse({ status: HttpStatus.OK, type: TaskResult })
  findLatestTaskResult(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('accountGroupItemId', ParseIntPipe) accountGroupItemId: number,
  ): Promise<TaskResult | null> {
    return this.taskResultsService.findLatestTaskResult(
      projectId,
      accountGroupItemId,
    );
  }

  /**
   * 获取项目任务结果数据结构
   */
  @Get('schema/:projectName')
  @ApiOperation({ summary: '获取项目任务结果数据结构' })
  @ApiParam({ name: 'projectName', description: '项目名称' })
  @ApiResponse({ status: HttpStatus.OK, description: '任务结果数据结构' })
  getProjectTaskSchema(
    @Param('projectName') projectName: string,
  ): Promise<Record<string, any>> {
    return this.taskResultsService.getProjectTaskSchema(projectName);
  }

  /**
   * 更新任务结果
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新任务结果' })
  @ApiParam({ name: 'id', description: '任务结果ID' })
  @ApiBody({ type: UpdateTaskResultDto })
  @ApiResponse({ status: HttpStatus.OK, type: TaskResult })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '任务结果不存在' })
  updateTaskResult(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskResultDto: UpdateTaskResultDto,
  ): Promise<TaskResult> {
    return this.taskResultsService.updateTaskResult(id, updateTaskResultDto);
  }

  /**
   * 删除任务结果
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除任务结果' })
  @ApiParam({ name: 'id', description: '任务结果ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '任务结果不存在' })
  async removeTaskResult(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.taskResultsService.removeTaskResult(id);
  }

  /**
   * 按条件查询任务结果
   */
  @Post('query/:projectId')
  @ApiOperation({ summary: '按条件查询任务结果' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiBody({ type: QueryTaskResultByConditionsDto })
  @ApiResponse({ status: HttpStatus.OK, description: '任务结果列表和总数' })
  findTaskResultsByConditions(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: QueryTaskResultByConditionsDto,
    @CurrentUser('userId') userId: number,
  ): Promise<PaginatedResponseDto<TaskResult>> {
    return this.taskResultsService.findTaskResultsByConditions(
      projectId,
      dto,
      userId,
    );
  }
}
