import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwitterAccountsService } from './twitter-accounts.service';
import { TwitterAccountsController } from './twitter-accounts.controller';
import { TwitterAccount } from './entities/twitter-account.entity';
import { AccountGroupsModule } from '../account-groups/account-groups.module';
import { MemoryTasksModule } from '../memory-tasks/memory-tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TwitterAccount]), 
    AccountGroupsModule,
    MemoryTasksModule
  ],
  controllers: [TwitterAccountsController],
  providers: [TwitterAccountsService],
  exports: [TwitterAccountsService],
})
export class TwitterAccountsModule {}
