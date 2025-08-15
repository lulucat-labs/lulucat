import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CryptoUtil } from '../../../common/utils/crypto.util';
import { ConfigService } from '@nestjs/config';
import { AccountStatus } from '../../../common/types/account-status.enum';

/**
 * EVM钱包实体
 */
@Entity('evm_wallets')
export class EvmWallet {
  @PrimaryGeneratedColumn({
    name: 'wallet_id',
    comment: '钱包记录ID',
  })
  walletId: number;

  @Column({
    name: 'user_id',
    comment: '关联用户ID',
  })
  userId: number;

  @Column({
    name: 'wallet_address',
    comment: '钱包地址',
    unique: true,
  })
  walletAddress: string;

  @Column({
    name: 'private_key',
    comment: '私钥（加密存储）',
  })
  privateKey: string;

  // 钱包余额
  @Column({
    name: 'balance',
    comment: '钱包余额',
  })
  balance: string;

  @Column({
    name: 'status',
    comment: '钱包状态',
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.NORMAL,
  })
  status: AccountStatus;

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 加密私钥
  private encryptPrivateKey(privateKey: string): string {
    const configService = new ConfigService();
    const encryptionKey = configService.get<string>('ENCRYPTION_KEY');
    return CryptoUtil.encrypt(privateKey, encryptionKey);
  }

  // 解密私钥
  private decryptPrivateKey(encryptedPrivateKey: string): string {
    const configService = new ConfigService();
    const encryptionKey = configService.get<string>('ENCRYPTION_KEY');
    return CryptoUtil.decrypt(encryptedPrivateKey, encryptionKey);
  }

  @BeforeInsert()
  @BeforeUpdate()
  encryptSensitiveData() {
    if (this.privateKey && !this.privateKey.includes(':')) {
      this.privateKey = this.encryptPrivateKey(this.privateKey);
    }
  }

  // 获取解密后的私钥
  getDecryptedPrivateKey(): string {
    return this.decryptPrivateKey(this.privateKey);
  }
}
