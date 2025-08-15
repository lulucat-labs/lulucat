import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordAccountsService } from './discord-accounts.service';
import { DiscordAccountsController } from './discord-accounts.controller';
import { DiscordAccount } from './entities/discord-account.entity';
import { AccountGroupsModule } from '../account-groups/account-groups.module';
import { MemoryTasksModule } from '../memory-tasks/memory-tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiscordAccount]), 
    AccountGroupsModule,
    MemoryTasksModule
  ],
  controllers: [DiscordAccountsController],
  providers: [DiscordAccountsService],
  exports: [DiscordAccountsService],
})
export class DiscordAccountsModule {}
