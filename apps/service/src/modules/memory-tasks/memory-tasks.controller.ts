import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  NotFoundException
} from '@nestjs/common';
import { MemoryTasksService } from './memory-tasks.service';
import {
  MemoryTask,
  MemoryTaskStatus,
  CreateTaskDto,
  UpdateTaskDto,
  GetAllTasksResponse
} from './types/memory-task.type';

@Controller('memory-tasks')
export class MemoryTasksController {
  constructor(private readonly memoryTasksService: MemoryTasksService) {}

  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto): MemoryTask {
    return this.memoryTasksService.createTask(createTaskDto);
  }

  @Patch(':id')
  updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): MemoryTask {
    const task = this.memoryTasksService.updateTask(id, updateTaskDto);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  @Get(':id')
  getTask(@Param('id') id: string): MemoryTask {
    const task = this.memoryTasksService.getTask(id);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  @Get()
  getAllTasks(@Query('status') status?: MemoryTaskStatus): GetAllTasksResponse {
    return this.memoryTasksService.getAllTasks(status);
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string): { success: boolean } {
    const result = this.memoryTasksService.deleteTask(id);
    return { success: result };
  }

  @Get('count/by-status')
  getTasksCountByStatus(@Query('status') status: MemoryTaskStatus): { count: number } {
    return { count: this.memoryTasksService.getTasksCountByStatus(status) };
  }
} 