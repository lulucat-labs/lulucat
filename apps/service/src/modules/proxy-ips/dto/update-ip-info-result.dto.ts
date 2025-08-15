import { ApiProperty } from '@nestjs/swagger';

/**
 * 更新 IP 信息结果 DTO
 */
export class UpdateIpInfoResultDto {
  @ApiProperty({
    description: '总 IP 数量',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '成功获取信息的 IP 数量',
    example: 95,
  })
  success: number;

  @ApiProperty({
    description: '获取信息失败的 IP 列表',
    example: ['1.1.1.1', '2.2.2.2'],
  })
  errors: string[];
}
