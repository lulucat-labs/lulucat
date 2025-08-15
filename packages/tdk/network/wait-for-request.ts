import { Page } from 'playwright';

/**
 * 监听网络请求配置选项
 */
export interface WaitForNetworkOptions {
  // 请求方法 (默认监听所有方法)
  method?: string;
  // 超时时间（毫秒，默认30000ms）
  timeout?: number;
  // 需要匹配的状态码（默认为200-299之间的成功状态码）
  statusCode?: number | number[];
  // 是否打印调试日志
  debug?: boolean;
}

/**
 * 监听网络请求并等待响应
 * 简单的API监听工具，监听指定API的网络请求并返回响应数据
 * 
 * @param page Playwright页面实例
 * @param urlPattern 需要监听的URL路径或模式(字符串或正则表达式)
 * @param options 可选配置 {method, timeout, statusCode, debug}
 * @returns Promise<any> 响应数据(JSON对象或字符串)，失败时抛出错误
 */
export async function waitForNetwork(
  page: Page, 
  urlPattern: string | RegExp,
  options: WaitForNetworkOptions = {}
): Promise<any> {
  // 默认配置
  const config = {
    method: options.method?.toUpperCase(),
    timeout: options.timeout || 30000,
    statusCodes: Array.isArray(options.statusCode) 
      ? options.statusCode 
      : options.statusCode 
        ? [options.statusCode] 
        : [200, 201, 202, 203, 204, 205, 206, 207, 208, 226],
    debug: options.debug ?? false
  };

  const log = (message: string) => {
    if (config.debug) {
      console.log(`[Network] ${message}`);
    }
  };

  log(`等待${config.method ? config.method + ' ' : ''}请求: ${urlPattern}`);
  log(`超时: ${config.timeout}ms, 接受状态码: ${config.statusCodes.join(', ')}`);
  
  try {
    // 等待匹配的响应
    const response = await page.waitForResponse(
      response => {
        const url = response.url();
        const method = response.request().method();
        const status = response.status();
        
        // URL匹配检查
        const urlMatched = typeof urlPattern === 'string'
          ? url.includes(urlPattern)
          : urlPattern.test(url);
          
        // 方法匹配检查
        const methodMatched = !config.method || method === config.method;
        
        // 状态码匹配检查
        const statusMatched = config.statusCodes.includes(status);
        
        // 调试信息
        if (urlMatched && config.debug) {
          log(`检查请求: ${method} ${url} (${status}) - 匹配: ${urlMatched && methodMatched && statusMatched}`);
        }
        
        return urlMatched && methodMatched && statusMatched;
      },
      { timeout: config.timeout }
    );
    
    // 获取响应数据
    try {
      // 尝试解析为JSON
      const data = await response.json();
      log(`成功获取JSON响应: ${JSON.stringify(data).substring(0, 100)}${JSON.stringify(data).length > 100 ? '...' : ''}`);
      return data;
    } catch (e) {
      // 如果不是JSON，获取文本
      const text = await response.text();
      log(`获取到文本响应: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      return text;
    }
  } catch (error) {
    // 超时或其他错误
    const errorMessage = `监听请求失败: ${error.message}`;
    log(errorMessage);
    throw new Error(errorMessage);
  }
} 