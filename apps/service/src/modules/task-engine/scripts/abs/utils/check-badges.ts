import { Page } from 'playwright';
import axios from 'axios';
import { TaskResult } from '../../task-result';
import { AbsTaskResult } from '../types';

const badgesMap = [
  {
    id: 1,
    key: 'authDiscord',
    label: 'Discord 徽章',
  },
  {
    id: 2,
    key: 'authX',
    label: 'X 徽章',
  },
  {
    id: 3,
    key: 'evmTransferABS',
    label: '转账到ABS徽章',
  },
  {
    id: 4,
    key: 'discoverVote',
    label: '点赞徽章',
  },
  {
    id: 5,
    key: 'absToAbsETHSwap',
    label: '内部交易徽章',
  },
];

const API_URL = 'https://backend.portal.abs.xyz/api/user';

/**
 * 徽章检查器类，用于检查用户徽章并更新taskResult
 */
export class BadgeChecker {
  public page: Page;
  private taskResult: TaskResult<AbsTaskResult>;
  private apiHeaders: Record<string, string> = {};
  private isCollectingHeaders = false;
  private headersCollected = false;
  private requestListener: any;

  /**
   * @param page Playwright页面对象
   * @param taskResult TaskResult对象，用于更新任务状态
   * @param startCollecting 是否在创建实例时就开始收集请求头，默认为true
   */
  constructor(
    page: Page,
    taskResult: TaskResult<AbsTaskResult>,
    startCollecting = true,
  ) {
    this.page = page;
    this.taskResult = taskResult;

    if (startCollecting) {
      this.startCollectingHeaders();
    }
  }

  /**
   * 检查页面是否已关闭
   * @returns 页面是否已关闭
   */
  public isPageClosed(): boolean {
    try {
      // 尝试访问页面的一个属性，如果页面已关闭会抛出异常
      return this.page.isClosed();
    } catch (error) {
      return true; // 如果出现异常，则认为页面已关闭
    }
  }

  /**
   * 开始收集API请求头信息
   */
  public startCollectingHeaders(): void {
    if (this.isCollectingHeaders) {
      return;
    }

    this.isCollectingHeaders = true;
    console.log('开始监听并收集API请求头...');

    // 监听页面请求来获取请求头
    this.requestListener = (request) => {
      // 只关注针对ABS API的请求
      if (request.url() === API_URL) {
        console.log('捕获到API请求:', request.url());
        // 获取并保存请求头
        this.apiHeaders = request.headers();
        this.headersCollected = true;
      }
    };

    // 添加请求监听器
    this.page.on('request', this.requestListener);
  }

  /**
   * 停止收集API请求头信息
   */
  public stopCollectingHeaders(): void {
    if (!this.isCollectingHeaders || !this.requestListener) {
      return;
    }

    this.page.removeListener('request', this.requestListener);
    this.isCollectingHeaders = false;
    console.log('已停止收集API请求头');
  }

  /**
   * 确保已收集到API请求头
   */
  private async ensureHeaders(): Promise<boolean> {
    // 如果已经收集到请求头，直接返回成功
    if (this.headersCollected && Object.keys(this.apiHeaders).length > 0) {
      return true;
    }

    // 如果页面已关闭，返回失败
    if (this.isPageClosed()) {
      console.error('页面已关闭，无法收集API请求头');
      return false;
    }

    // 检查当前URL是否为登录页面
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login')) {
      console.error('当前处于登录页面，无法收集API请求头');
      return false;
    }

    // 如果尚未开始收集，则开始收集
    if (!this.isCollectingHeaders) {
      this.startCollectingHeaders();
    }

    // 设置一个Promise来等待获取到完全匹配API_URL的请求头
    const headersPromise = new Promise<boolean>((resolve) => {
      // 临时监听器，只用于确保获取到请求头
      const tempListener = (request) => {
        // 必须完全匹配API_URL而不只是包含
        if (request.url() === API_URL) {
          console.log('临时监听器捕获到完全匹配的API请求:', request.url());
          this.apiHeaders = request.headers();
          this.headersCollected = true;
          this.page.removeListener('request', tempListener);
          resolve(true);
        }
      };

      // 添加临时请求监听器
      this.page.on('request', tempListener);

      // 设置超时，如果超时内没有捕获到完全匹配的请求，则移除监听器并返回当前状态
      setTimeout(() => {
        this.page.removeListener('request', tempListener);
        console.log(
          '等待完全匹配API_URL的请求超时，返回当前状态:',
          this.headersCollected,
        );
        resolve(this.headersCollected);
      }, 10000); // 增加超时时间以有更多机会捕获请求
    });

