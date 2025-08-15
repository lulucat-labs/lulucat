import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject } from 'class-validator';

/**
 * 创建任务结果的DTO
 */
export class CreateTaskResultDto {
  @ApiProperty({ description: '项目ID' })
  @IsNotEmpty({ message: '项目ID不能为空' })
  @IsNumber({}, { message: '项目ID必须是数字' })
  projectId: number;

  @ApiProperty({ description: '账号组条目ID' })
  @IsNotEmpty({ message: '账号组条目ID不能为空' })
  @IsNumber({}, { message: '账号组条目ID必须是数字' })
  accountGroupItemId: number;

  @ApiProperty({ description: '任务结果数据，以JSON格式存储' })
  @IsNotEmpty({ message: '任务结果不能为空' })
  @IsObject({ message: '任务结果必须是对象' })
  result: Record<string, any>;
}
