import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateEmailAccountDto {
  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @ApiProperty({
    description: '邮箱密码',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  emailPassword: string;

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
}
