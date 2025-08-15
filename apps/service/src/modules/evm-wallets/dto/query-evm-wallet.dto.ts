import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, IsNumber, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryEvmWalletDto extends PaginationDto {
  @ApiProperty({
    description: '钱包地址（支持精确查询）',
    required: false,
    example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  })
  @IsOptional()
  @IsString()
  @ValidateIf(o => !!o.walletAddress)
  @Matches(/^0x[a-fA-F0-9]+$/, {
    message: '无效的钱包地址格式',
  })
  walletAddress?: string;

  @ApiProperty({
    description: '最小余额（ETH），支持最多18位小数',
    required: false,
    example: '0.00002',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 18,
  })
  @Min(0)
  minBalance?: number;

  @ApiProperty({
    description: '最大余额（ETH），支持最多18位小数',
    required: false,
    example: '10',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
    maxDecimalPlaces: 18,
  })
  @Min(0)
  maxBalance?: number;
}
