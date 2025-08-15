import { Inject, Injectable, Logger } from '@nestjs/common';
import { BrowserContext, BrowserContextOptions, chromium } from 'patchright';
import { ProxyIp } from '../../proxy-ips/entities/proxy-ip.entity';
// import { BrowserFingerprint } from '../../browser-fingerprints/entities/browser-fingerprint.entity';
import { getExtensionsPath, getUserDataDir } from './utils';
import { AccountTaskContext } from '../types';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  BROWSER_CONTEXT,
  CHROME_DEFAULT_ARGS,
  CHROME_DOCKER_ARGS,
  CHROME_HEADLESS_ARGS,
  CHROME_DISABLE_SECURITY_ARGS,
  CHROME_DETERMINISTIC_RENDERING_ARGS,
  getDefaultLocale,
} from './config';

@Injectable()
export class BrowserContextService {
  @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger;
  /**
   * 创建浏览器上下文配置
   */
  private async createBrowserContextConfig(
    proxyIp?: ProxyIp,
    // browserFingerprint?: BrowserFingerprint,
  ): Promise<BrowserContextOptions> {
    try {
      const config: BrowserContextOptions = {
        // patchright 配置要求，具体查看 https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs?tab=readme-ov-file#best-practice----use-chrome-without-fingerprint-injection
        viewport: { width: 1280, height: 920 }, // patchright 要求值为 null，但是会导致窗口太小 okx 钱包插件导入失败
        locale: 'en-US',
        extraHTTPHeaders: {
          'Accept-Language': 'en-US',
        },
      };

      // 如果存在代理IP信息，配置代理相关设置
      if (proxyIp) {
        // 配置代理服务器信息，包括服务器地址、用户名和密码
        config.proxy = {
          server: `${proxyIp.ipAddress}:${proxyIp.port}`,
          username: proxyIp.username,
          password: proxyIp.password,
        };

        // 如果代理IP有时区信息，设置浏览器时区
        if (proxyIp.timezone) {
          config.timezoneId = proxyIp.timezone;
        }

        // 如果代理IP有地理位置信息，设置浏览器地理位置和权限
        if (proxyIp.latitude && proxyIp.longitude) {
          config.geolocation = {
            latitude: Number(proxyIp.latitude),
            longitude: Number(proxyIp.longitude),
          };
          config.permissions = ['geolocation'];
        }

        // 如果代理IP有国家信息，设置浏览器语言和Accept-Language头
        if (proxyIp.country) {
          const locale = getDefaultLocale(proxyIp.country);
          config.locale = locale;
          config.extraHTTPHeaders = {
            ...config.extraHTTPHeaders,
            'Accept-Language': `${locale},${locale.split('-')[0]};q=0.9`,
          };
        }
      }

      // 如果有浏览器指纹信息，添加到配置中
      // 不使用自定义的浏览器指纹，Patchright 处理所有默认参数，不轻易覆盖它们，具体查看 https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs?tab=readme-ov-file#best-practice----use-chrome-without-fingerprint-injection
      // if (browserFingerprint) {
      //   config.userAgent = browserFingerprint.userAgent;
      // }

      return config;
    } catch (error) {
      this.logger.error(`创建浏览器上下文配置失败`, error);
      throw error;
    }
  }

