import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { AccountStatus } from '../../../common/types/account-status.enum';

export class UpdateEmailAccountDto {
  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  emailAddress?: string;

  @ApiProperty({
    description: '邮箱密码',
    example: 'password123',
    required: false,
  })
  @IsString()
  @IsOptional()
  emailPassword?: string;

  @ApiProperty({
    description: '验证邮箱地址',
    required: false,
    example: 'verify@example.com',
  })
  @IsEmail()
  @IsOptional()
  verificationEmail?: string;

  @ApiProperty({
    description: '刷新令牌',
    required: false,
    example: 'refresh_token_example',
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @ApiProperty({
    description: '客户端ID',
    required: false,
    example: 'client_id_example',
  })
  @IsString()
  @IsOptional()
  clientId?: string;

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