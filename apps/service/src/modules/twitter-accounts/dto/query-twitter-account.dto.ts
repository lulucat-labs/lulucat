import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail } from 'class-validator';
import { DateRangeSearchDto } from '../../../common/dto/date-range.dto';

export class QueryTwitterAccountDto extends DateRangeSearchDto {
  @ApiProperty({
    description: '推特账号（支持模糊查询）',
    required: false,
    example: 'username',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: '辅助邮箱（支持模糊查询）',
    required: false,
    example: 'recovery@example.com',
  })
  @IsOptional()
  @IsEmail()
  recoveryEmail?: string;

  @ApiProperty({
    description: '访问令牌（支持模糊查询）',
    required: false,
    example: 'token123',
  })
  @IsOptional()
  @IsString()
  token?: string;
}
