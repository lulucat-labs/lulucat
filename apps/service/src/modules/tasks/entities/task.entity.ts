import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../projects/entities/project.entity';
import { Script } from '../../scripts/entities/script.entity';
import { AccountGroup } from '../../account-groups/entities/account-group.entity';
import { TaskLog } from '../../task-logs/entities/task-log.entity';
import { User } from '../../users/entities/user.entity';

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  STOPPED = 'stopped',
}

@Entity('tasks')
export class Task {
  @ApiProperty({ description: '任务ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '任务名称' })
  @Column()
  name: string;

  @ApiProperty({ description: '执行线程数' })
  @Column({ name: 'thread_count', default: 1 })
  threadCount: number;

  @ApiProperty({ description: '任务状态', enum: TaskStatus })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    enumName: 'task_status',
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @ApiProperty({ description: 'Cron表达式' })
  @Column({ name: 'cron_expression', default: null })
  cronExpression: string;

  @ApiProperty({ description: '项目ID' })
  @Column({ name: 'project_id' })
  projectId: number;

  @ApiProperty({ description: '用户ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ description: '硬件ID' })
  @Column({ name: 'machine_id', nullable: true })
  machineId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Project, (project) => project.tasks)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToMany(() => AccountGroup)
  @JoinTable({
    name: 'task_account_groups',
    joinColumn: { name: 'task_id' },
    inverseJoinColumn: { name: 'account_group_id' },
  })
  accountGroups: AccountGroup[];

  @ManyToMany(() => Script, (script) => script.tasks)
  @JoinTable({
    name: 'task_scripts',
    joinColumn: { name: 'task_id' },
    inverseJoinColumn: { name: 'script_id' },
  })
  scripts: Script[];

  @OneToMany(() => TaskLog, (taskLog) => taskLog.task, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  taskLogs: TaskLog[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
