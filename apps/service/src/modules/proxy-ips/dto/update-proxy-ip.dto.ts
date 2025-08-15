import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  IsEnum,
} from 'class-validator';
import { AccountStatus } from '../../../common/types/account-status.enum';

export class UpdateProxyIpDto {
  @ApiProperty({
    description: 'IP地址',
    example: '192.168.1.1',
    required: false,
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({
    description: '端口号',
    example: 8080,
    required: false,
  })
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  port?: number;

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
    required: false,
  })
  @IsString()
  @IsIn(['http', 'socks5'])
  @IsOptional()
  proxyType?: string;

  @ApiProperty({
    description: '地理位置',
    required: false,
    example: '中国-上海',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'IP状态',
    enum: AccountStatus,
    enumName: 'AccountStatus',
    required: false,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
} 