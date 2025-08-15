import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class DeleteTwitterAccountsDto {
  @ApiProperty({
    description: '要删除的推特账号ID数组',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
