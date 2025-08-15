import { TaskEngineException } from '../common/base.exception';
import { TaskExceptionCode } from '../common/codes.enum';

/**
 * X(Twitter)相关异常类
 * 处理所有与 X 平台交互相关的错误
 */
export class XException extends TaskEngineException {
  /**
   * 创建认证失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static authenticationFailed(
    message = 'X 平台认证失败',
    details?: Record<string, any>,
  ): XException {
    return new XException(
      TaskExceptionCode.X_AUTHENTICATION_FAILED,
      message,
      details,
    );
  }

  /**
   * 创建速率限制异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static rateLimitExceeded(
    message = 'X 平台速率限制已超出',
    details?: Record<string, any>,
  ): XException {
    return new XException(
      TaskExceptionCode.X_RATE_LIMIT_EXCEEDED,
      message,
      details,
    );
  }

  /**
   * 创建账号被封异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static accountSuspended(
    message = 'X 账号已被封禁',
    details?: Record<string, any>,
  ): XException {
    return new XException(
      TaskExceptionCode.X_ACCOUNT_SUSPENDED,
      message,
      details,
    );
  }

  /**
   * 创建发推失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static tweetFailed(
    message = '发推文失败',
    details?: Record<string, any>,
  ): XException {
    return new XException(TaskExceptionCode.X_TWEET_FAILED, message, details);
  }

  /**
   * 创建关注失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static followFailed(
    message = '关注用户失败',
    details?: Record<string, any>,
  ): XException {
    return new XException(TaskExceptionCode.X_FOLLOW_FAILED, message, details);
  }

  /**
   * 创建点赞失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static likeFailed(
    message = '点赞推文失败',
    details?: Record<string, any>,
  ): XException {
    return new XException(TaskExceptionCode.X_LIKE_FAILED, message, details);
  }

  /**
   * 创建转发失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static retweetFailed(
    message = '转发推文失败',
    details?: Record<string, any>,
  ): XException {
    return new XException(TaskExceptionCode.X_RETWEET_FAILED, message, details);
  }

  /**
   * 创建账号未找到异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static accountNotFound(
    message = 'X 账号未找到',
    details?: Record<string, any>,
  ): XException {
    return new XException(
      TaskExceptionCode.X_ACCOUNT_NOT_FOUND,
      message,
      details,
    );
  }
}
