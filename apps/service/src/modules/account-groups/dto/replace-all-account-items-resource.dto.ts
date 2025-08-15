import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountResourceType } from './replace-account-items-resource.dto';

export class ReplaceAllAccountItemsResourceDto {
  @ApiProperty({
    description: '账号组ID',
    type: Number,
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  accountGroupId: number;

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