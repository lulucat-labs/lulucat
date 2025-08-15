import { EmailAccount } from '../../../email-accounts/entities/email-account.entity';
import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import { Page } from 'playwright';
import { getMailCode } from './get-mail-code';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { waitForPageLoad } from '@lulucat/tdk/browser';
import { EmailException } from '@lulucat/exceptions';
import { TaskResult } from '../task-result';
import { StorkTaskResult } from './types';

/**
 * 检查邮箱地址是否在stork.txt文件中存在
 * @param emailAddress 要检查的邮箱地址
 * @param baseDir 基础目录路径
 * @returns 存在返回true，不存在返回false
 */
export function isEmailInStorkFile(
  emailAddress: string,
  baseDir: string,
): boolean {
  try {
    const storkFilePath = join(baseDir, 'task-result', 'stork.txt');

    // 检查文件是否存在
    if (!existsSync(storkFilePath)) {
      console.log('Stork文件不存在:', storkFilePath);
      return false;
    }

    // 读取文件内容
    const fileContent = readFileSync(storkFilePath, 'utf-8');

    // 查找邮箱地址是否存在于文件中
    // 使用正则表达式匹配以邮箱地址开头的行
    const regex = new RegExp(`^${emailAddress}\\|`, 'm');
    const isExist = regex.test(fileContent);

    if (isExist) {
      console.log(`邮箱 ${emailAddress} 在stork.txt文件中已存在`);
    } else {
      console.log(`邮箱 ${emailAddress} 在stork.txt文件中不存在`);
    }

    return isExist;
  } catch (error) {
    console.error('检查邮箱地址失败:', error);
    return false;
  }
}

/**
 * 从文件中获取随机邀请码
 * @param baseDir 基础目录路径
 * @returns 随机选择的邀请码，如果文件不存在或为空则返回空字符串
 */
export function getRandomReferralCode(baseDir: string): string {
  try {
    const codePath = join(baseDir, 'task-result', 'code.txt');

    // 检查文件是否存在
    if (!existsSync(codePath)) {
      console.log('邀请码文件不存在:', codePath);
      return '';
    }

    // 读取文件内容
    const fileContent = readFileSync(codePath, 'utf-8');
    const codes = fileContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // 检查是否有可用的邀请码
    if (codes.length === 0) {
      console.log('邀请码文件为空');
      return '';
    }

    // 随机选择一个邀请码
    const randomIndex = Math.floor(Math.random() * codes.length);
    const selectedCode = codes[randomIndex];

    console.log(`已从${codes.length}个邀请码中随机选择:`, selectedCode);
    return selectedCode;
  } catch (error) {
    console.error('获取随机邀请码失败:', error);
    return '';
  }
}

export default class StorkTask {
  private readonly timeout = 30_000;
  private readonly websiteUrl =
    'https://app.stork.network/login?redirect_uri=https%3A%2F%2Fknnliglhgkmlblppdejchidfihjnockl.chromiumapp.org%2F';
  private readonly extensionUrl =
    'chrome-extension://knnliglhgkmlblppdejchidfihjnockl/src/popup.html';
  private websitePage: Page;
  private extensionPage: Page;
  private password: string;
  public taskResult: TaskResult<StorkTaskResult>;

  constructor(params: ScriptExecutionContext) {
    const { projectId, accountGroupItemId } = params;
    // 使用静态工厂方法创建TaskResult实例
    this.taskResult = TaskResult.create(projectId, accountGroupItemId);
  }

