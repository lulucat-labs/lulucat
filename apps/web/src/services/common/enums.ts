/**
 * 账号项类型枚举
 */
export enum AccountItemType {
  /**
   * EVM钱包
   */
  EVM_WALLET = 'evmWallet',

  /**
   * Twitter账号
   */
  TWITTER = 'twitter',

  /**
   * Discord账号
   */
  DISCORD = 'discord',

  /**
   * 邮箱
   */
  EMAIL = 'email',

  /**
   * 代理IP
   */
  PROXY_IP = 'proxyIp',

  /**
   * 浏览器指纹
   */
  BROWSER_FINGERPRINT = 'browserFingerprint',
}

/**
 * 账号状态枚举
 */
export enum AccountStatus {
  /**
   * 正常状态
   */
  NORMAL = 'normal',

  /**
   * 失效状态
   */
  INVALID = 'invalid',
}
