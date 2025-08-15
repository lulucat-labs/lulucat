import { Module } from '@nestjs/common';
import { MemoryTasksService } from './memory-tasks.service';
import { MemoryTasksController } from './memory-tasks.controller';

@Module({
  controllers: [MemoryTasksController],
  providers: [MemoryTasksService],
  exports: [MemoryTasksService],
})
export class MemoryTasksModule {} 