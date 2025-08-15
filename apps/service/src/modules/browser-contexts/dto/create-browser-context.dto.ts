import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional } from 'class-validator';

export class CreateBrowserContextDto {
  @ApiProperty({ description: '账号组项目ID', required: false })
  @IsNumber()
  @IsOptional()
  accountGroupItemId?: number;

  @ApiProperty({ description: '浏览器状态', required: false })
  @IsObject()
  @IsOptional()
  state?: Record<string, any>;
}
