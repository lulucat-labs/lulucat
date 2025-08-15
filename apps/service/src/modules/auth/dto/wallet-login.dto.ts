import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';

export class WalletLoginDto {
  @ApiProperty({
    description: '钱包地址',
    example: '0xbefceb7e925242e4f3685c0bdc7be0dca6c77904',
  })
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    description: '签名信息',
    example:
      '0x6333952d5d36cee9b19578f3358c737d743b9151a22014182bd3e281849eff50354741a0855e340621d21f494bd7eaf403fa2d0a9c32b826212ea1011fb24dd91c',
  })
  @IsString()
  signature: string;

  @ApiProperty({
    description: '签名消息',
    example: 'Welcome to LuluCat! Please sign this message to login.',
  })
  @IsString()
  message: string;
}
