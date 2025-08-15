import { TaskEngineException } from '../common/base.exception';
import { TaskExceptionCode } from '../common/codes.enum';

/**
 * Discord相关异常类
 * 处理所有与 Discord 平台交互相关的错误
 */
export class DiscordException extends TaskEngineException {
  /**
   * 创建认证失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static authenticationFailed(
    message = 'Discord 认证失败',
    details?: Record<string, any>,
  ): DiscordException {
    return new DiscordException(
      TaskExceptionCode.DISCORD_AUTHENTICATION_FAILED,
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
    message = 'Discord 速率限制已超出',
    details?: Record<string, any>,
  ): DiscordException {
    return new DiscordException(
      TaskExceptionCode.DISCORD_RATE_LIMIT_EXCEEDED,
      message,
      details,
    );
  }

  /**
   * 创建频道未找到异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static channelNotFound(
    message = 'Discord 频道未找到',
    details?: Record<string, any>,
  ): DiscordException {
    return new DiscordException(
      TaskExceptionCode.DISCORD_CHANNEL_NOT_FOUND,
      message,
      details,
    );
  }

  /**
   * 创建加入服务器失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static serverJoinFailed(
    message = '加入 Discord 服务器失败',
    details?: Record<string, any>,
  ): DiscordException {
    return new DiscordException(
      TaskExceptionCode.DISCORD_SERVER_JOIN_FAILED,
      message,
      details,
    );
  }

  /**
   * 创建消息发送失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static messageFailed(
    message = '发送 Discord 消息失败',
    details?: Record<string, any>,
  ): DiscordException {
    return new DiscordException(
      TaskExceptionCode.DISCORD_MESSAGE_FAILED,
      message,
      details,
    );
  }

  /**
   * 创建反应添加失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static reactionFailed(
    message = '添加表情反应失败',
    details?: Record<string, any>,
  ): DiscordException {
    return new DiscordException(
      TaskExceptionCode.DISCORD_REACTION_FAILED,
      message,
      details,
    );
  }

  /**
   * 创建验证失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static verificationFailed(
    message = 'Discord 验证完成失败',
    details?: Record<string, any>,
  ): DiscordException {
    return new DiscordException(
      TaskExceptionCode.DISCORD_VERIFICATION_FAILED,
      message,
      details,
    );
  }

  /**
   * 创建账号未找到异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static accountNotFound(
    message = 'Discord 账号未找到',
    details?: Record<string, any>,
  ): DiscordException {
    return new DiscordException(
      TaskExceptionCode.DISCORD_ACCOUNT_NOT_FOUND,
      message,
      details,
    );
  }
}