  /**
   * 获取浏览器启动参数
   * @param options 参数选项
   * @returns 处理后的启动参数数组
   */
  getBrowserArgs(options: {
    ignoreDefaultArgs?: boolean | string[];
    args?: string[];
    headless?: boolean;
    disableSecurity?: boolean;
    deterministicRendering?: boolean;
    inDocker?: boolean;
    extensionsPath?: string;
  }): string[] {
    const {
      ignoreDefaultArgs = false,
      args = [],
      headless = false,
      extensionsPath,
      disableSecurity = BROWSER_CONTEXT.DISABLE_SECURITY || false,
      deterministicRendering = BROWSER_CONTEXT.DETERMINISTIC_RENDERING || false,
      inDocker = false,
    } = options;

    let defaultArgs: string[] = [];
    if (Array.isArray(ignoreDefaultArgs)) {
      defaultArgs = CHROME_DEFAULT_ARGS.filter(
        (arg) => !ignoreDefaultArgs.includes(arg),
      );
    } else if (ignoreDefaultArgs === true) {
      defaultArgs = [];
    } else {
      defaultArgs = [...CHROME_DEFAULT_ARGS];
    }

    // 收集所有参数
    const preConversionArgs: string[] = [
      ...args,
      ...defaultArgs,
      ...(headless ? CHROME_HEADLESS_ARGS : []),
      ...(inDocker ? CHROME_DOCKER_ARGS : []),
      ...(disableSecurity ? CHROME_DISABLE_SECURITY_ARGS : []),
      ...(deterministicRendering ? CHROME_DETERMINISTIC_RENDERING_ARGS : []),
    ];

    // 如果提供了扩展路径，添加相关参数
    if (extensionsPath) {
      preConversionArgs.push(
        `--disable-extensions-except=${extensionsPath}`,
        `--load-extension=${extensionsPath}`,
      );
    }

    // 移除重复参数，保留最后出现的
    const argsMap = new Map<string, string>();
    preConversionArgs.forEach((arg) => {
      const [key] = arg.split('=');
      argsMap.set(key, arg);
    });

    return Array.from(argsMap.values());
  }

  async createBrowserContext(
    taskContext: AccountTaskContext,
  ): Promise<BrowserContext> {
    try {
      const { projectId, taskId, accountGroupItemId } = taskContext;
      this.logger.debug(
        `开始创建浏览器上下文 - ProjectId: ${projectId}, taskId: ${taskId}, accountGroupItemId: ${accountGroupItemId}`,
      );

      // 从taskContext中获取浏览器配置信息
      const proxyIp = taskContext.accountDetail?.proxyIp;
      // const browserFingerprint = taskContext.accountDetail?.browserFingerprint;
      const headless = taskContext.config.headless as boolean;

      const config = await this.createBrowserContextConfig(
        proxyIp,
        // browserFingerprint,
      );

      const userDataDir = getUserDataDir(projectId, accountGroupItemId);
      const extensionsPath = getExtensionsPath([
        'okx-wallet',
        'discord-token-login',
      ]);

      this.logger.debug(`获取浏览器用户数据目录完成: ${userDataDir}`);
      this.logger.debug(`获取浏览器插件路径完成: ${extensionsPath}`);

      this.logger.debug(`开始启动浏览器`);

      // 获取浏览器启动参数
      const browserArgs = this.getBrowserArgs({
        // okx 钱包插件仅对 --accept-lang 参数生效
        // 对于 --lang 以及 playwright context 的 locale、extraHTTPHeaders.Accept-Language 配置都无效
        // 因为 okx 钱包插件脚本仅适配英文，所以这里使用 --accept-lang 参数来设置浏览器语言为英文
        // 另外如果设置 '--accept-lang=en-US,en;q=0.9' 会导致指纹检测为 bad，所以这里仅设置 '--accept-lang=en-US'，不知道为什么
        args: ['--accept-lang=en-US'],
        headless,
        extensionsPath,
      });

      // 启动浏览器
      const browserContext = await chromium.launchPersistentContext(
        userDataDir,
        {
          headless,
          channel: BROWSER_CONTEXT.CHANNEL,
          args: browserArgs,
          ...config,
        },
      );
      this.logger.debug(`浏览器启动完成`);

      // 关闭 Okx 钱包初始化加载时的欢迎页或弹窗
      browserContext.on('page', async (page) => {
        const url = page.url();
        if (
          url.includes('extension/welcome') ||
          url.includes('notification.html')
        ) {
          this.logger.debug(`关闭 Okx 钱包欢迎页或弹窗: ${url}`);
          await page.close();
        }
      });

      return browserContext;
    } catch (error) {
      this.logger.error(`创建浏览器上下文失败`, error);
      throw error;
    }
  }
}
