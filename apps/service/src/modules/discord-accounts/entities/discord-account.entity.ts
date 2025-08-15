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
 * Discord账号实体
 */
@Entity('discord_accounts')
export class DiscordAccount {
  @PrimaryGeneratedColumn({
    name: 'discord_id',
    comment: 'Discord记录ID',
  })
  discordId: number;

  @Column({
    name: 'user_id',
    comment: '关联用户ID',
  })
  userId: number;

  @Column({
    name: 'username',
    comment: 'Discord账号',
  })
  username: string;

  @Column({
    name: 'email',
    comment: '邮箱',
  })
  email: string;

  @Column({
    name: 'email_password',
    comment: '邮箱密码',
    nullable: true,
  })
  emailPassword?: string;

  @Column({
    name: 'password',
    comment: '登录密码',
    nullable: true,
  })
  password?: string;

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
