import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AccountType {
  TWITTER = 'twitter',
  DISCORD = 'discord',
  EMAIL = 'email',
  WALLET = 'wallet',
  IP = 'ip',
  BROWSER_FINGERPRINT = 'browserFingerprint',
}

export class CreateQuickAccountGroupDto {
  @ApiProperty({ description: '账号组名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '账号项数量' })
  @IsNumber()
  @Type(() => Number)
  count: number;

  @ApiProperty({
    description: '账号类型',
    enum: AccountType,
    isArray: true,
    example: [AccountType.TWITTER, AccountType.DISCORD],
  })
  @IsArray()
  @IsEnum(AccountType, { each: true })
  @ArrayMinSize(1)
  @ValidateIf((o) => {
    // 至少选择一个主要账号类型
    return (
      o.accountTypes &&
      !o.accountTypes.some((type) =>
        [
          AccountType.TWITTER,
          AccountType.DISCORD,
          AccountType.EMAIL,
          AccountType.WALLET,
        ].includes(type),
      )
    );
  })
  accountTypes: AccountType[];

  @ApiProperty({
    description: '是否排除已经被其他账号组关联的账号',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  excludeAssociated?: boolean;

  @ApiProperty({
    description: '是否排除状态为invalid的账号',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  excludeInvalid?: boolean;
}
