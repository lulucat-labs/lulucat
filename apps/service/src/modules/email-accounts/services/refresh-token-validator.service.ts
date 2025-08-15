import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { EmailServiceType } from '../types/refresh-token-check.type';

@Injectable()
export class RefreshTokenValidatorService {
  private readonly logger = new Logger(RefreshTokenValidatorService.name);

  /**
   * 检测邮箱类型
   */
  getEmailServiceType(emailAddress: string): EmailServiceType {
    const lowerCaseEmail = emailAddress.toLowerCase();

    if (
      lowerCaseEmail.endsWith('@gmail.com') ||
      lowerCaseEmail.endsWith('@googlemail.com')
    ) {
      return EmailServiceType.GMAIL;
    } else if (
      lowerCaseEmail.endsWith('@outlook.com') ||
      lowerCaseEmail.endsWith('@hotmail.com') ||
      lowerCaseEmail.endsWith('@live.com') ||
      lowerCaseEmail.endsWith('@msn.com')
    ) {
      return EmailServiceType.OUTLOOK;
    }

    return EmailServiceType.UNKNOWN;
  }

  /**
   * 验证Gmail的refreshToken
   */
  async validateGmailRefreshToken(
    refreshToken: string,
    clientId: string,
  ): Promise<boolean> {
    try {
      const tokenData = new URLSearchParams({
        client_id: clientId,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        tokenData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return (
        response.status === 200 && response.data.access_token !== undefined
      );
    } catch (error) {
      this.logger.error(`Gmail refreshToken验证失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 验证Outlook/Microsoft的refreshToken
   */
  async validateOutlookRefreshToken(
    refreshToken: string,
    clientId: string,
  ): Promise<boolean> {
    try {
      const tokenData = new URLSearchParams({
        client_id: clientId,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await axios.post(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        tokenData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return (
        response.status === 200 && response.data.access_token !== undefined
      );
    } catch (error) {
      this.logger.error(`Outlook refreshToken验证失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 根据邮箱类型验证refreshToken
   */
  async validateRefreshToken(
    emailAddress: string,
    refreshToken: string,
    clientId: string,
  ): Promise<{ valid: boolean; errorMessage?: string }> {
    if (!refreshToken || !clientId) {
      return { valid: false, errorMessage: '缺少refreshToken或clientId' };
    }

    const emailType = this.getEmailServiceType(emailAddress);

    try {
      switch (emailType) {
        case EmailServiceType.GMAIL:
          const gmailValid = await this.validateGmailRefreshToken(
            refreshToken,
            clientId,
          );
          return {
            valid: gmailValid,
            errorMessage: gmailValid ? undefined : 'Gmail令牌验证失败',
          };

        case EmailServiceType.OUTLOOK:
          const outlookValid = await this.validateOutlookRefreshToken(
            refreshToken,
            clientId,
          );
          return {
            valid: outlookValid,
            errorMessage: outlookValid ? undefined : 'Outlook令牌验证失败',
          };

        default:
          return { valid: false, errorMessage: '不支持的邮箱类型' };
      }
    } catch (error) {
      return { valid: false, errorMessage: `验证失败: ${error.message}` };
    }
  }
}
