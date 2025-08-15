import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEmail, IsEnum } from 'class-validator';
import { DateRangeSearchDto } from '../../../common/dto/date-range.dto';
import { AccountStatus } from '../../../common/types/account-status.enum';

export class QueryEmailAccountDto extends DateRangeSearchDto {
  @ApiProperty({
    description: '邮箱地址（支持前缀查询）',
    required: false,
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  emailAddress?: string;

  @ApiProperty({
    description: '验证邮箱地址（支持前缀查询）',
    required: false,
    example: 'verify@example.com',
  })
  @IsOptional()
  @IsEmail()
  verificationEmail?: string;

  @ApiProperty({
    description: '账号状态',
    required: false,
    enum: AccountStatus,
    example: AccountStatus.NORMAL,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
