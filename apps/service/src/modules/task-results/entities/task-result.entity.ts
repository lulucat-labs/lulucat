import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../projects/entities/project.entity';
import { AccountGroupItem } from '../../account-groups/entities/account-group-item.entity';

/**
 * 任务结果实体
 * 存储各种类型任务的执行结果
 */
@Entity('task_results')
export class TaskResult {
  @ApiProperty({ description: '结果ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '项目ID' })
  @Column({ name: 'project_id' })
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ApiProperty({ description: '账号组条目ID' })
  @Column({ name: 'account_group_item_id' })
  accountGroupItemId: number;

  @ManyToOne(() => AccountGroupItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_group_item_id' })
  accountGroupItem: AccountGroupItem;

  @ApiProperty({ description: '任务结果数据，以JSON格式存储' })
  @Column({ type: 'json' })
  result: Record<string, any>;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
