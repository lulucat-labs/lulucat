import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProxyIpsService } from './proxy-ips.service';
import { ProxyIpsController } from './proxy-ips.controller';
import { ProxyIp } from './entities/proxy-ip.entity';
import { MemoryTasksModule } from '../memory-tasks/memory-tasks.module';
import { AccountGroupItem } from '../account-groups/entities/account-group-item.entity';
import { AccountGroupsModule } from '../account-groups/account-groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProxyIp, AccountGroupItem]),
    MemoryTasksModule,
    AccountGroupsModule,
  ],
  controllers: [ProxyIpsController],
  providers: [ProxyIpsService],
  exports: [ProxyIpsService],
})
export class ProxyIpsModule {}
