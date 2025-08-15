import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 查询脚本参数
 */
export class QueryScriptDto extends PaginationDto {
  @ApiPropertyOptional({ description: '项目ID' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  projectId?: number;

  @ApiPropertyOptional({ description: '脚本名称（模糊搜索）' })
  @IsString()
  @IsOptional()
  name?: string;
} 