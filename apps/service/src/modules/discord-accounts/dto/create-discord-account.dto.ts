import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, ValidateIf, IsEmail } from 'class-validator';

export class CreateDiscordAccountDto {
  @ApiProperty({
    description: 'Discord账号',
    example: 'username#1234',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: '邮箱',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

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
  @ValidateIf((o) => !o.token)
  @IsNotEmpty({ message: '当未提供token时，登录密码不能为空' })
  password?: string;

  @ApiProperty({
    description: '访问令牌',
    required: false,
    example: 'token123',
  })
  @IsString()
  @ValidateIf((o) => !o.password)
  @IsNotEmpty({ message: '当未提供登录密码时，访问令牌不能为空' })
  token?: string;
}
