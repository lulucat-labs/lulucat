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
 * 邮箱账号实体
 */
@Entity('email_accounts')
export class EmailAccount {
  @PrimaryGeneratedColumn({
    name: 'email_id',
    comment: '邮箱记录ID',
  })
  emailId: number;

  @Column({
    name: 'user_id',
    comment: '关联用户ID',
  })
  userId: number;

  @Column({
    name: 'email_address',
    comment: '邮箱地址',
  })
  emailAddress: string;

  @Column({
    name: 'email_password',
    comment: '邮箱密码',
  })
  emailPassword: string;

  @Column({
    name: 'verification_email',
    comment: '验证邮箱地址',
    nullable: true,
  })
  verificationEmail?: string;

  @Column({
    name: 'refresh_token',
    comment: '刷新令牌',
    nullable: true,
    type: 'text',
  })
  refreshToken?: string;

  @Column({
    name: 'client_id',
    comment: '客户端ID',
    nullable: true,
  })
  clientId?: string;

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
