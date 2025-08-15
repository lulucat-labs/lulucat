// https://quest.somnia.network/

import { ScriptExecutionContext } from '@lulucat/tdk/types';
import { waitForPageLoad, isElementVisible } from '@lulucat/tdk/browser';
import { Page } from 'playwright';
import SomniaOfficialConnect from './connect';
import { FallbackException } from '@lulucat/exceptions';

export default class SomniaOfficialClockIn {
  public readonly timeout = 30000;
  public readonly defaultRefLink =
    'https://quest.somnia.network/referrals/67911EA6';
  // 用户信息地址
  public readonly accountUrl = 'https://quest.somnia.network/account';
  public somniaPage: Page;
  public walletAddressMatch: string;
  public walletAddress: string;

  constructor(params: ScriptExecutionContext) {
    this.somniaPage = params.context.pages()[0];
  }

  public async execute(params: ScriptExecutionContext): Promise<void> {
    console.log('开始执行Somnia官网签到任务...');
    const somniaConnect = new SomniaOfficialConnect(params);
    await somniaConnect.execute(params);
    await this.clockIn(params);
  }

  private async clockIn(params: ScriptExecutionContext): Promise<void> {
    console.log('开始执行Somnia官网签到任务...');
    await waitForPageLoad(this.somniaPage, {
      url: this.accountUrl,
      requiredAnySelectors: [
        'button:has-text("gSomnia")',
        'button:has-text("Next at 08:00")',
      ],
    });
    if (
      await isElementVisible({
        page: this.somniaPage,
        selector: 'button:has-text("Next at 08:00")',
        timeout: 2000,
      })
    ) {
      console.log('签到时间未到，跳过签到');
      throw FallbackException.executionFailed('签到时间未到，跳过签到');
    }
    await this.somniaPage.locator('button:has-text("gSomnia")').click({
      timeout: this.timeout,
    });
    await isElementVisible({
      page: this.somniaPage,
      selector: 'button:has-text("Next at 08:00")',
      timeout: this.timeout,
    });
    // 等待10秒
    await this.somniaPage.waitForTimeout(5000);
    console.log('签到成功');
  }
}
