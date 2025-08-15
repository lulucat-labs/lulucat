import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { DateRangeSearchDto } from '../../../common/dto/date-range.dto';

export class QueryDiscordAccountDto extends DateRangeSearchDto {
  @ApiProperty({
    description: 'Discord账号（支持模糊查询）',
    required: false,
    example: 'username#1234',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: '访问令牌（支持模糊查询）',
    required: false,
    example: 'token123',
  })
  @IsOptional()
  @IsString()
  token?: string;
}
