import { Locator, Page } from 'playwright';
import { FallbackException } from '@lulucat/exceptions';

/**
 * 配置选项接口
 */
interface WaitForPageLoadOptions {
  // 要导航到的URL（如果不提供则使用当前页面）
  url?: string;
  // 总体等待超时时间（毫秒）
  timeout?: number;
  // 重试次数
  retries?: number;
  // 重试间隔_毫秒
  retryInterval?: number;
  // 必须存在的元素选择器数组（网页加载成功的指标）
  requiredSelectors?: string[] | Locator[];
  // 必须存在的任意一个元素选择器数组（网页加载成功的指标）
  requiredAnySelectors?: string[] | Locator[];
  // 自定义检查函数，返回 boolean 或 Promise<boolean>
  customCheck?: (page: Page) => boolean | Promise<boolean>;
  // 检查网络请求是否都已完成
  waitForNetworkIdle?: boolean;
  // 是否等待所有图片加载完成
  waitForImages?: boolean;
  // 是否检查页面是否有错误（如 404, 500 等）
  checkForErrors?: boolean;
  // 调试模式
  debug?: boolean;
}

/**
 * 等待页面完全加载的函数
 * @param page Playwright 页面实例
 * @param options 配置选项
 * @returns Promise<boolean> 页面是否成功加载
 */
export async function waitForPageLoad(
  page: Page,
  options: WaitForPageLoadOptions = {},
): Promise<boolean> {
  // 默认配置
  const config = {
    url: options.url,
    timeout: options.timeout || 30000,
    retries: options.retries || 3,
    retryInterval: options.retryInterval || 2000,
    requiredSelectors: options.requiredSelectors || [],
    requiredAnySelectors: options.requiredAnySelectors || [],
    customCheck: options.customCheck,
    waitForNetworkIdle: options.waitForNetworkIdle || false,
    waitForImages: options.waitForImages || false,
    checkForErrors: options.checkForErrors || false,
    debug: options.debug ?? true,
  };

  const log = (message: string) => {
    if (config.debug) {
      console.log(`[PageLoadChecker] ${message}`);
    }
  };

  let attempts = 0;

  while (attempts < config.retries) {
    try {
      log(`尝试 ${attempts + 1}/${config.retries}`);

      // 如果提供了URL，先导航到该URL
      if (config.url) {
        log(`导航到URL: ${config.url}`);
        await page.goto(config.url, {
          waitUntil: 'load',
          timeout: config.timeout,
        });
        log('URL导航完成');
      } else {
        // 如果没有提供URL，确保当前页面已加载DOM
        log('等待当前页面DOM加载...');
        await page.waitForLoadState('load', {
          timeout: config.timeout,
        });
      }

      // 如果需要，等待网络空闲
      if (config.waitForNetworkIdle) {
        log('等待网络空闲...');
        await page.waitForLoadState('networkidle', { timeout: config.timeout });
      }

      // 检查页面是否有加载错误
      if (config.checkForErrors) {
        log('检查页面错误...');
        const url = page.url();
        const title = await page.title();

        // 检查常见错误页面
        if (
          url.includes('/404') ||
          url.includes('/error') ||
          title.includes('404') ||
          title.includes('找不到') ||
          title.includes('Not Found') ||
          title.includes('Error')
        ) {
          log('检测到错误页面');
          throw new Error('页面加载到错误页面');
        }

        // 检查是否有常见错误元素
        const errorSelectors = [
          '.error-page',
          '.error-message',
          '.error-container',
          '#error',
          '[data-error]',
        ];

        for (const selector of errorSelectors) {
          const hasError = (await page.locator(selector).count()) > 0;
          if (hasError) {
            log(`检测到错误元素: ${selector}`);
            throw new Error(`页面包含错误元素: ${selector}`);
          }
        }
      }

      // 检查必要的元素是否存在
      if (config.requiredSelectors.length > 0) {
        log(`检查必要元素: ${config.requiredSelectors.join(', ')}`);
        for (const selector of config.requiredSelectors) {
          if (typeof selector === 'string') {
            await page.waitForSelector(selector, { timeout: config.timeout });
          } else {
            await selector.waitFor({ timeout: config.timeout });
          }
          log(`找到必要元素: ${selector}`);
        }
      }

      // 检查必须存在的任意一个元素选择器数组
      if (config.requiredAnySelectors.length > 0) {
        log(`检查任意元素: ${config.requiredAnySelectors.join(', ')}`);

        const result = await Promise.race([
          ...config.requiredAnySelectors.map((selector) => {
            if (typeof selector === 'string') {
              return page.waitForSelector(selector, {
                timeout: config.timeout,
              });
            } else {
              return selector.waitFor({ timeout: config.timeout });
            }
          }),
        ]);

        if (!result) {
          throw new Error('页面加载失败，任意元素未找到');
        }
      }

      // 等待图片加载（如果需要）
      if (config.waitForImages) {
        log('等待图片加载...');
        await page.evaluate(() => {
          return new Promise<void>((resolve) => {
            const images = document.querySelectorAll('img');

            // 如果没有图片，立即解析
            if (images.length === 0) {
              resolve();
              return;
            }

            let loadedImages = 0;
            const totalImages = images.length;

            // 检查所有图片的加载状态
            images.forEach((img) => {
              if (img.complete) {
                loadedImages++;
              } else {
                img.addEventListener('load', () => {
                  loadedImages++;
                  if (loadedImages === totalImages) {
                    resolve();
                  }
                });
                img.addEventListener('error', () => {
                  loadedImages++;
                  if (loadedImages === totalImages) {
                    resolve();
                  }
                });
              }
            });

            // 如果所有图片都已加载，立即解析
            if (loadedImages === totalImages) {
              resolve();
            }
          });
        });
      }

      // 运行自定义检查函数（如果有）
      if (config.customCheck) {
        log('运行自定义检查函数...');
        const customCheckResult = await config.customCheck(page);
        if (!customCheckResult) {
          throw new Error('自定义检查失败');
        }
      }

      // 最后再次检查页面是否还在加载中
      const isLoading = await page.evaluate(() => {
        return document.readyState !== 'complete';
      });

      if (isLoading) {
        throw new Error('页面仍在加载中');
      }

      // 所有检查都通过
      log('页面加载成功！');
      return true;
    } catch (error) {
      attempts++;
      log(`加载失败: ${error.message}`);

      // 如果已达到最大重试次数，则抛出异常
      if (attempts >= config.retries) {
        // throw new Error(
        //   `页面加载失败，已尝试 ${config.retries} 次: ${error.message}`,
        // );
        throw FallbackException.pageLoadFailed(
          `页面加载失败，已尝试 ${config.retries} 次`,
        );
      }

      // 等待后重试
      log(`等待 ${config.retryInterval}ms 后重试...`);
      await new Promise((resolve) => setTimeout(resolve, config.retryInterval));
    }
  }

  return false;
}
