import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { DateRangeSearchDto } from '../../../common/dto/date-range.dto';

export class QueryBrowserFingerprintDto extends DateRangeSearchDto {
  @ApiProperty({
    description: '浏览器类型',
    required: false,
    example: 'Chrome',
  })
  @IsOptional()
  @IsString()
  browserType?: string;

  @ApiProperty({
    description: '设备名称',
    required: false,
    example: 'MacBook Pro',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;
  
  @ApiProperty({
    description: 'WebGL渲染器',
    required: false,
    example: 'NVIDIA',
  })
  @IsOptional()
  @IsString()
  webglRenderer?: string;
  
  @ApiProperty({
    description: 'WebGL供应商',
    required: false,
    example: 'Google Inc.',
  })
  @IsOptional()
  @IsString()
  webglVendor?: string;
  
  @ApiProperty({
    description: 'MAC地址',
    required: false,
    example: '00-00-00-00-00-00',
  })
  @IsOptional()
  @IsString()
  macAddress?: string;
  
  @ApiProperty({
    description: 'CPU核心数',
    required: false,
    example: 8,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cpuCores?: number;
  
  @ApiProperty({
    description: '设备内存(GB)',
    required: false,
    example: 8,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  deviceMemory?: number;
}
