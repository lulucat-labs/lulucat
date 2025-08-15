import { TaskEngineException } from '../common/base.exception';
import { TaskExceptionCode } from '../common/codes.enum';

/**
 * 钱包相关异常类
 * 处理所有与加密钱包交互相关的错误
 */
export class WalletException extends TaskEngineException {
  /**
   * 钱包连接失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static connectionFailed(
    message = '无法连接到钱包',
    details?: Record<string, any>,
  ): WalletException {
    return new WalletException(
      TaskExceptionCode.WALLET_CONNECTION_FAILED,
      message,
      details,
    );
  }

  /**
   * 导入钱包失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static importFailed(
    message = '导入钱包失败',
    details?: Record<string, any>,
  ): WalletException {
    return new WalletException(
      TaskExceptionCode.WALLET_IMPORT_FAILED,
      message,
      details,
    );
  }

  /**
   * 钱包余额不足异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static insufficientFunds(
    message = '钱包余额不足',
    details?: Record<string, any>,
  ): WalletException {
    return new WalletException(
      TaskExceptionCode.WALLET_INSUFFICIENT_FUNDS,
      message,
      details,
    );
  }

  /**
   * 创建交易失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static transactionFailed(
    message = '交易失败',
    details?: Record<string, any>,
  ): WalletException {
    return new WalletException(
      TaskExceptionCode.WALLET_TRANSACTION_FAILED,
      message,
      details,
    );
  }

  /**
   * 钱包地址无效异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static invalidAddress(
    message = '钱包地址无效',
    details?: Record<string, any>,
  ): WalletException {
    return new WalletException(
      TaskExceptionCode.WALLET_INVALID_ADDRESS,
      message,
      details,
    );
  }

  /**
   * 创建签名失败异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static signatureFailed(
    message = '消息或交易签名失败',
    details?: Record<string, any>,
  ): WalletException {
    return new WalletException(
      TaskExceptionCode.WALLET_SIGNATURE_FAILED,
      message,
      details,
    );
  }

  /**
   * 钱包未找到异常
   * @param message 错误消息
   * @param details 额外的错误详情
   */
  public static walletNotFound(
    message = '钱包未找到',
    details?: Record<string, any>,
  ): WalletException {
    return new WalletException(
      TaskExceptionCode.WALLET_NOT_FOUND,
      message,
      details,
    );
  }
}
