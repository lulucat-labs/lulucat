import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailAccountsService } from './email-accounts.service';
import { EmailAccountsController } from './email-accounts.controller';
import { EmailAccount } from './entities/email-account.entity';
import { AccountGroupsModule } from '../account-groups/account-groups.module';
import { MemoryTasksModule } from '../memory-tasks/memory-tasks.module';
import { RefreshTokenValidatorService } from './services/refresh-token-validator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailAccount]),
    AccountGroupsModule,
    MemoryTasksModule,
  ],
  controllers: [EmailAccountsController],
  providers: [EmailAccountsService, RefreshTokenValidatorService],
  exports: [EmailAccountsService],
})
export class EmailAccountsModule {}
