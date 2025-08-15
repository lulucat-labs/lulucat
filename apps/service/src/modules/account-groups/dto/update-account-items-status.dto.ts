import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus } from '../../../common/types/account-status.enum';

export enum AccountItemType {
  EVM_WALLET = 'evmWallet',
  TWITTER = 'twitter',
  DISCORD = 'discord',
  EMAIL = 'email',
  PROXY_IP = 'proxyIp',
  BROWSER_FINGERPRINT = 'browserFingerprint',
}

export class UpdateAccountItemsStatusDto {
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
    description: '需要修改状态的账号类型',
    enum: AccountItemType,
    isArray: true,
    example: [AccountItemType.EVM_WALLET, AccountItemType.TWITTER],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(AccountItemType, { each: true })
  accountTypes: AccountItemType[];

  @ApiProperty({
    description: '修改的目标状态',
    enum: AccountStatus,
    example: AccountStatus.NORMAL,
  })
  @IsEnum(AccountStatus)
  status: AccountStatus;
}
