import { Page } from 'playwright';

export async function isElementVisible({
  page,
  selector,
  timeout = 10000,
}: {
  page: Page;
  selector: string;
  timeout?: number;
}) {
  const locator = page.locator(selector);
  try {
    await locator.waitFor({ state: 'visible', timeout });
    return true; // 元素可见
  } catch (error) {
    if (error.name === 'TimeoutError') {
      return false; // 超时未找到或未显示
    }
    throw error; // 抛出其他异常
  }
}
