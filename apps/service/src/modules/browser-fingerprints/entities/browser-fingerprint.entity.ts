import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { AccountStatus } from '../../../common/types/account-status.enum';

@Entity('browser_fingerprints')
export class BrowserFingerprint {
  @ApiProperty({ description: '指纹ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '用户代理字符串' })
  @Column({ name: 'user_agent', type: 'varchar', length: 500 })
  userAgent: string;

  @ApiProperty({ description: 'WebGL厂商信息' })
  @Column({ name: 'webgl_vendor', type: 'varchar', length: 100 })
  webglVendor: string;

  @ApiProperty({ description: 'WebGL渲染器信息' })
  @Column({ name: 'webgl_renderer', type: 'varchar', length: 500 })
  webglRenderer: string;

  @ApiProperty({ description: '设备名称' })
  @Column({ name: 'device_name', type: 'varchar', length: 100 })
  deviceName: string;

  @ApiProperty({ description: 'MAC地址' })
  @Column({ name: 'mac_address', type: 'varchar', length: 17 })
  macAddress: string;

  @ApiProperty({ description: 'CPU核心数' })
  @Column({ name: 'cpu_cores', type: 'int' })
  cpuCores: number;

  @ApiProperty({ description: '设备内存(GB)' })
  @Column({ name: 'device_memory', type: 'int' })
  deviceMemory: number;

  @ApiProperty({ description: '指纹状态' })
  @Column({
    name: 'status',
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.NORMAL,
    comment: '指纹状态',
  })
  status: AccountStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
