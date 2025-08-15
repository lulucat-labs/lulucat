import {
  ScriptExecutionContext,
  ScriptExecutionResult,
} from '@lulucat/tdk/types';
import AbsBase from './base';
import {
  XException,
  WalletException,
  FallbackException,
} from '@lulucat/exceptions';

export default class AbsToAbseth extends AbsBase {
  private readonly absSwapUrl =
    'https://portal.abs.xyz/trade?showHistory=true&buy=0xa8726bd058bea1973b61a9bc2a5e0e605b797307';

  constructor(params: ScriptExecutionContext) {
    super(params);
  }

  public async execute(
    params: ScriptExecutionContext,
  ): Promise<ScriptExecutionResult> {
    const { context, accountDetail } = params;
    const dbItem = await this.taskResult.getTaskResult();
    if (dbItem && dbItem.tasks.absToAbsETHSwap) {
      console.log('abs 钱包已兑换absETH，跳过执行');
      return;
    }
    if (!dbItem.absWallet?.address) {
      throw WalletException.walletNotFound(
        `账号组 #${accountDetail.id} 的 Abs 钱包不存在`,
        {
          accountId: accountDetail.id,
          evmWallet: accountDetail.evmWallet,
          absWallet: dbItem.absWallet,
        },
      );
    }
    if (!dbItem.tasks.authX) {
      throw XException.authenticationFailed('X未授权，跳过执行', {
        accountId: accountDetail.id,
        absWallet: dbItem.absWallet,
      });
    }
    if (!dbItem.tasks.evmTransferABS) {
      throw WalletException.transactionFailed('没有执行EVM转账ABS', {
        accountId: accountDetail.id,
        evmWallet: accountDetail.evmWallet,
        absWallet: dbItem.absWallet,
      });
    }
    
    this.absPage = await context.pages()[0];
    await this.absPage.goto(this.loginUrl, {
      timeout: this.timeout,
    });

    await this.loginOrRegister(params);

    await this.absPage.waitForURL(/abs\.xyz/, {
      timeout: this.timeout,
    });

    await this.absPage.goto(this.absSwapUrl, {
      timeout: this.timeout,
    });
    // <input class="h3 font-medium" placeholder="0.00" inputmode="decimal" aria-label="Token amount" aria-invalid="false" type="text" value="" style="--gradient-opacity: 0;">
    const tokenValueInput = await this.absPage
      .locator('input.h3.font-medium')
      .first();
    console.log('检查是否已存在内部交易徽章...');
    const hasSwapBadge = await this.badgeChecker?.checkBadges(['absToAbsETHSwap']);
    if (hasSwapBadge) return;
    await this.checkSkipButton();
    if (tokenValueInput) {
      // 金额改为 0.000035 ～ 0.000045 之间的随机数，保留7位小数
      const randomAmount = (Math.random() * 0.00001 + 0.000035).toFixed(7);
      await tokenValueInput.fill(randomAmount);
    }

    // 等待交易界面加载并处理
    await this.absPage.waitForTimeout(5000);

    // 使用更精确的选择器定位"Review"按钮并确保它是可点击的
    const reviewButton = this.absPage
      .locator('button')
      .filter({ hasText: /^Review$/ })
      .first();
    console.log('准备点击Review按钮');

    // 点击可用的Review按钮
    await reviewButton.click({
      timeout: this.timeout,
    });

    const swapButton = this.absPage
      .locator('button')
      .filter({ hasText: /^Swap$/ })
      .first();

    console.log('准备点击Swap按钮');
    await swapButton.click({
      timeout: this.timeout,
    });

    // 等待 Trade Complete 的h5出现，等待 timeout: this.timeout 秒
    const tradeCompleteButton = this.absPage.locator(
      'h5:has-text("Trade Complete")',
    );

    console.log('准备等待Trade Complete的h5出现');
    await tradeCompleteButton.waitFor({
      state: 'visible',
      timeout: this.timeout,
    });
    console.log('Trade Complete 已出现');
    await this.taskResult.updateTaskResult({
      tasks: {
        absToAbsETHSwap: true,
      },
    });
    console.log('更新数据库完成');
    
    // 交易完成后，确认是否成功获取了徽章
    console.log('交易完成，检查是否成功获取内部交易徽章...');
    const hasSwapBadgeResult = await this.badgeChecker?.checkBadges(['absToAbsETHSwap']);
    if (!hasSwapBadgeResult) {
      throw new FallbackException('未检测到内部交易徽章，交易可能未成功', {
        accountId: accountDetail.id,
      });
    }
    console.log('成功获取内部交易徽章，任务完成');
    
    // 等待 3 秒
    await this.absPage.waitForTimeout(3000);
    return;
  }
}
