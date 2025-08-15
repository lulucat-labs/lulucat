import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { TaskStatus } from '../../tasks/entities/task.entity';

export class CreateTaskLogDto {
  @ApiProperty({ description: '任务ID' })
  @IsNotEmpty({ message: '任务ID不能为空' })
  @IsNumber()
  taskId: number;

  @ApiProperty({ description: '账号组条目ID' })
  @IsNotEmpty({ message: '账号组条目ID不能为空' })
  @IsNumber()
  accountGroupItemId: number;

  @ApiProperty({ description: '任务状态', enum: TaskStatus })
  @IsNotEmpty({ message: '任务状态不能为空' })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiProperty({ description: '执行日志', required: false })
  @IsOptional()
  @IsString()
  logs?: string;

  @ApiProperty({ description: '错误信息', required: false })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ description: '错误代码', required: false })
  @IsOptional()
  @IsString()
  errorCode?: string;
}
