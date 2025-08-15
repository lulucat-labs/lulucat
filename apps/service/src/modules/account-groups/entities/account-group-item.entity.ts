import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AccountGroup } from './account-group.entity';
import { DiscordAccount } from '../../discord-accounts/entities/discord-account.entity';
import { EmailAccount } from '../../email-accounts/entities/email-account.entity';
import { EvmWallet } from '../../evm-wallets/entities/evm-wallet.entity';
import { TwitterAccount } from '../../twitter-accounts/entities/twitter-account.entity';
import { ProxyIp } from '../../proxy-ips/entities/proxy-ip.entity';
import { BrowserFingerprint } from '../../browser-fingerprints/entities/browser-fingerprint.entity';

@Entity('account_group_items')
export class AccountGroupItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AccountGroup, (group) => group.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_group_id' })
  accountGroup: AccountGroup;

  @Column({
    name: 'account_group_id',
    comment: '账号组ID',
  })
  accountGroupId: number;

  @ManyToOne(() => DiscordAccount, {
    nullable: true,
  })
  @JoinColumn({ name: 'discord_account_id' })
  discordAccount: DiscordAccount;

  @Column({
    name: 'discord_account_id',
    comment: 'Discord账号ID',
    nullable: true,
  })
  discordAccountId: number;

  @ManyToOne(() => EmailAccount, {
    nullable: true,
  })
  @JoinColumn({ name: 'email_account_id' })
  emailAccount: EmailAccount;

  @Column({
    name: 'email_account_id',
    comment: '邮箱账号ID',
    nullable: true,
  })
  emailAccountId: number;

  @ManyToOne(() => EvmWallet, {
    nullable: true,
  })
  @JoinColumn({ name: 'evm_wallet_id' })
  evmWallet: EvmWallet;

  @Column({
    name: 'evm_wallet_id',
    comment: 'EVM钱包ID',
    nullable: true,
  })
  evmWalletId: number;

  @ManyToOne(() => TwitterAccount, {
    nullable: true,
  })
  @JoinColumn({ name: 'twitter_account_id' })
  twitterAccount: TwitterAccount;

  @Column({
    name: 'twitter_account_id',
    comment: '推特账号ID',
    nullable: true,
  })
  twitterAccountId: number;

  @ManyToOne(() => ProxyIp, {
    nullable: true,
  })
  @JoinColumn({ name: 'proxy_ip_id' })
  proxyIp: ProxyIp;

  @Column({
    name: 'proxy_ip_id',
    comment: '代理IP ID',
    nullable: true,
  })
  proxyIpId: number;

  @ManyToOne(() => BrowserFingerprint, {
    nullable: true,
  })
  @JoinColumn({ name: 'browser_fingerprint_id' })
  browserFingerprint: BrowserFingerprint;

  @Column({
    name: 'browser_fingerprint_id',
    comment: '浏览器指纹ID',
    nullable: true,
  })
  browserFingerprintId: number;

  @CreateDateColumn({
    name: 'created_at',
    comment: '创建时间',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    comment: '更新时间',
  })
  updatedAt: Date;
}
