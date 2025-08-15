import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class UpdateIpInfoDto {
  @ApiProperty({
    description: '要更新的代理IP主键ID数组，不传则更新全部',
    type: [Number],
    required: false,
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  proxyIds?: number[];
} 