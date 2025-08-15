import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountGroupsService } from './account-groups.service';
import { AccountGroupsController } from './account-groups.controller';
import { AccountGroup } from './entities/account-group.entity';
import { AccountGroupItem } from './entities/account-group-item.entity';
import { DiscordAccount } from '../discord-accounts/entities/discord-account.entity';
import { EmailAccount } from '../email-accounts/entities/email-account.entity';
import { EvmWallet } from '../evm-wallets/entities/evm-wallet.entity';
import { TwitterAccount } from '../twitter-accounts/entities/twitter-account.entity';
import { ProxyIp } from '../proxy-ips/entities/proxy-ip.entity';
import { TaskLog } from '../task-logs/entities/task-log.entity';
import { BrowserFingerprint } from '../browser-fingerprints/entities/browser-fingerprint.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountGroup,
      AccountGroupItem,
      DiscordAccount,
      EmailAccount,
      EvmWallet,
      TwitterAccount,
      ProxyIp,
      BrowserFingerprint,
      TaskLog,
    ]),
  ],
  controllers: [AccountGroupsController],
  providers: [AccountGroupsService],
  exports: [AccountGroupsService],
})
export class AccountGroupsModule {}
