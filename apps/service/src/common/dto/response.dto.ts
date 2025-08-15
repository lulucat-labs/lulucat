/**
 * 通用响应格式
 */
export class ResponseDto<T> {
  /**
   * 响应状态码
   * @example 200
   */
  code: number;

  /**
   * 响应数据
   */
  data: T | null;

  /**
   * 响应消息
   * @example "操作成功"
   */
  message: string;

  constructor(code: number, data: T | null, message: string) {
    this.code = code;
    this.data = data;
    this.message = message;
  }

  /**
   * 创建成功响应
   */
  static success<T>(
    data: T | null = null,
    message = '操作成功',
  ): ResponseDto<T> {
    return new ResponseDto<T>(200, data, message);
  }

  /**
   * 创建错误响应
   */
  static error<T>(message: string, code = 400): ResponseDto<T> {
    return new ResponseDto<T>(code, null, message);
  }
}
