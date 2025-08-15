import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateTwitterAccountDto {
  @ApiProperty({
    description: '推特账号',
    example: 'username',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: '推特密码',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

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
}
