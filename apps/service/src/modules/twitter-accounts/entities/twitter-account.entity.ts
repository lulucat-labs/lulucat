import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AccountStatus } from '../../../common/types/account-status.enum';

/**
 * 推特账号实体
 */
@Entity('twitter_accounts')
export class TwitterAccount {
  @PrimaryGeneratedColumn({
    name: 'twitter_id',
    comment: '推特记录ID',
  })
  twitterId: number;

  @Column({
    name: 'user_id',
    comment: '关联用户ID',
  })
  userId: number;

  @Column({
    name: 'username',
    comment: '推特账号',
  })
  username: string;

  @Column({
    name: 'password',
    comment: '推特密码',
  })
  password: string;

  @Column({
    name: 'two_factor_auth',
    comment: '2FA验证信息',
    nullable: true,
  })
  twoFactorAuth?: string;

  @Column({
    name: 'recovery_email',
    comment: '辅助邮箱',
    nullable: true,
  })
  recoveryEmail?: string;

  @Column({
    name: 'recovery_email_password',
    comment: '辅助邮箱密码',
    nullable: true,
  })
  recoveryEmailPassword?: string;

  @Column({
    name: 'token',
    comment: '访问令牌',
    nullable: true,
  })
  token?: string;

  @Column({
    name: 'status',
    comment: '账号状态',
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
}
