import { mkdirSync } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * 获取浏览器插件目录路径
 * TODO: 需要根据项目配置来获取哪个浏览器插件
 */
// 默认值 okx-wallet
export function getExtensionsPath(
  extensionName: string | string[] = 'okx-wallet',
): string {
  if (Array.isArray(extensionName)) {
    const extensionPaths = extensionName.map((name) => {
      const extensionsPath = join(
        process.cwd(),
        'chromium',
        'extensions',
        name,
      );
      const isExists = existsSync(extensionsPath);
      if (!isExists) {
        throw new Error(`浏览器插件目录不存在`);
      }
      return extensionsPath;
    });
    // 将多个插件路径合并为一个逗号分隔的字符串
    return extensionPaths.join(',');
  }

  const extensionsPath = join(
    process.cwd(),
    'chromium',
    'extensions',
    extensionName,
  );
  if (!existsSync(extensionsPath)) {
    throw new Error(`浏览器插件目录不存在`);
  }
  return extensionsPath;
}

/**
 * 获取浏览器用户数据目录路径
 */
export function getUserDataDir(
  projectId: number,
  accountGroupItemId: number,
): string {
  const userDataDir = join(
    process.cwd(),
    'chromium',
    'user-data-dir',
    `${projectId}-${accountGroupItemId}`,
  );
  if (!existsSync(userDataDir)) {
    mkdirSync(userDataDir, { recursive: true });
  }
  return userDataDir;
}
