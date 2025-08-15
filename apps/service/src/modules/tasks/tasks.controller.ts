import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { TaskEngineService } from '../task-engine/task-engine.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { TaskPageResult } from './dto/task-page-result.dto';
import { Task } from './entities/task.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { StartTaskWithAccountItemsDto } from '../task-engine/dto/start-task.dto';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskEngineService: TaskEngineService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建任务' })
  @ApiResponse({ status: 201, type: Task })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser('userId') userId: number,
  ): Promise<Task> {
    return this.tasksService.create(createTaskDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取任务列表(分页)' })
  @ApiResponse({ status: 200, type: TaskPageResult })
  async findAll(
    @Query() query: QueryTaskDto,
    @CurrentUser('userId') userId: number,
  ): Promise<TaskPageResult> {
    return this.tasksService.findAll(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定任务' })
  @ApiResponse({ status: 200, type: Task })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<Task> {
    return this.tasksService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新任务' })
  @ApiResponse({ status: 200, type: Task })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: Partial<CreateTaskDto>,
    @CurrentUser('userId') userId: number,
  ): Promise<Task> {
    return this.tasksService.update(id, updateTaskDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除任务' })
  @ApiResponse({ status: 200 })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<void> {
    return this.tasksService.remove(id, userId);
  }

  @Post(':id/start')
  @ApiOperation({
    summary: '启动任务',
    description:
      '启动指定任务，可以选择性地指定要启动的账号项ID列表。不提供账号项ID列表则启动所有账号项。',
  })
  @ApiResponse({ status: 200 })
  async startTask(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @Body() startTaskDto?: StartTaskWithAccountItemsDto,
  ): Promise<void> {
    return this.taskEngineService.startTask(
      id,
      userId,
      startTaskDto?.accountGroupItemIds,
      startTaskDto?.headless,
    );
  }

  @Post(':id/stop')
  @ApiOperation({ summary: '停止任务' })
  @ApiResponse({ status: 200 })
  async stopTask(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<void> {
    return this.taskEngineService.stopTask(id, userId);
  }
}