    // 直接等待请求头收集，不需要额外的页面加载等待
    return await headersPromise;
  }

  /**
   * 检查用户徽章并更新taskResult
   * @param keys 可选，指定要检测的徽章keys数组
   * @returns Promise<boolean> 是否存在匹配的徽章
   */
  public async checkBadges(
    keys?: string[],
  ): Promise<Array<{ badge: object; claimed: boolean }> | boolean> {
    try {
      // 首先检查页面是否关闭
      if (this.isPageClosed()) {
        console.error('页面已关闭，无法检查徽章');
        return false;
      }

      // 检查当前URL是否为登录页面
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        console.error('当前处于登录页面，无法检查徽章');
        return false;
      }

      // 确保已获取请求头
      const hasHeaders = await this.ensureHeaders();
      if (!hasHeaders) {
        console.error('无法获取API请求头信息');
        return false;
      }

      console.log('使用获取到的请求头发起API请求...', this.apiHeaders);

      // 请求用户徽章信息
      const response = await axios.post(
        API_URL,
        {},
        {
          headers: this.apiHeaders,
        },
      );

      // 如果请求失败，则抛出错误
      if (!response.data || !response.data.user || !response.data.user.badges) {
        console.error('获取用户徽章信息失败');
        return false;
      }

      // 获取用户徽章列表
      const userBadges = response.data.user.badges;

      console.log('用户徽章', userBadges);

      // 将需要检测的keys转为Set便于快速查找
      const keysToCheck = keys ? new Set(keys) : null;

      // 初始化任务更新对象
      const tasksUpdate: Record<string, boolean> = {};
      let hasMatchedBadge = false;

      // 遍历badgesMap与userBadges进行匹配
      for (const mapItem of badgesMap) {
        // 如果指定了keys且当前key不在检测范围内，则跳过
        if (keysToCheck && !keysToCheck.has(mapItem.key)) {
          continue;
        }

        // 检查用户徽章中是否存在匹配的id
        const matchedBadge = userBadges.find(
          (badge: any) => badge.badge && badge.badge?.id === mapItem.id,
        );

        // 更新任务状态
        tasksUpdate[mapItem.key] = !!matchedBadge;

        // 如果找到一个匹配的徽章，则标记为有匹配
        if (matchedBadge) {
          hasMatchedBadge = true;
        }
      }

      // 更新taskResult
      if (Object.keys(tasksUpdate).length > 0) {
        await this.taskResult.updateTaskResult({
          tasks: tasksUpdate,
        });
      }

      return response.data.user?.badges;
    } catch (error) {
      console.error('获取徽章信息时发生错误:', error);
      return false;
    }
  }

  /**
   * 获取已收集的API请求头
   * @returns API请求头对象
   */
  public getHeaders(): Record<string, string> {
    return { ...this.apiHeaders };
  }

  /**
   * 获取徽章映射表
   * @returns 徽章映射表的副本
   */
  public getBadgesMap(): typeof badgesMap {
    return [...badgesMap];
  }
}

/**
 * 使用示例:
 *
 * ```typescript
 * import { BadgeChecker } from './utils/check-badges';
 * import { ScriptExecutionContext, ScriptExecutionResult } from '@lulucat/tdk/types';
 * import AbsBase from './base';
 *
 * export default class CheckBadges extends AbsBase {
 *   constructor(params: ScriptExecutionContext) {
 *     super(params);
 *   }
 *
 *   public async execute(params: ScriptExecutionContext): Promise<ScriptExecutionResult> {
 *     const { context } = params;
 *     this.absPage = await context.pages()[0];
 *
 *     await this.loginOrRegister(params);
 *
 *     // 创建徽章检查器实例，开始收集请求头
 *     const badgeChecker = new BadgeChecker(this.absPage, this.taskResult);
 *
 *     // 执行一些其他操作...
 *
 *     // 在需要的时候检查徽章
 *     const hasBadges = await badgeChecker.checkBadges();
 *     console.log('用户是否有徽章:', hasBadges);
 *
 *     // 或者只检查特定类型的徽章
 *     const hasSpecificBadges = await badgeChecker.checkBadges(['authX', 'authDiscord']);
 *     console.log('用户是否有特定徽章:', hasSpecificBadges);
 *
 *     // 获取当前收集的请求头
 *     const headers = badgeChecker.getHeaders();
 *     console.log('API请求头:', headers);
 *
 *     return {
 *       success: true,
 *       error: hasBadges ? '用户有徽章' : '用户没有徽章'
 *     };
 *   }
 * }
 * ```
 */
