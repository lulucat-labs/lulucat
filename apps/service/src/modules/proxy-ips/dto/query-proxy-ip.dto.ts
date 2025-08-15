import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { DateRangeSearchDto } from '../../../common/dto/date-range.dto';
import { AccountStatus } from '../../../common/types/account-status.enum';

export class QueryProxyIpDto extends DateRangeSearchDto {
  @ApiProperty({
    description: 'IP地址（支持模糊查询）',
    required: false,
    example: '192.168.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({
    description: '代理类型',
    required: false,
    enum: ['http', 'socks5'],
  })
  @IsOptional()
  @IsIn(['http', 'socks5'])
  proxyType?: string;

  @ApiProperty({
    description: '地理位置（支持模糊查询）',
    required: false,
    example: '中国',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: '代理状态',
    required: false,
    enum: AccountStatus,
    enumName: 'AccountStatus',
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiProperty({
    description: '是否关联账号组',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === true) return true;
    if (value === false) return false;
    return undefined;
  })
  hasAccountGroup?: boolean;
}
