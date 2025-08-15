import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 分页查询参数
 */
export class PaginationDto {
  @ApiProperty({
    description: '页码',
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: '每页数量',
    default: 10,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize?: number = 10;

  @ApiProperty({
    description: '跳过记录数',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number;

  @ApiProperty({
    description: '获取记录数',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  take?: number;

  /**
   * 获取跳过的记录数
   */
  get actualSkip(): number {
    // 如果明确指定了skip，使用指定的值
    if (this.skip !== undefined) {
      return this.skip;
    }
    // 否则根据page和pageSize计算
    return (this.page - 1) * this.pageSize;
  }

  /**
   * 获取限制数量
   */
  get actualTake(): number {
    // 如果明确指定了take，使用指定的值
    if (this.take !== undefined) {
      return this.take;
    }
    // 否则使用pageSize
    return this.pageSize;
  }
}

/**
 * 分页响应数据
 */
export class PaginatedResponseDto<T> {
  /**
   * 总记录数
   */
  @ApiProperty()
  total: number;

  /**
   * 当前页数据
   */
  @ApiProperty()
  items: T[];

  constructor(items: T[], total: number) {
    this.items = items;
    this.total = total;
  }
}
