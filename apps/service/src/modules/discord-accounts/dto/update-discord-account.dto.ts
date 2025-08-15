import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { AccountStatus } from '../../../common/types/account-status.enum';

export class UpdateDiscordAccountDto {
  @ApiProperty({
    description: 'Discord账号',
    example: 'username#1234',
    required: false,
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: '邮箱',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: '邮箱密码',
    required: false,
    example: 'emailpass123',
  })
  @IsString()
  @IsOptional()
  emailPassword?: string;

  @ApiProperty({
    description: '登录密码',
    required: false,
    example: 'password123',
  })
  @IsString()
  @IsOptional()
  password?: string;

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
