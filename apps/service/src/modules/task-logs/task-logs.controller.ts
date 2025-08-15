import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaskLogsService } from './task-logs.service';
import { TaskLog } from './entities/task-log.entity';
import { TaskStatus } from '../tasks/entities/task.entity';
import { CreateTaskLogDto } from './dto/create-task-log.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('task-logs')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('task-logs')
export class TaskLogsController {
  constructor(private readonly taskLogsService: TaskLogsService) {}

  @Post()
  @ApiOperation({ summary: '创建任务日志' })
  @ApiResponse({ status: 201, description: '任务日志创建成功', type: TaskLog })
  create(
    @Body() createTaskLogDto: CreateTaskLogDto,
    @CurrentUser('userId') userId: number,
  ): Promise<TaskLog> {
    return this.taskLogsService.create(createTaskLogDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取任务日志' })
  @ApiResponse({ status: 200, description: '获取成功', type: [TaskLog] })
  @ApiQuery({ name: 'current', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'taskId', required: false, type: Number })
  async findAll(
    @Query('current', new DefaultValuePipe(1), ParseIntPipe) current: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('taskId', new DefaultValuePipe(0), ParseIntPipe) taskId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<PaginatedResponse<TaskLog>> {
    if (taskId) {
      const data = await this.taskLogsService.findByTask(taskId, userId);
      return {
        data,
        total: data.length,
        current,
        pageSize,
      };
    }
    return this.taskLogsService.findAllPaginated(current, pageSize, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定任务日志' })
  @ApiResponse({ status: 200, description: '获取成功', type: TaskLog })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<TaskLog> {
    return this.taskLogsService.findOne(id, userId);
  }

  @Post(':id/append')
  @ApiOperation({ summary: '追加任务日志' })
  @ApiResponse({ status: 200, description: '追加成功', type: TaskLog })
  appendLog(
    @Param('id', ParseIntPipe) id: number,
    @Body('log') log: string,
    @CurrentUser('userId') userId: number,
  ): Promise<TaskLog> {
    return this.taskLogsService.appendLog(id, log, userId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成任务日志' })
  @ApiResponse({ status: 200, description: '完成成功', type: TaskLog })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: TaskStatus,
    @CurrentUser('userId') userId: number,
  ): Promise<TaskLog> {
    return this.taskLogsService.complete(id, status, userId);
  }

  @Post('clear-all')
  @ApiOperation({ summary: '删除当前用户所有任务日志' })
  @ApiResponse({ status: 200, description: '删除成功' })
  clearAllLogs(@CurrentUser('userId') userId: number): Promise<void> {
    return this.taskLogsService.clearAllLogs(userId);
  }
}
