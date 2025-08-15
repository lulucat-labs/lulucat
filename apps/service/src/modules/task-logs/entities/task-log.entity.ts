import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Task, TaskStatus } from '../../tasks/entities/task.entity';
import { AccountGroupItem } from '../../account-groups/entities/account-group-item.entity';

@Entity('task_logs')
export class TaskLog {
  @ApiProperty({ description: '日志ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '任务状态', enum: TaskStatus })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    enumName: 'task_status',
  })
  status: TaskStatus;

  @ApiProperty({ description: '开始时间' })
  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @ApiProperty({ description: '结束时间' })
  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime?: Date;

  @ApiProperty({ description: '执行日志' })
  @Column({ type: 'text' })
  logs: string;

  @ApiProperty({ description: '任务ID' })
  @Column({ name: 'task_id' })
  taskId: number;

  @ManyToOne(() => Task, (task) => task.taskLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ApiProperty({ description: '账号组条目ID' })
  @Column({ name: 'account_group_item_id', nullable: true })
  accountGroupItemId: number;

  @ManyToOne(() => AccountGroupItem)
  @JoinColumn({ name: 'account_group_item_id' })
  accountGroupItem: AccountGroupItem;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({ description: '错误信息' })
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @ApiProperty({ description: '错误代码' })
  @Column({ name: 'error_code', type: 'varchar', length: 50, nullable: true })
  errorCode: string;
}
