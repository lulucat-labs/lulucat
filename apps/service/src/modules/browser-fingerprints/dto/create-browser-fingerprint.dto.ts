import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, Length, Matches } from 'class-validator';

export class CreateBrowserFingerprintDto {
  @ApiProperty({
    description: '用户代理字符串',
    example:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.116 Safari/537.36',
  })
  @IsString()
  @Length(10, 500)
  userAgent: string;

  @ApiProperty({
    description: 'WebGL厂商信息',
    example: 'Google Inc. (NVIDIA)',
  })
  @IsString()
  @Length(1, 100)
  webglVendor: string;

  @ApiProperty({
    description: 'WebGL渲染器信息',
    example:
      'ANGLE (NVIDIA, NVIDIA GeForce GTX 760 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  })
  @IsString()
  @Length(1, 500)
  webglRenderer: string;

  @ApiProperty({
    description: '设备名称',
    example: 'DESKTOP-7D928C52',
  })
  @IsString()
  @Length(1, 100)
  @Matches(/^DESKTOP-[A-Z0-9]{8}$/)
  deviceName: string;

  @ApiProperty({
    description: 'MAC地址',
    example: '90-32-4B-C5-63-92',
  })
  @IsString()
  @Length(17, 17)
  @Matches(/^([0-9A-F]{2}-){5}[0-9A-F]{2}$/)
  macAddress: string;

  @ApiProperty({
    description: 'CPU核心数',
    example: 8,
    enum: [2, 4, 6, 8, 12, 16, 20, 24],
  })
  @IsInt()
  @Min(2)
  @Max(24)
  cpuCores: number;

  @ApiProperty({
    description: '设备内存(GB)',
    example: 8,
    enum: [4, 8],
  })
  @IsInt()
  @Min(4)
  @Max(8)
  deviceMemory: number;
}
