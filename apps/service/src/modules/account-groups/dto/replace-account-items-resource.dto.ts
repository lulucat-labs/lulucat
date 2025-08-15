import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsBoolean,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AccountResourceType {
  EVM_WALLET = 'evmWallet',
  TWITTER = 'twitter',
  DISCORD = 'discord',
  EMAIL = 'email',
  PROXY_IP = 'proxyIp',
  BROWSER_FINGERPRINT = 'browserFingerprint',
}

export class ReplaceAccountItemsResourceDto {
  @ApiProperty({
    description: '账号项ID数组',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @Type(() => Number)
  accountItemIds: number[];

  @ApiProperty({
    description: '需要更换的账号资源类型',
    enum: AccountResourceType,
    example: AccountResourceType.TWITTER,
  })
  @IsEnum(AccountResourceType)
  accountType: AccountResourceType;

  @ApiProperty({
    description: '是否排除已关联的账号',
    type: Boolean,
    default: true,
    required: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  excludeAssociated: boolean = true;

  @ApiProperty({
    description: '是否排除状态为invalid的账号',
    type: Boolean,
    default: true,
    required: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  excludeInvalid: boolean = true;

  @ApiProperty({
    description: '是否更换已有账号资源（有值的账号数据）',
    type: Boolean,
    default: true,
    required: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  replaceIfExists?: boolean = true;
}
