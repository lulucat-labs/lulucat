import { BrowserContext, Page } from 'playwright';
import { ScriptExecutionContext } from '../types';
import { waitForPageLoad } from '../browser/wait-for-page-load';
import { WalletException } from '@lulucat/exceptions';

export class LaunchOkxWallet {
  private readonly extensionId = 'mcohilncbfahbmgdjkbpemcciiolgcge'; // OKX 钱包插件 ID
  private readonly password = '12345678'; // 设置的钱包密码
  private readonly timeout = 30000;
  public walletPage: Page;

  /**
   * 执行任务：导入私钥到 OKX 钱包插件
   * @param params 执行参数，包含浏览器上下文和任务配置
   * @returns 任务执行结果
   */
  public async execute(params: ScriptExecutionContext): Promise<void> {
    const { context, accountDetail } = params;
    const privateKey = accountDetail.evmWallet.privateKey;

    if (!privateKey) {
      throw new Error('缺少私钥配置');
    }

    this.walletPage = await context.newPage();

    await waitForPageLoad(this.walletPage, {
      url: `chrome-extension://${this.extensionId}/popup.html`,
    });

    await this.walletPage.waitForTimeout(3000);

    // 检查是否已有钱包
    // 如果已有钱包，页面通常会显示钱包主界面而不是导入/创建钱包的选项
    const hasWallet = await this.checkIfWalletExists(this.walletPage);
    console.log('🚀 ~ LaunchOkxWallet ~ execute ~ hasWallet:', hasWallet);

    if (hasWallet) {
      await this.unlockWallet();
      console.log('钱包解锁成功');
      return;
    }

    await this.createWallet(context, privateKey);
  }

  private async createWallet(context: BrowserContext, privateKey: string) {
    // 点击创建钱包按钮
    const importPage = await context.newPage();

    await waitForPageLoad(importPage, {
      url: `chrome-extension://${this.extensionId}/fullscreen.html#/batch-import-private-key/edit`,
      requiredSelectors: [importPage.locator('textarea')],
    });

    try {
      await importPage
        .locator('i[data-testid="okd-dialog-top-close-icon"]')
        .click({
          timeout: this.timeout,
        });
    } catch (error) {
      console.log('未找到关闭按钮，继续执行');
    }

    await importPage.click('div.okui-select-value-box');

    // 等待并检查弹出层是否显示
    try {
      await importPage.locator('div[data-testid="okd-popup-layer"]').waitFor({
        timeout: this.timeout,
      });
    } catch (error) {
      throw WalletException.importFailed('导入钱包失败，未找到弹出层');
    }

    // 点击 EVM networks 选项
    await importPage.click('text=EVM networks');

    await importPage.fill('textarea', privateKey);

    await importPage.click('button:has-text("Confirm")');

    // 等待 "Secure your wallet" 页面加载
    await importPage
      .locator('div[class*="_title_"]:has-text("Secure your wallet")')
      .waitFor({
        timeout: this.timeout,
      });

    // 点击 Password 选项，使用更精确的选择器
    await importPage
      .locator('div[class*="_item_"]:has-text("Password")')
      .click();

    // 使用 data-testid 属性点击 Next 按钮
    await importPage.locator('button[data-testid="okd-button"]').click();

    // 等待密码设置页面加载
    await importPage.locator('div:has-text("Set password")').first().waitFor({
      timeout: this.timeout,
    });

    // 选择所有匹配的密码输入框
    const passwordInputs = await importPage
      .locator('input[type="password"]')
      .all();

    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill(this.password); // 输入密码
      await passwordInputs[1].fill(this.password); // 确认密码
    } else {
      console.error('未找到两个密码输入框');
    }

    await importPage.locator('button[data-testid="okd-button"]').click();

    await importPage.getByText('Import successful').waitFor({
      timeout: this.timeout,
    });

    await importPage.locator('button[data-testid="okd-button"]').click();
  }

  private async unlockWallet() {
    // 输入密码
    await this.walletPage.fill('input[data-testid="okd-input"]', this.password);

    // 点击解锁按钮
    await this.walletPage.locator('button[data-testid="okd-button"]').click();

    // 等待钱包解锁成功
    await this.walletPage
      .locator('img[data-testid="okd-picture-img-default"]')
      .waitFor({
        timeout: this.timeout,
      })
      .catch(() => {
        console.log('钱包解锁可能失败');
      });
  }

  /**
   * 检查是否已存在钱包
   * @param page 浏览器页面
   * @returns 是否已存在钱包
   */
  private async checkIfWalletExists(page: Page): Promise<boolean> {
    try {
      // 检查是否需要输入密码解锁钱包
      // 如果需要输入密码，说明钱包已存在但被锁定
      const hasPasswordInput = await page
        .isVisible('input[data-testid="okd-input"]', {
          timeout: this.timeout,
        })
        .catch(() => false);

      // 检查是否有解锁按钮
      const hasUnlockButton = await page
        .isVisible('button[data-testid="okd-button"]', {
          timeout: this.timeout,
        })
        .catch(() => false);

      return hasPasswordInput && hasUnlockButton;
    } catch (error) {
      // 出错时默认认为没有钱包
      return false;
    }
  }

  public async connectWallet() {
    console.log('开始连接钱包');

    await this.walletPage.waitForTimeout(2000);

    // 检查是否存在 Connect 按钮
    const connectButton = await this.walletPage
      .locator('[data-testid="okd-button"]')
      .filter({ hasText: 'Connect' });

    const isConnectButtonVisible = await connectButton
      .isVisible({ timeout: this.timeout })
      .catch(() => false);
    if (isConnectButtonVisible) {
      await connectButton.click();
      console.log('点击了 Connect 按钮');
    }

    await this.walletPage.waitForTimeout(3000);

    // 检查并等待 Confirm 按钮
    const confirmButton = await this.walletPage
      .locator('[data-testid="okd-button"]')
      .filter({ hasText: /Confirm|Approve/ });

    const isConfirmButtonVisible = await confirmButton
      .isVisible({ timeout: this.timeout })
      .catch(() => false);

    if (isConfirmButtonVisible) {
      await confirmButton.click();
      console.log('点击了 Confirm 按钮');
    }

    if (!isConfirmButtonVisible && !isConnectButtonVisible) {
      throw WalletException.connectionFailed();
    }

    return true;
  }
}
