import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AccountStatus } from '../../../common/types/account-status.enum';

export class QueryAccountGroupDto {
  @ApiPropertyOptional({ description: '账号组名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize: number = 10;

  @ApiPropertyOptional({
    description: '创建时间范围，格式为[开始时间, 结束时间]',
    type: [String],
  })
  @IsOptional()
  createdAtRange?: [string, string];

  @IsOptional()
  @Type(() => Date)
  createdAtStart?: Date;

  @IsOptional()
  @Type(() => Date)
  createdAtEnd?: Date;

  // 用于任务日志查询的参数
  @ApiPropertyOptional({ description: '任务ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  taskId?: number;

  @ApiPropertyOptional({ description: '任务日志状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '错误类型' })
  @IsOptional()
  @IsString()
  errorCode?: string;

  @ApiPropertyOptional({
    description: '账号类型',
    enum: [
      'evmWallet',
      'twitter',
      'discord',
      'email',
      'proxyIp',
      'browserFingerprint',
    ],
  })
  @IsOptional()
  @IsString()
  accountType?: string;

  @ApiPropertyOptional({
    description: '账号状态',
    enum: AccountStatus,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;
}
