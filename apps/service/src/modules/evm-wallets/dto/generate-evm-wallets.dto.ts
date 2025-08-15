import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateEvmWalletsDto {
  @ApiProperty({
    description: '要生成的钱包数量',
    minimum: 1,
    maximum: 999,
    example: 10,
  })
  @IsInt()
  @Min(1)
  @Max(999)
  count: number;
}
