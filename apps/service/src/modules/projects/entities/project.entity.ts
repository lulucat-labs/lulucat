import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Script } from '../../scripts/entities/script.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('projects')
export class Project {
  @ApiProperty({ description: '项目ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '项目名称' })
  @Column()
  name: string;

  @ApiProperty({ description: '项目网站' })
  @Column()
  website: string;

  @ApiProperty({ description: '项目Twitter账号', required: false })
  @Column({ name: 'twitter', nullable: true })
  twitter?: string;

  @ApiProperty({ description: '项目描述' })
  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => Script, (script) => script.project)
  scripts: Script[];

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
