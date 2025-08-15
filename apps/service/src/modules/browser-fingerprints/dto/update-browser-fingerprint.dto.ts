import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus } from '../../../common/types/account-status.enum';

export class UpdateBrowserFingerprintDto {
  @ApiProperty({ description: '用户代理字符串', required: false })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({ description: 'WebGL厂商信息', required: false })
  @IsString()
  @IsOptional()
  webglVendor?: string;

  @ApiProperty({ description: 'WebGL渲染器信息', required: false })
  @IsString()
  @IsOptional()
  webglRenderer?: string;

  @ApiProperty({ description: '设备名称', required: false })
  @IsString()
  @IsOptional()
  deviceName?: string;

  @ApiProperty({ description: 'MAC地址', required: false })
  @IsString()
  @IsOptional()
  macAddress?: string;

  @ApiProperty({ description: 'CPU核心数', required: false })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  cpuCores?: number;

  @ApiProperty({ description: '设备内存(GB)', required: false })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  deviceMemory?: number;

  @ApiProperty({
    description: '指纹状态',
    enum: AccountStatus,
    required: false,
    example: AccountStatus.NORMAL,
  })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;
} 