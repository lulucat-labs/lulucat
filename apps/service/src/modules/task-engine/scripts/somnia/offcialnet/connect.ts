// https://quest.somnia.network/

import { ScriptExecutionContext } from '@lulucat/tdk/types';
import { LaunchOkxWallet } from '@lulucat/tdk/wallet';
import { waitForPageLoad, isElementVisible } from '@lulucat/tdk/browser';
import { Page } from 'playwright';
import { FallbackException, WalletException } from '@lulucat/exceptions';
import { TaskResult } from '../../task-result';
import SomniaBase from '../base';

export default class SomniaOfficialConnect extends SomniaBase {
  public readonly timeout = 30000;
  public readonly defaultRefLink =
    'https://quest.somnia.network/referrals/67911EA6';
  public readonly defaultHomeLink = 'https://quest.somnia.network/';
  // 用户信息地址
  public readonly accountUrl = 'https://quest.somnia.network/account';
  public somniaPage: Page;
  public walletAddressMatch: string;
  public walletAddress: string;

  constructor(params: ScriptExecutionContext) {
    super(params);
    this.somniaPage = params.context.pages()[0];
  }

  public async execute(params: ScriptExecutionContext): Promise<void> {
    console.log('开始执行Somnia官网连接钱包任务...');

    try {
      // 设置钱包地址和匹配格式
      const walletAddress = params.accountDetail.evmWallet.walletAddress;
      const walletAddressPrefix = walletAddress
        .slice(0, 4)
        ?.toLocaleLowerCase();
      const walletAddressSuffix = walletAddress.slice(-4)?.toLocaleLowerCase();
      this.walletAddressMatch = `${walletAddressPrefix}...${walletAddressSuffix}`;
      this.walletAddress = walletAddress;
      // 如果用户注册过，则跳转到个人中心
      let refLink = this.defaultHomeLink;
      const isExistData = await this.checkExistData();
      if (!isExistData) {
        // 未注册，查找邀请链接
        console.log('未注册，查找邀请链接');
        refLink = await this.getInvitationLink(params);
      }

      // 打开Somnia官网
      await this.openSomniaOfficial(params, refLink);

      // 是否已登录
      const button = this.somniaPage.locator(
        `button:has-text("${this.walletAddressMatch}")`,
      );
      const isLoggedIn = await button.isVisible({ timeout: this.timeout });
      let launchOkxWallet: LaunchOkxWallet;
      if (!isLoggedIn) {
        console.log('未登录，开始连接钱包');
        // 启动OKX钱包
        launchOkxWallet = new LaunchOkxWallet();
        await launchOkxWallet.execute(params);
        await this.connectOkxWallet(launchOkxWallet);
      }
      // 是否插入过数据
      if (!(await this.checkExistData())) {
        // 跳转到个人中心
        await waitForPageLoad(this.somniaPage, {
          url: this.accountUrl,
          requiredAnySelectors: [
            '.referral-link input.ant-input.ant-input-lg.ant-input-outlined',
          ],
        });

        // 获取邀请链接
        // 等待确保元素完全加载并且可交互
        await this.somniaPage.waitForSelector(
          '.referral-link input.ant-input.ant-input-lg.ant-input-outlined',
          { state: 'attached', timeout: this.timeout },
        );
        await this.somniaPage.waitForTimeout(2000); // 额外等待

        // 获取邀请链接并添加错误处理
        try {
          const referralLinkInput = this.somniaPage.locator(
            '.referral-link input.ant-input.ant-input-lg.ant-input-outlined',
          );
          await referralLinkInput.waitFor({ state: 'visible' });
          const referralLink = await referralLinkInput.getAttribute('value');
          console.log(`获取到邀请链接: ${referralLink}`);
          // 插入数据
          await this.insertData(referralLink);
          console.log('注册成功');
        } catch (e) {
          console.error('获取邀请链接失败:', e);
          // 处理错误情况
        }
      }
    } catch (error) {
      throw FallbackException.executionFailed(
        'Somnia官网连接钱包任务执行失败',
        {
          error,
        },
      );
    }
  }