  /**
   * 执行任务
   * @param params 执行参数，包含浏览器上下文和任务配置
   * @returns 任务执行结果
   */
  public async execute(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    const { context, accountDetail, baseDir } = params;
    const { emailAddress, clientId, refreshToken } = accountDetail.emailAccount;

    try {
      // 检查邮箱是否存在于stork.txt文件中
      if (!isEmailInStorkFile(emailAddress, baseDir)) {
        console.log(`邮箱 ${emailAddress} 不在stork.txt文件中，任务结束`);
        return;
      }

      this.websitePage = await context.newPage();
      this.websitePage.setDefaultTimeout(this.timeout);
      this.websitePage.setDefaultNavigationTimeout(this.timeout);
      await waitForPageLoad(this.websitePage, {
        url: this.websiteUrl,
        requiredSelectors: [this.websitePage.getByRole('heading')],
      });
      const heading = await this.websitePage.getByRole('heading').textContent();

      if (heading === 'WELCOME BACK') {
        console.log('Account already exists');
        return {
          success: true,
          data: {
            message: '账号已经注册',
          },
        };
      }
      if (heading !== 'SIGN IN') {
        return {
          success: false,
          error: '页面加载失败',
        };
      }

      // 点击 Reset it 按钮
      await this.websitePage.getByRole('button', { name: 'Reset it' }).click();

      await this.websitePage.waitForSelector('h1:has-text("RESET PASSWORD")', {
        state: 'visible',
        timeout: this.timeout,
      });

      await this.websitePage
        .getByPlaceholder('Enter your Email')
        .fill(emailAddress);

      await this.websitePage
        .getByRole('button', { name: 'SEND RESET CODE' })
        .click();

      await this.websitePage.waitForSelector(
        'h1:has-text("SET NEW PASSWORD")',
        {
          state: 'visible',
          timeout: this.timeout,
        },
      );

      let code = '';
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        code = await getMailCode(emailAddress, clientId, refreshToken);
        if (code) {
          break;
        }
        retryCount++;
        console.log(`获取验证码失败,第${retryCount}次重试`);
        await this.websitePage.waitForTimeout(3000);
      }

      if (!code) {
        throw EmailException.receiveFailed(
          `获取邮箱验证码失败,重试${retryCount}次后仍未成功`,
        );
      }

      const password = this.generatePassword();

      await this.websitePage.getByPlaceholder('Code').fill(code);
      await this.websitePage
        .getByPlaceholder('Enter new password')
        .fill(password);
      await this.websitePage
        .getByPlaceholder('Confirm new password')
        .fill(password);
      await this.websitePage
        .getByRole('button', { name: 'RESET PASSWORD' })
        .click();

      await this.websitePage.waitForSelector('h1:has-text("WELCOME BACK")', {
        state: 'visible',
        timeout: this.timeout,
      });

      console.log('修改密码成功：');
      console.log('邮箱:', emailAddress);
      console.log('密码:', password);

      this.taskResult.updateTaskResult({
        email: emailAddress,
        password,
      });
    } catch (error) {
      console.error('任务执行失败:', error);
      throw error;
    }
  }

  private async registerAccount(emailAccount: EmailAccount, baseDir: string) {
    const { emailAddress, refreshToken, clientId } = emailAccount;

    await this.websitePage.getByText('Sign up').click();
    await this.websitePage
      .getByPlaceholder('Enter your Email')
      .fill(emailAddress);

    // 使用生成的密码
    const password = this.generatePassword();
    console.log('🚀 ~ StorkTask ~ password:', password);
    await this.websitePage
      .getByPlaceholder('Enter your Password')
      .fill(password);
    await this.websitePage
      .getByPlaceholder('Please confirm your Password')
      .fill(password);

    // 获取并填写邀请码
    const referralCode = getRandomReferralCode(baseDir);
    if (referralCode) {
      console.log('使用邀请码:', referralCode);
      await this.websitePage.getByPlaceholder('ABCDE12345').fill(referralCode);
    } else {
      console.log('没有可用的邀请码，跳过填写');
    }

    await this.websitePage
      .getByRole('button', { name: 'CREATE ACCOUNT' })
      .click();

    await this.websitePage
      .getByRole('heading', { name: 'We Emailed You' })
      .waitFor({
        timeout: this.timeout,
      });

    await this.websitePage.waitForTimeout(3000);

    let code = '';
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      code = await getMailCode(emailAddress, clientId, refreshToken);
      if (code) {
        break;
      }
      retryCount++;
      console.log(`获取验证码失败,第${retryCount}次重试`);
      await this.websitePage.waitForTimeout(3000);
    }

    if (!code) {
      throw new Error(`获取邮箱验证码失败,重试${retryCount}次后仍未成功`);
    }

    await this.websitePage.getByPlaceholder('Enter your code').fill(code);
    await this.websitePage.getByRole('button', { name: 'CONFIRM' }).click();

    try {
      await this.websitePage
        .getByRole('button', { name: 'CONFIRM' })
        .waitFor({ state: 'detached', timeout: this.timeout });
    } catch (error) {
      console.log('注册后没有跳转到 WELECOME BACK 页面');
    }

    return {
      password,
    };
  }

  /**
   * 生成符合规则的密码
   * 规则：
   * - 至少8个字符
   * - 包含小写字母
   * - 包含大写字母
   * - 包含特殊字符
   * @param length 密码长度，默认为12
   * @returns 生成的密码
   */
  private generatePassword(length: number = 12): string {
    const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numberChars = '0123456789';
    const specialChars = '!@#$%&*';

    // 确保密码包含基本字符类型
    let password = '';
    password += lowerCaseChars.charAt(
      Math.floor(Math.random() * lowerCaseChars.length),
    );
    password += upperCaseChars.charAt(
      Math.floor(Math.random() * upperCaseChars.length),
    );
    password += numberChars.charAt(
      Math.floor(Math.random() * numberChars.length),
    );

    // 随机添加1-2个特殊字符
    const specialCharCount = Math.floor(Math.random() * 2) + 1; // 生成1或2
    for (let i = 0; i < specialCharCount; i++) {
      password += specialChars.charAt(
        Math.floor(Math.random() * specialChars.length),
      );
    }

    // 所有可能的字符（不包含特殊字符）
    const allChars = lowerCaseChars + upperCaseChars + numberChars;

    // 填充剩余长度（使用非特殊字符）
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // 打乱密码字符顺序
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }
}
