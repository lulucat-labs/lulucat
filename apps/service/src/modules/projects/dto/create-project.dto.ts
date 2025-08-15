import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: '项目名称' })
  @IsNotEmpty({ message: '项目名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '项目网站' })
  @IsNotEmpty({ message: '项目网站不能为空' })
  @IsUrl({}, { message: '请输入有效的URL' })
  website: string;

  @ApiProperty({ description: 'Twitter账号', required: false })
  @IsOptional()
  @IsString()
  twitter?: string;

  @ApiProperty({ description: '项目描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
