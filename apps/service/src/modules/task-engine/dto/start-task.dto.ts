import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 启动任务的DTO，支持指定账号项
 */
export class StartTaskWithAccountItemsDto {
  @ApiPropertyOptional({
    description: '指定要启动的账号组项ID列表，不提供则启动全部账号项',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Type(() => Number)
  accountGroupItemIds?: number[];

  // 无头模式
  @ApiPropertyOptional({
    description: '是否启用无头模式',
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  headless?: boolean;
}