  private async getInvitationLink(
    params: ScriptExecutionContext,
  ): Promise<string> {
    try {
      // 获取任务结果服务
      const taskResultInstance = TaskResult.create(
        params.projectId,
        params.accountGroupItemId,
      );
      const taskResultsService = taskResultInstance['taskResultsService'];

      // 构建JSON查询条件
      const jsonConditions = [
        { path: 'invitation.link', operator: 'is', value: true },
        { path: 'invitation.frequency', operator: '<', value: 10 },
      ];

      // 查询一条符合条件的有效邀请链接
      const validResult = await taskResultsService.findOneByJsonCondition(
        params.projectId,
        jsonConditions,
        params.accountGroupItemId,
      );

      if (validResult) {
        const resultData = validResult.result as any;
        const invitationLink = resultData.invitation.link;

        // 更新使用次数
        await taskResultsService.updateTaskResult(validResult.id, {
          result: {
            ...resultData,
            invitation: {
              ...resultData.invitation,
              frequency: resultData.invitation.frequency + 1,
            },
          },
        });

        console.log(
          `找到有效邀请链接: ${invitationLink}, 使用次数更新为: ${resultData.invitation.frequency + 1}`,
        );
        return invitationLink;
      } else {
        console.log('未找到有效邀请链接，使用默认链接');
        return this.defaultRefLink;
      }
    } catch (error) {
      console.error('查询有效邀请链接失败', error);
      return this.defaultRefLink;
    }
  }

  private async openSomniaOfficial(
    params: ScriptExecutionContext,
    link: string,
  ): Promise<void> {
    console.log(`导航到Somnia官网: ${link}`);

    // 等待页面加载完成
    await waitForPageLoad(this.somniaPage, {
      url: link,
      requiredAnySelectors: [
        'button:has-text("Connect")',
        `button:has-text("${this.walletAddressMatch}")`,
      ],
    });
  }

  private async connectOkxWallet(
    launchOkxWallet: LaunchOkxWallet,
  ): Promise<void> {
    // 切换回Somnia页面
    await this.somniaPage.bringToFront();
    await this.somniaPage.waitForTimeout(2000);

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      // 如果登录过程中发现已登录
      const button = this.somniaPage.locator(
        `button:has-text("${this.walletAddressMatch}")`,
      );
      const isLoggedIn = await button.isVisible({ timeout: this.timeout });
      if (isLoggedIn) {
        console.log('已登录，跳过连接钱包');
        break;
      }
      console.log(`连接钱包第${retryCount + 1}次`);

      try {
        // 点击Connect按钮
        await this.somniaPage.locator('button:has-text("Connect")').click({
          timeout: this.timeout,
        });

        try {
          console.log('选择OKX Wallet');
          // 选择OKX Wallet
          await this.somniaPage.locator('span:has-text("OKX Wallet")').click({
            timeout: 10000,
          });
        } catch (error) {
          console.error('未找到OKX Wallet选项', error);
          // await this.somniaPage.reload();
          // 存在弹窗则关闭
          try {
            if (
              await isElementVisible({
                page: this.somniaPage,
                selector: '[button:has-text("Close")]',
                timeout: 5000,
              })
            ) {
              await this.somniaPage
                .locator('[button:has-text("Close")]')
                .click();
              console.log('关闭弹窗');
            }
          } catch (error) {
            console.error('关闭弹窗失败', error);
          }
          const confirmButton = await launchOkxWallet.walletPage
            .locator('[data-testid="okd-button"]')
            .filter({ hasText: /Confirm|Approve/ }); // Confirm 或者 Approve

          const isConfirmButtonVisible = await confirmButton
            .isVisible({ timeout: this.timeout })
            .catch(() => false);

          if (isConfirmButtonVisible) {
            await confirmButton.click();
            console.log('点击了 Confirm 按钮');
          }
        }

        // 连接钱包
        await launchOkxWallet.connectWallet();

        // 等待连接成功
        await this.somniaPage.waitForTimeout(3000);

        await button.waitFor({ state: 'visible' });

        break;
      } catch (error) {
        console.error(`连接钱包失败(第${retryCount + 1}次尝试)`, error);
        if (retryCount < maxRetries - 1) {
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
