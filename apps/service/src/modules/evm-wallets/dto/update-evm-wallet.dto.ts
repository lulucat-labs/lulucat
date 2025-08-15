import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, IsOptional, IsEnum } from 'class-validator';
import { AccountStatus } from '../../../common/types/account-status.enum';

export class UpdateEvmWalletDto {
  @ApiProperty({
    description: '钱包地址',
    example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: '无效的钱包地址格式',
  })
  walletAddress?: string;

  @ApiProperty({
    description: '私钥',
    example: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: '无效的私钥格式',
  })
  privateKey?: string;

  @ApiProperty({
    description: '钱包状态',
    enum: AccountStatus,
    enumName: 'AccountStatus',
    required: false,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
} 