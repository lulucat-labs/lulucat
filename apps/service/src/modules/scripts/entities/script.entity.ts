import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('scripts')
export class Script {
  @ApiProperty({ description: '脚本ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '脚本名称' })
  @Column()
  name: string;

  @ApiProperty({ description: '脚本文件路径' })
  @Column({ name: 'file_path' })
  filePath: string;

  @ApiProperty({ description: '是否为公共脚本' })
  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @ApiProperty({ description: '脚本描述' })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ description: '项目ID', required: false })
  @Column({ name: 'project_id', nullable: true })
  projectId: number;

  @ManyToOne(() => Project, (project) => project.scripts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToMany(() => Task, (task) => task.scripts)
  tasks: Task[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
