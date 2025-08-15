import { TaskEngineException } from './base.exception';
import { TaskExceptionCode } from './codes.enum';

/**
 * 任务引擎通用/兜底异常类
 * 用于处理未明确分类的错误场景
 */
export class FallbackException extends TaskEngineException {
  /**
   * 创建通用异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  constructor(message: string, details?: Record<string, any>) {
    super(TaskExceptionCode.UNKNOWN_ERROR, message, details);
    Object.setPrototypeOf(this, FallbackException.prototype);
  }

  /**
   * 创建执行失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static executionFailed(
    message = '脚本执行失败',
    details?: Record<string, any>,
  ): FallbackException {
    return new FallbackException(message, {
      code: TaskExceptionCode.SCRIPT_EXECUTION_FAILED,
      ...details,
    });
  }

  /**
   * 创建超时异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static timeout(
    message = '操作超时',
    details?: Record<string, any>,
  ): FallbackException {
    return new FallbackException(message, {
      code: TaskExceptionCode.TIMEOUT_ERROR,
      ...details,
    });
  }

  /**
   * 创建参数无效异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static invalidParameter(
    message = '提供的参数无效',
    details?: Record<string, any>,
  ): FallbackException {
    return new FallbackException(message, {
      code: TaskExceptionCode.INVALID_PARAMETER,
      ...details,
    });
  }

  /**
   * 创建资源未找到异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static resourceNotFound(
    message = '资源未找到',
    details?: Record<string, any>,
  ): FallbackException {
    return new FallbackException(message, {
      code: TaskExceptionCode.RESOURCE_NOT_FOUND,
      ...details,
    });
  }

  /**
   * 创建权限拒绝异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static permissionDenied(
    message = '权限被拒绝',
    details?: Record<string, any>,
  ): FallbackException {
    return new FallbackException(message, {
      code: TaskExceptionCode.PERMISSION_DENIED,
      ...details,
    });
  }

  /**
   * 页面加载失败
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static pageLoadFailed(
    message = '页面加载失败',
    details?: Record<string, any>,
  ): FallbackException {
    return new FallbackException(message, {
      code: TaskExceptionCode.PAGE_LOAD_FAILED,
      ...details,
    });
  }
}
