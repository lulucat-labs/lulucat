import { ApiProperty } from '@nestjs/swagger';

/**
 * 导入错误记录
 */
export class ImportErrorDto {
  /**
   * 行号
   */
  @ApiProperty()
  line: number;

  /**
   * 原始内容
   */
  @ApiProperty()
  content: string;

  /**
   * 错误原因
   */
  @ApiProperty()
  reason: string;

  constructor(line: number, content: string, reason: string) {
    this.line = line;
    this.content = content;
    this.reason = reason;
  }
}

/**
 * 文件导入结果
 */
export class ImportResultDto {
  /**
   * 总处理数量
   */
  @ApiProperty()
  total: number;

  /**
   * 成功数量
   */
  @ApiProperty()
  success: number;

  /**
   * 错误记录
   */
  @ApiProperty({
    type: [ImportErrorDto],
  })
  errors: ImportErrorDto[];

  constructor(total: number, success: number, errors: ImportErrorDto[]) {
    this.total = total;
    this.success = success;
    this.errors = errors;
  }
}

/**
 * 批量导出请求
 */
export class ExportRequestDto {
  /**
   * 要导出的记录ID列表
   */
  @ApiProperty({
    type: [Number],
    description: '要导出的记录ID列表',
  })
  ids?: number[];
}
