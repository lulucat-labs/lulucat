import { TaskEngineException } from '../common/base.exception';
import { TaskExceptionCode } from '../common/codes.enum';

/**
 * 邮箱相关异常类
 * 处理所有与邮箱交互相关的错误
 */
export class EmailException extends TaskEngineException {
  /**
   * 创建邮件发送失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static sendFailed(
    message = '邮件发送失败',
    details?: Record<string, any>,
  ): EmailException {
    return new EmailException(
      TaskExceptionCode.EMAIL_SEND_FAILED,
      message,
      details,
    );
  }

  /**
   * 创建邮件接收失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static receiveFailed(
    message = '邮件接收失败',
    details?: Record<string, any>,
  ): EmailException {
    return new EmailException(
      TaskExceptionCode.EMAIL_RECEIVE_FAILED,
      message,
      details,
    );
  }

  /**
   * 创建邮箱验证失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static verificationFailed(
    message = '邮箱验证失败',
    details?: Record<string, any>,
  ): EmailException {
    return new EmailException(
      TaskExceptionCode.EMAIL_VERIFICATION_FAILED,
      message,
      details,
    );
  }

  /**
   * 创建邮箱未找到异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static emailNotFound(
    message = '邮箱未找到',
    details?: Record<string, any>,
  ): EmailException {
    return new EmailException(
      TaskExceptionCode.EMAIL_NOT_FOUND,
      message,
      details,
    );
  }

  /**
   * 创建邮箱认证失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static authenticationFailed(
    message = '邮箱认证失败',
    details?: Record<string, any>,
  ): EmailException {
    return new EmailException(
      TaskExceptionCode.EMAIL_AUTHENTICATION_FAILED,
      message,
      details,
    );
  }

  /**
   * 创建邮箱格式无效异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static invalidFormat(
    message = '邮箱格式无效',
    details?: Record<string, any>,
  ): EmailException {
    return new EmailException(
      TaskExceptionCode.EMAIL_INVALID_FORMAT,
      message,
      details,
    );
  }

  /**
   * 创建邮箱收件箱已满异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static inboxFull(
    message = '邮箱收件箱已满',
    details?: Record<string, any>,
  ): EmailException {
    return new EmailException(
      TaskExceptionCode.EMAIL_INBOX_FULL,
      message,
      details,
    );
  }
}
