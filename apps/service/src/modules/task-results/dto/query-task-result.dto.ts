import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 查询任务结果的DTO
 */
export class QueryTaskResultDto {
  @ApiProperty({ description: '项目ID', required: false })
  @IsOptional()
  @IsNumber({}, { message: '项目ID必须是数字' })
  @Type(() => Number)
  projectId?: number;

  @ApiProperty({ description: '账号组条目ID', required: false })
  @IsOptional()
  @IsNumber({}, { message: '账号组条目ID必须是数字' })
  @Type(() => Number)
  accountGroupItemId?: number;

  @ApiProperty({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber({}, { message: '页码必须是数字' })
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: '每页条数', default: 10 })
  @IsOptional()
  @IsNumber({}, { message: '每页条数必须是数字' })
  @Type(() => Number)
  limit?: number = 10;
}
