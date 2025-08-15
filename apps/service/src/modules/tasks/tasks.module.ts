import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { ProjectsModule } from '../projects/projects.module';
import { ScriptsModule } from '../scripts/scripts.module';
import { AccountGroupsModule } from '../account-groups/account-groups.module';
import { TaskEngineModule } from '../task-engine/task-engine.module';
import { TaskLog } from '../task-logs/entities/task-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskLog]),
    ProjectsModule,
    ScriptsModule,
    AccountGroupsModule,
    forwardRef(() => TaskEngineModule),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
