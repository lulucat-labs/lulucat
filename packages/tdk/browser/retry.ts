/**
 * 重试方法
 * 用于执行可能失败的异步操作，并在失败时进行重试
 */
import { Page } from 'playwright';
import { isElementVisible } from './is-element-visible';

/**
 * 重试选项接口
 */
interface RetryOptions {
  // 最大重试次数
  maxRetries?: number;
  // 重试间隔（毫秒）
  retryInterval?: number;
  // 是否开启调试日志
  debug?: boolean;
  // 自定义错误处理函数，返回true表示该错误可以重试，false表示直接抛出
  shouldRetry?: (error: any) => boolean;
  // 重试前的回调函数
  onRetry?: (attempt: number, error: any) => void | Promise<void>;
  // 成功条件，返回true表示操作成功完成，无需继续重试
  successCondition?: (result: any) => boolean | Promise<boolean>;
  // 当操作执行成功但successCondition不满足时的自定义错误消息
  conditionFailMessage?: string;
  // 成功选择器，如果指定了这个参数，则会检查这些选择器是否在页面上可见
  successSelector?: string | string[];
  // 检查选择器的超时时间（毫秒）
  selectorTimeout?: number;
  // Playwright页面实例，当使用successSelector时可以直接提供，而不必从执行函数返回
  page?: Page;
}

/**
 * 重试执行异步函数
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 异步函数执行结果
 */
export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = {
    maxRetries: options.maxRetries ?? 3,
    retryInterval: options.retryInterval ?? 1000,
    debug: options.debug ?? false,
    shouldRetry: options.shouldRetry ?? (() => true),
    onRetry: options.onRetry,
    successCondition: options.successCondition,
    conditionFailMessage: options.conditionFailMessage ?? '操作执行成功但条件未满足',
    successSelector: options.successSelector,
    selectorTimeout: options.selectorTimeout ?? 2000,
    page: options.page,
  };

  const log = (message: string) => {
    if (config.debug) {
      console.log(`[Retry] ${message}`);
    }
  };

  let attempt = 0;
  let lastError: any;

  while (attempt <= config.maxRetries) {
    try {
      if (attempt > 0) {
        log(`尝试 ${attempt}/${config.maxRetries}`);
      }
      
      const result = await fn(attempt);
      
      // 如果没有设置成功条件和成功选择器，直接返回结果
      if (!config.successCondition && !config.successSelector) {
        return result;
      }
      
      // 如果设置了成功选择器，优先检查选择器
      if (config.successSelector) {
        // 优先使用配置中提供的page，如果没有则尝试从结果中获取
        const page = config.page || (result as unknown as Page);
        
        // 检查page对象是否有效
        if (!page || typeof page.locator !== 'function') {
          log('无法检查选择器，没有有效的Page对象');
          if (config.successCondition) {
            log('尝试使用successCondition检查');
          } else {
            return result; // 没有条件可以检查，只能返回结果
          }
        } else {
          try {
            if (Array.isArray(config.successSelector)) {
              log(`检查成功选择器数组: [${config.successSelector.join(', ')}]`);
              
              // 检查所有选择器是否都可见
              for (const selector of config.successSelector) {
                const visible = await isElementVisible({
                  page,
                  selector,
                  timeout: config.selectorTimeout,
                });
                
                if (!visible) {
                  throw new Error(`选择器 ${selector} 不可见`);
                }
                
                log(`选择器 ${selector} 可见`);
              }
            } else {
              log(`检查成功选择器: ${config.successSelector}`);
              
              const visible = await isElementVisible({
                page,
                selector: config.successSelector,
                timeout: config.selectorTimeout,
              });
              
              if (!visible) {
                throw new Error(`选择器 ${config.successSelector} 不可见`);
              }
              
              log(`选择器 ${config.successSelector} 可见`);
            }
            
            // 所有选择器都可见，返回结果
            log('所有成功选择器都可见，操作成功');
            return result;
          } catch (error) {
            log(`选择器检查失败: ${error.message}`);
            
            if (attempt >= config.maxRetries) {
              throw error;
            }
            
            // 继续尝试
            if (config.onRetry) {
              await Promise.resolve(config.onRetry(attempt + 1, error));
            }
            
            log(`等待 ${config.retryInterval}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, config.retryInterval));
            attempt++;
            continue;
          }
        }
      }
      
      // 如果设置了成功条件，检查成功条件
      if (config.successCondition) {
        const isSuccess = await Promise.resolve(config.successCondition(result));
        
        if (isSuccess) {
          log('成功条件已满足，返回结果');
          return result;
        }
        
        // 成功条件未满足，视为失败，继续重试
        const error = new Error(config.conditionFailMessage);
        log(`执行完成但条件未满足: ${config.conditionFailMessage}`);
        
        if (attempt >= config.maxRetries) {
          log(`已达到最大重试次数 ${config.maxRetries}，抛出错误`);
          throw error;
        }
        
        if (config.onRetry) {
          await Promise.resolve(config.onRetry(attempt + 1, error));
        }
        
        log(`等待 ${config.retryInterval}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, config.retryInterval));
      }
    } catch (error) {
      lastError = error;
      
      if (attempt >= config.maxRetries || !config.shouldRetry(error)) {
        log(`已达到最大重试次数 ${config.maxRetries} 或错误不可重试，抛出错误`);
        throw error;
      }
      
      log(`执行失败: ${error.message || error}`);
      
      if (config.onRetry) {
        await Promise.resolve(config.onRetry(attempt + 1, error));
      }

      log(`等待 ${config.retryInterval}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, config.retryInterval));
    }
    
    attempt++;
  }

  // 这段代码理论上不会执行到，但为了TypeScript类型安全
  throw lastError;
} 