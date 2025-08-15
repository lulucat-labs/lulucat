import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

/**
 * 带有日期范围搜索的分页查询DTO
 */
export class DateRangeSearchDto extends PaginationDto {
  @ApiProperty({
    description: '创建时间开始',
    required: false,
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAtStart?: Date;

  @ApiProperty({
    description: '创建时间结束',
    required: false,
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAtEnd?: Date;
} 