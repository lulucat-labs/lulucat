import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class CreateProxyIpDto {
  @ApiProperty({
    description: 'IP地址',
    example: '192.168.1.1',
  })
  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @ApiProperty({
    description: '端口号',
    example: 8080,
  })
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({
    description: '认证用户名',
    required: false,
    example: 'proxyuser',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: '认证密码',
    required: false,
    example: 'proxypass',
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: '代理类型',
    example: 'http',
    enum: ['http', 'socks5'],
    default: 'http',
  })
  @IsString()
  @IsIn(['http', 'socks5'])
  proxyType: string;

  @ApiProperty({
    description: '地理位置',
    required: false,
    example: '中国-上海',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: '是否可用',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
