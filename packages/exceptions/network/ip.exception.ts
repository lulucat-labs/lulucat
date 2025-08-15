import { TaskEngineException } from '../common/base.exception';
import { TaskExceptionCode } from '../common/codes.enum';

/**
 * IP/代理相关异常类
 * 处理所有与 IP 和代理服务器交互相关的错误
 */
export class IpException extends TaskEngineException {
  /**
   * 创建 IP 被封禁异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static ipBlocked(
    message = 'IP 地址已被封禁',
    details?: Record<string, any>,
  ): IpException {
    return new IpException(TaskExceptionCode.IP_BLOCKED, message, details);
  }

  /**
   * 创建 IP 速率限制异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static rateLimited(
    message = 'IP 地址已被限速',
    details?: Record<string, any>,
  ): IpException {
    return new IpException(TaskExceptionCode.IP_RATE_LIMITED, message, details);
  }

  /**
   * 创建代理连接失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static proxyConnectionFailed(
    message = '连接代理服务器失败',
    details?: Record<string, any>,
  ): IpException {
    return new IpException(
      TaskExceptionCode.PROXY_CONNECTION_FAILED,
      message,
      details,
    );
  }

  /**
   * 创建代理认证失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static proxyAuthenticationFailed(
    message = '代理服务器认证失败',
    details?: Record<string, any>,
  ): IpException {
    return new IpException(
      TaskExceptionCode.PROXY_AUTHENTICATION_FAILED,
      message,
      details,
    );
  }

  /**
   * 创建代理无效异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static proxyInvalid(
    message = '代理服务器配置无效',
    details?: Record<string, any>,
  ): IpException {
    return new IpException(TaskExceptionCode.PROXY_INVALID, message, details);
  }

  /**
   * 创建地理位置限制异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static geolocationRestricted(
    message = '服务在当前地理位置不可用',
    details?: Record<string, any>,
  ): IpException {
    return new IpException(
      TaskExceptionCode.GEOLOCATION_RESTRICTED,
      message,
      details,
    );
  }

  /**
   * 创建 IP 未找到异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static ipNotFound(
    message = 'IP 地址未找到',
    details?: Record<string, any>,
  ): IpException {
    return new IpException(TaskExceptionCode.IP_NOT_FOUND, message, details);
  }
}
