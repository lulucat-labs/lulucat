import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateScriptDto {
  @ApiProperty({ description: '脚本名称' })
  @IsNotEmpty({ message: '脚本名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '脚本文件路径' })
  @IsNotEmpty({ message: '脚本文件路径不能为空' })
  @IsString()
  filePath: string;

  @ApiProperty({ description: '是否为公共脚本' })
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty({ description: '项目ID', required: false })
  @IsOptional()
  @IsNumber()
  projectId?: number;

  @ApiProperty({ description: '脚本描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
