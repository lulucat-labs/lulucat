import { ScriptExecutionContext } from '@lulucat/tdk/types';
import { LaunchOkxWallet } from '@lulucat/tdk/wallet';
import { waitForPageLoad } from '@lulucat/tdk/browser';
import { Page } from 'playwright';
import { AccountDetails } from '../../types';
import { CryptoUtil } from '../../../../common/utils/crypto.util';
import { ConfigService } from '@nestjs/config';
import { TaskResult } from '../task-result';
import { AbsTaskResult } from './types';
import { BadgeChecker } from './utils/check-badges';

export default class AbsBase {
  public readonly timeout = 30000;
  public readonly loginUrl = 'https://portal.abs.xyz/login';
  public readonly walletUrl = 'https://portal.abs.xyz/wallet';
  public readonly rewardsUrl = 'https://portal.abs.xyz/rewards';
  public readonly profileUrl = 'https://portal.abs.xyz/profile';
  public readonly accountDetail: AccountDetails;
  public absPage: Page;
  public taskResult: TaskResult<AbsTaskResult>;
  public badgeChecker: BadgeChecker;

  constructor(params: ScriptExecutionContext) {
    const { projectId, accountDetail, accountGroupItemId } = params;
    // 使用静态工厂方法创建TaskResult实例
    this.taskResult = TaskResult.create(projectId, accountGroupItemId);

    // 账号项详情
    this.accountDetail = accountDetail as AccountDetails;

    this.init(params);
  }

  private async init(params: ScriptExecutionContext) {
    const { context } = params;

    // 为当前上下文授予剪贴板权限
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  }

  public async loginOrRegister(params: ScriptExecutionContext) {
    // 登录完成后初始化BadgeChecker，开始收集请求头
    console.log('初始化BadgeChecker并开始收集请求头...');
    this.badgeChecker = new BadgeChecker(this.absPage, this.taskResult);
    // 检查是否需要登录
    if (await this.checkNeedToLogin()) {
      console.log('需要登录');
      await this.login(params);
    } else {
      console.log('不需要登录');
    }

    // 确保当前页面不是登录页面
    const currentUrl = this.absPage.url();
    if (currentUrl.includes('/login')) {
      console.log('当前处于登录页面，尝试导航到个人资料页面');
      await this.absPage.goto(this.profileUrl, { timeout: this.timeout })
        .catch(error => {
          console.error('导航到profile页面失败:', error);
        });
    }
    // 等待 5 秒
    await this.absPage.waitForTimeout(5000);
  }

  public async insertInnerWallet({ walletAddress, walletKey }) {
    const taskResult = await this.taskResult.getTaskResult();
    console.log('taskResult', taskResult);
    if (taskResult) {
      console.log('[TASK RESULT JSON] 账号数据已存在');

      await this.taskResult.updateTaskResult({
        absWallet: {
          privateKey: walletKey,
          address: walletAddress,
        },
        tasks: {
          registerABS: true,
        },
      });
      return;
    }

    console.log('[TASK RESULT JSON] 开始插入账号新数据');
    const configService = new ConfigService();
    const encryptionKey = configService.get<string>('ENCRYPTION_KEY');

    const absWalletPrivateKey = CryptoUtil.encrypt(
      `0x${walletKey}`,
      encryptionKey,
    );
    const evmWalletPrivateKey = CryptoUtil.encrypt(
      this.accountDetail.evmWallet.privateKey,
      encryptionKey,
    );

    await this.taskResult.createTaskResult({
      id: this.accountDetail.evmWallet.walletAddress,
      wallet: {
        privateKey: evmWalletPrivateKey,
        address: this.accountDetail.evmWallet.walletAddress,
      },
      xToken: this.accountDetail?.twitterAccount?.token || '',
      discordToken: this.accountDetail?.discordAccount?.token || '',
      absWallet: {
        privateKey: absWalletPrivateKey,
        address: walletAddress,
      },
      tasks: {
        registerABS: true, // 注册 abs
        exchangeToOkx: false, // 交易所总账号到任务钱包，转到 zk 链上面
        zKBridgeABS: false, // zk 链跨链到 abs 链
        evmTransferABS: false, // 转到 abs 项目内钱包
        absToAbsETHSwap: false, // abs 内部交易
        authX: false, // 授权 X
        authDiscord: false, // 授权 Discord
      },
    });
  }

