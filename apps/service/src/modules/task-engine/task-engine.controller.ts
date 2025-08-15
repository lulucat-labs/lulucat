import {
  Controller,
  Post,
  Param,
  Delete,
  ParseIntPipe,
  Request,
  Body,
} from '@nestjs/common';
import { TaskEngineService } from './task-engine.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StartTaskWithAccountItemsDto } from './dto/start-task.dto';

@ApiTags('task-engine')
@Controller('task-engine')
export class TaskEngineController {
  constructor(private readonly taskEngineService: TaskEngineService) {}

  @Post(':id/start')
  @ApiOperation({
    summary: '启动任务',
    description:
      '启动指定任务，可以选择性地指定要启动的账号项ID列表。不提供账号项ID列表则启动所有账号项。',
  })
  async startTask(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() startTaskDto?: StartTaskWithAccountItemsDto,
  ): Promise<void> {
    return this.taskEngineService.startTask(
      id,
      req.user.id,
      startTaskDto?.accountGroupItemIds,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '停止任务' })
  async stopTask(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    return this.taskEngineService.stopTask(id, req.user.id);
  }
}
