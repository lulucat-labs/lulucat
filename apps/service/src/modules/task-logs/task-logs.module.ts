import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskLogsService } from './task-logs.service';
import { TaskLogsController } from './task-logs.controller';
import { TaskLog } from './entities/task-log.entity';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TypeOrmModule.forFeature([TaskLog]), TasksModule],
  controllers: [TaskLogsController],
  providers: [TaskLogsService],
  exports: [TaskLogsService],
})
export class TaskLogsModule {}
