import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEngineService } from './task-engine.service';
import { TaskQueueService } from './queues/task-queue.service';
import { TaskWorkerService } from './workers/task-worker.service';
import { TasksModule } from '../tasks/tasks.module';
import { AccountGroupsModule } from '../account-groups/account-groups.module';
import { BrowserContextsModule } from '../browser-contexts/browser-contexts.module';
import { TaskLogsModule } from '../task-logs/task-logs.module';
import { ProjectsModule } from '../projects/projects.module';
import { BrowserContextService } from './browser-context/browser-context.service';
import { ProxyIpsModule } from '../proxy-ips/proxy-ips.module';
import { BrowserFingerprintsModule } from '../browser-fingerprints/browser-fingerprints.module';
import { TaskResultsModule } from '../task-results/task-results.module';
import { TaskResultsService } from '../task-results/task-results.service';
import { TaskResult } from './scripts/task-result';
import { ProxyIp } from '../proxy-ips/entities/proxy-ip.entity';
import { BrowserFingerprint } from '../browser-fingerprints/entities/browser-fingerprint.entity';

@Module({
  imports: [
    TasksModule,
    AccountGroupsModule,
    BrowserContextsModule,
    ProxyIpsModule,
    BrowserFingerprintsModule,
    TaskLogsModule,
    ProjectsModule,
    TaskResultsModule,
    TypeOrmModule.forFeature([
      ProxyIp,
      BrowserFingerprint,
    ]),
  ],
  providers: [
    TaskEngineService,
    TaskQueueService,
    TaskWorkerService,
    BrowserContextService,
  ],
  exports: [TaskEngineService],
})
export class TaskEngineModule implements OnModuleInit {
  constructor(private readonly taskResultsService: TaskResultsService) {}

  onModuleInit() {
    // 初始化TaskResult的静态服务实例
    TaskResult.setService(this.taskResultsService);
  }
}
