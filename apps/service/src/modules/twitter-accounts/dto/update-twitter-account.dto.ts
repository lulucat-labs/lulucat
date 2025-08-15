import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { AccountStatus } from '../../../common/types/account-status.enum';

export class UpdateTwitterAccountDto {
  @ApiProperty({
    description: '推特账号',
    example: 'username',
    required: false,
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: '推特密码',
    example: 'password123',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: '2FA验证信息',
    required: false,
    example: '123456',
  })
  @IsString()
  @IsOptional()
  twoFactorAuth?: string;

  @ApiProperty({
    description: '辅助邮箱',
    required: false,
    example: 'recovery@example.com',
  })
  @IsEmail()
  @IsOptional()
  recoveryEmail?: string;

  @ApiProperty({
    description: '辅助邮箱密码',
    required: false,
    example: 'emailpass123',
  })
  @IsString()
  @IsOptional()
  recoveryEmailPassword?: string;

  @ApiProperty({
    description: '访问令牌',
    required: false,
    example: 'token123',
  })
  @IsString()
  @IsOptional()
  token?: string;
  
  @ApiProperty({
    description: '账号状态',
    enum: AccountStatus,
    required: false,
    example: AccountStatus.NORMAL,
  })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;
} 