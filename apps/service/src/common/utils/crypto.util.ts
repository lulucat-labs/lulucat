import * as crypto from 'crypto';

/**
 * 加密工具类
 */
export class CryptoUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly ENCODING = 'hex';

  /**
   * 生成密钥
   */
  private static generateKey(secret: string): Buffer {
    return crypto.scryptSync(secret, 'salt', this.KEY_LENGTH);
  }

  /**
   * 加密数据
   * @param text 要加密的文本
   * @param secret 密钥
   * @returns 加密后的文本（格式：iv:authTag:encryptedData）
   */
  static encrypt(text: string, secret: string): string {
    const key = this.generateKey(secret);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', this.ENCODING);
    encrypted += cipher.final(this.ENCODING);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString(this.ENCODING),
      authTag.toString(this.ENCODING),
      encrypted,
    ].join(':');
  }

  /**
   * 解密数据
   * @param encryptedText 加密后的文本（格式：iv:authTag:encryptedData）
   * @param secret 密钥
   * @returns 解密后的文本
   */
  static decrypt(encryptedText: string, secret: string): string {
    const [ivHex, authTagHex, encryptedData] = encryptedText.split(':');

    const key = this.generateKey(secret);
    const iv = Buffer.from(ivHex, this.ENCODING);
    const authTag = Buffer.from(authTagHex, this.ENCODING);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, this.ENCODING, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
