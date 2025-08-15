import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';

export class CheckRefreshTokensDto {
  @ApiProperty({
    description: '邮箱账号ID列表，不传则检测所有邮箱账号',
    required: false,
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsOptional()
  ids?: number[];
}
