import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvmWalletsService } from './evm-wallets.service';
import { EvmWalletsController } from './evm-wallets.controller';
import { EvmWallet } from './entities/evm-wallet.entity';
import { AccountGroupsModule } from '../account-groups/account-groups.module';

@Module({
  imports: [TypeOrmModule.forFeature([EvmWallet]), AccountGroupsModule],
  controllers: [EvmWalletsController],
  providers: [EvmWalletsService],
  exports: [EvmWalletsService],
})
export class EvmWalletsModule {}
