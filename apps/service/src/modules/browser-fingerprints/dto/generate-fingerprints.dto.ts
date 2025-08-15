import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class GenerateFingerprintsDto {
  @ApiProperty({
    description: '需要生成的指纹数量',
    example: 10,
    minimum: 1,
    maximum: 9999,
  })
  @IsInt()
  @Min(1)
  @Max(9999)
  count: number;
}
