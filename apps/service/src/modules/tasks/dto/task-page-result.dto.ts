import { ApiProperty } from '@nestjs/swagger';
import { Task } from '../entities/task.entity';

export class TaskPageResult {
  @ApiProperty({
    description: '总记录数',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '当前页码',
    example: 1,
  })
  current: number;

  @ApiProperty({
    description: '每页条数',
    example: 10,
  })
  pageSize: number;

  @ApiProperty({
    description: '任务列表',
    type: [Task],
  })
  data: Task[];
} 