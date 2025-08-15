import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateEvmWalletDto {
  @ApiProperty({
    description: '钱包地址',
    example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: '无效的钱包地址格式',
  })
  walletAddress: string;

  @ApiProperty({
    description: '私钥',
    example: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: '无效的私钥格式',
  })
  privateKey: string;
}
