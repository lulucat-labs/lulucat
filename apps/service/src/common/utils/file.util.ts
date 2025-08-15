import { ImportErrorDto, ImportResultDto } from '../dto/import-export.dto';

/**
 * 文件处理工具类
 */
export class FileUtil {
  /**
   * 处理导入文件
   * @param file 上传的文件
   * @param processor 行处理函数
   * @returns 导入结果
   */
  static async processImportFile<T>(
    file: Express.Multer.File,
    processor: (line: string, lineNumber: number) => Promise<T>,
  ): Promise<ImportResultDto> {
    const content = file.buffer.toString('utf8');
    const lines = content.split('\n').filter((line) => line.trim());

    const total = lines.length;
    const errors: ImportErrorDto[] = [];
    let success = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      try {
        await processor(line, i + 1);
        success++;
      } catch (error) {
        errors.push(new ImportErrorDto(i + 1, line, error.message));
      }
    }

    return new ImportResultDto(total, success, errors);
  }

  /**
   * 生成导出文件
   * @param data 要导出的数据
   * @param formatter 数据格式化函数
   * @returns 文件Buffer
   */
  static generateExportFile<T>(
    data: T[],
    formatter: (item: T) => string,
  ): Buffer {
    const content = data.map(formatter).join('\n');
    return Buffer.from(content, 'utf8');
  }

  /**
   * 生成导出文件名
   * @param prefix 文件名前缀
   * @returns 文件名
   */
  static generateExportFileName(prefix: string): string {
    const timestamp = new Date().getTime();
    return `${prefix}.${timestamp}.txt`;
  }
}
