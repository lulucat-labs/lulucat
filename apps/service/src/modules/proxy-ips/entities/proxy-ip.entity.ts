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
 * 代理IP实体
 */
@Entity('proxy_ips')
export class ProxyIp {
  @PrimaryGeneratedColumn({
    name: 'proxy_id',
    comment: '代理记录ID',
  })
  proxyId: number;

  @Column({
    name: 'user_id',
    comment: '关联用户ID',
  })
  userId: number;

  @Column({
    name: 'ip_address',
    comment: 'IP地址',
  })
  ipAddress: string;

  @Column({
    name: 'port',
    comment: '端口号',
  })
  port: number;

  @Column({
    name: 'username',
    comment: '认证用户名',
    nullable: true,
  })
  username?: string;

  @Column({
    name: 'password',
    comment: '认证密码',
    nullable: true,
  })
  password?: string;

  @Column({
    name: 'proxy_type',
    comment: '代理类型(http/socks5)',
    default: 'http',
  })
  proxyType: string;

  @Column({
    name: 'location',
    comment: '地理位置',
    nullable: true,
  })
  location?: string;

  @Column({
    name: 'city',
    comment: '城市',
    nullable: true,
  })
  city?: string;

  @Column({
    name: 'region',
    comment: '地区',
    nullable: true,
  })
  region?: string;

  @Column({
    name: 'country',
    comment: '国家',
    nullable: true,
  })
  country?: string;

  @Column({
    name: 'latitude',
    comment: '纬度',
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
  })
  latitude?: number;

  @Column({
    name: 'longitude',
    comment: '经度',
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
  })
  longitude?: number;

  @Column({
    name: 'org',
    comment: '组织',
    nullable: true,
  })
  org?: string;

  @Column({
    name: 'postal',
    comment: '邮政编码',
    nullable: true,
  })
  postal?: string;

  @Column({
    name: 'timezone',
    comment: '时区',
    nullable: true,
  })
  timezone?: string;

  @Column({
    name: 'ip_info_updated_at',
    comment: 'IP信息更新时间',
    nullable: true,
  })
  ipInfoUpdatedAt?: Date;

  @Column({
    name: 'status',
    comment: '代理状态',
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