  private async checkNeedToLogin() {
    const requiredAnySelectors = [
      'span:has-text("Login with Wallet")',
      'button:has-text("Skip")',
      'div[class*="styles_copyButton"]',
    ];

    // 访问个人页面
    await waitForPageLoad(this.absPage, {
      url: this.profileUrl,
      requiredAnySelectors,
    });

    if (await this.absPage.isVisible('span:has-text("Login with Wallet")')) {
      return true;
    }

    return false;
  }

  private async login(params: ScriptExecutionContext) {
    const launchOkxWallet = new LaunchOkxWallet();
    await launchOkxWallet.execute(params);

    await this.absPage.waitForTimeout(2000);

    // 切换到 absPage 标签
    await this.absPage.bringToFront();

    await this.absPage.waitForTimeout(2000);

    let retryCount = 0;
    const maxRetries = 3;
    while (retryCount < maxRetries) {
      try {
        if(retryCount >= 1) {
          await this.absPage.reload();
        }
        await this.absPage.locator('span:has-text("Login with Wallet")').click({
          timeout: this.timeout,
        });

        await this.absPage.locator('span:has-text("OKX Wallet")').click({
          timeout: this.timeout,
        });

        await launchOkxWallet.connectWallet();

        await this.absPage.waitForURL(this.profileUrl, {
          timeout: this.timeout,
        });
        break;
      } catch (error) {
        console.error(`连接钱包失败(第${retryCount + 1}次尝试)`, error);
        if (retryCount <= maxRetries - 1) {
          await this.absPage.reload();
        }
        retryCount++;
      }
    }

    if (retryCount === maxRetries) {
      throw new Error(`连接钱包失败,已重试${maxRetries}次`);
    }

    console.log('登录成功');
  }

  // 检查是否存在钱包地址在 JSONDB 中是否存在
  public async checkExistAbsWallet() {
    const taskResult = await this.taskResult.getTaskResult();
    // 如果没有则不执行
    if (!taskResult?.id) {
      return false;
    }

    return true;
  }

  // 检查是否授权X
  public async checkAuthX() {
    const taskResult = await this.taskResult.getTaskResult();
    return taskResult?.tasks?.authX;
  }

  public async checkSkipButton() {
    try {
      // 使用 waitForSelector，如果超时则捕获异常
      for (let i = 0; i < 2; i++) {
        console.log('正在检查页面上是否有 Skip 按钮...');
        const skipButton = await this.absPage
          .waitForSelector('button:has-text("Skip")', {
            state: 'visible',
            timeout: 2000,
          })
          .catch(() => null);

        // 如果找到了 Skip 按钮，就点击它
        if (skipButton) {
          console.log('找到 Skip 按钮，正在点击...');
          await skipButton.click();
          console.log('Skip 按钮已点击');
        } else {
          console.log('未找到 Skip 按钮，继续执行');
        }

        await this.absPage.waitForTimeout(3000);
      }
    } catch (error) {
      console.log('检查 Skip 按钮时出错，继续执行:', error.message);
    }
  }

  // 检查是否转账到ABS
  public async checkTransferABS() {
    const taskResult = await this.taskResult.getTaskResult();
    return taskResult?.tasks?.evmTransferABS;
  }

  public async checkAuthDiscord() {
    const taskResult = await this.taskResult.getTaskResult();
    return taskResult?.tasks?.authDiscord;
  }

  // 获取所有任务
  public async getAllTasks() {
    const taskResult = await this.taskResult.getTaskResult();
    return taskResult?.tasks;
  }
}
