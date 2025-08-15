import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  Min,
  ArrayMinSize,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ description: '任务名称' })
  @IsNotEmpty({ message: '任务名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '项目ID' })
  @IsNotEmpty({ message: '项目ID不能为空' })
  @IsNumber()
  projectId: number;

  @ApiProperty({
    description: '账号组ID列表',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray({ message: '账号组ID必须是数组' })
  @ArrayMinSize(1, { message: '至少选择一个账号组' })
  @IsNumber({}, { each: true, message: '账号组ID必须是数字' })
  accountGroupIds: number[];

  @ApiProperty({
    description: '脚本ID列表',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray({ message: '脚本ID必须是数组' })
  @ArrayMinSize(1, { message: '至少选择一个脚本' })
  @IsNumber({}, { each: true, message: '脚本ID必须是数字' })
  scriptIds: number[];

  @ApiProperty({ description: '执行线程数' })
  @IsNumber()
  @Min(1, { message: '执行线程数最小为1' })
  threadCount: number;
}
