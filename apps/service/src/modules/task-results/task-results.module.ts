import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskResultsService } from './task-results.service';
import { TaskResultsController } from './task-results.controller';
import { TaskResult } from './entities/task-result.entity';
import { TasksModule } from '../tasks/tasks.module';
import { AccountGroupsModule } from '../account-groups/account-groups.module';
import { ProjectsModule } from '../projects/projects.module';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { AccountGroup } from '../account-groups/entities/account-group.entity';
import { AccountGroupItem } from '../account-groups/entities/account-group-item.entity';

/**
 * 任务结果模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskResult,
      Project,
      Task,
      AccountGroup,
      AccountGroupItem,
    ]),
    TasksModule,
    AccountGroupsModule,
    ProjectsModule,
  ],
  controllers: [TaskResultsController],
  providers: [TaskResultsService],
  exports: [TaskResultsService],
})
export class TaskResultsModule {}
