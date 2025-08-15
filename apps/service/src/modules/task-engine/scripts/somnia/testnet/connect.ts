// https://testnet.somnia.network/

import { Page } from 'playwright';
import { ScriptExecutionContext } from '@lulucat/tdk/types';
import { waitForPageLoad } from '@lulucat/tdk/browser';
import { LaunchOkxWallet } from '@lulucat/tdk/wallet';
import { WalletException } from '@lulucat/exceptions';

export default class SomniaConnect {
  public readonly timeout = 30000;
  public readonly testnetUrl = 'https://testnet.somnia.network/';
  public somniaPage: Page;
  public walletAddressMatch: string;
  public walletAddress: string;

  constructor(params: ScriptExecutionContext) {
    this.somniaPage = params.context.pages()[0];
  }

  public async execute(params: ScriptExecutionContext): Promise<void> {
    console.log('开始执行Somnia连接钱包任务...');
    // 导航到Somnia测试网站
    const walletAddress = params.accountDetail.evmWallet.walletAddress;
    // 钱包匹配 获取前6位和后4位
    const walletAddressPrefix = walletAddress.slice(0, 6)?.toLocaleLowerCase();
    const walletAddressSuffix = walletAddress.slice(-4)?.toLocaleLowerCase();
    this.walletAddressMatch = `${walletAddressPrefix}...${walletAddressSuffix}`;
    this.walletAddress = walletAddress;
    await this.openSomniaTestnet(params);

    // 是否已登录
    const button = this.somniaPage.locator(
      `button:has-text("${this.walletAddressMatch}")`,
    );
    const isLoggedIn = await button.isVisible();
    if (!isLoggedIn) {
      await this.connectOkxWallet(params);
    }
    console.log('Somnia连接钱包任务执行完成');
  }

  private async openSomniaTestnet(
    params: ScriptExecutionContext,
  ): Promise<void> {
    // 等待页面加载完成
    await waitForPageLoad(this.somniaPage, {
      url: this.testnetUrl,
      requiredAnySelectors: [
        'button:has-text("Connect")',
        `button:has-text("${this.walletAddressMatch}")`,
      ],
    });
  }

  private async connectOkxWallet(
    params: ScriptExecutionContext,
  ): Promise<void> {
    console.log('开始连接OKX钱包...');

    // 启动OKX钱包
    const launchOkxWallet = new LaunchOkxWallet();
    await launchOkxWallet.execute(params);

    // 切换回Somnia页面
    await this.somniaPage.bringToFront();
    await this.somniaPage.waitForTimeout(2000);

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // 点击Connect按钮
        await this.somniaPage.locator('button:has-text("Connect")').click({
          timeout: this.timeout,
        });

        // 选择OKX Wallet
        await this.somniaPage.locator('span:has-text("OKX Wallet")').click({
          timeout: this.timeout,
        });

        // 连接钱包
        await launchOkxWallet.connectWallet();

        // 等待连接成功
        await this.somniaPage.waitForTimeout(3000);

        console.log('成功连接OKX钱包到Somnia测试网');
        break;
      } catch (error) {
        console.error(`连接钱包失败(第${retryCount + 1}次尝试)`, error);
        if (retryCount < maxRetries - 1) {
          await this.somniaPage.reload();
          await this.somniaPage.waitForTimeout(2000);
        }
        retryCount++;
      }
    }

    if (retryCount === maxRetries) {
      throw WalletException.connectionFailed(
        `连接钱包失败,已重试${maxRetries}次`,
        {
          walletAddress: this.walletAddress,
        },
      );
    }
  }
}
