import { TaskExceptionCode } from './codes.enum';

/**
 * 任务引擎基础异常类
 * 所有任务脚本中使用的异常都应继承此类
 */
export class TaskEngineException extends Error {
  /**
   * 异常代码
   */
  public readonly code: TaskExceptionCode;

  /**
   * 额外的错误详情数据
   */
  public readonly details?: Record<string, any>;

  /**
   * 创建任务引擎异常
   * @param code 异常代码
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  constructor(
    code: TaskExceptionCode,
    message: string,
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;

    // 确保正确的原型链，使 instanceof 能够正常工作
    Object.setPrototypeOf(this, TaskEngineException.prototype);

    // 保留堆栈信息
    Error.captureStackTrace(this, new.target);
  }

  /**
   * 获取异常的序列化表示，用于日志记录或者返回给客户端
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details || {},
    };
  }
}
