import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class DeleteDiscordAccountsDto {
  @ApiProperty({
    description: '要删除的Discord账号ID数组',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
