/**
 * 检测IP、账号和密码是否可用
 * 支持HTTP代理和TCP连接测试
 * 如果连接成功返回true，否则返回false
 */

import { Injectable } from '@nestjs/common';
import * as net from 'net';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CryptoUtil } from './crypto.util';
import { ConfigService } from '@nestjs/config';

// 定义代理信息接口
export interface ProxyInfo {
  proxyId?: number;
  userId?: number;
  ipAddress: string;
  port: number;
  username?: string;
  password?: string;
  proxyType: string;
  location?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  org?: string | null;
  postal?: string | null;
  timezone?: string | null;
  ipInfoUpdatedAt?: Date | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export default class CheckIpService {
  /**
   * 测试TCP端口是否开放
   * @param {string} ip - 服务器IP地址
   * @param {number} port - 端口
   * @param {number} timeout - 超时时间(毫秒)
   * @returns {Promise<boolean>} - 端口开放返回true，否则返回false
   */
  async checkTCPConnection(
    ip: string,
    port: number,
    timeout: number = 3000,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      let isConnected = false;
      let isResolved = false;

      // 安全地解析结果，确保只解析一次
      const safeResolve = (result: boolean) => {
        if (!isResolved) {
          isResolved = true;
          resolve(result);
        }
      };

      // 设置超时
      socket.setTimeout(timeout);

      socket.on('connect', () => {
        isConnected = true;
        socket.end();
        safeResolve(true);
      });

      socket.on('timeout', () => {
        console.log(`连接到 ${ip}:${port} 超时`);
        socket.destroy();
        safeResolve(false);
      });

      socket.on('error', (err: Error) => {
        console.log(`连接到 ${ip}:${port} 失败: ${err.message}`);
        safeResolve(false);
      });

      socket.on('close', () => {
        if (!isConnected) {
          safeResolve(false);
        }
      });

      try {
        socket.connect(port, ip);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.log(`连接到 ${ip}:${port} 出错: ${errorMessage}`);
        safeResolve(false);
      }
    });
  }

  /**
   * 测试HTTP代理是否可用
   * @param {string} ip - 代理服务器IP地址
   * @param {number} port - 代理服务器端口
   * @param {string} username - 代理用户名 (可选)
   * @param {string} password - 代理密码 (可选)
   * @param {number} timeout - 超时时间(毫秒)，默认为10000ms
   * @param {string} testUrl - 用于测试的URL，默认为'https://www.google.com'
   * @returns {Promise<boolean>} - 代理可用返回true，不可用返回false
   */
  async checkHttpProxy(
    ip: string,
    port: number,
    username: string | null = null,
    password: string | null = null,
    timeout: number = 10000,
    testUrl: string = 'https://www.google.com',
  ): Promise<boolean> {
    try {
      // 构建代理URL
      let proxyUrl: string;
      // 解密后的密码
      const configService = new ConfigService();
      const encryptionKey = configService.get<string>('ENCRYPTION_KEY');

      const decodedPassword = password
        ? CryptoUtil.decrypt(password, encryptionKey)
        : null;
      console.log('decodedPassword', decodedPassword);
      if (username && password) {
        // 对用户名和密码进行URL编码
        const encodedUsername = encodeURIComponent(username);
        const encodedPassword = encodeURIComponent(decodedPassword);
        proxyUrl = `http://${encodedUsername}:${encodedPassword}@${ip}:${port}`;
      } else {
        proxyUrl = `http://${ip}:${port}`;
      }

      console.log(`正在测试HTTP代理 ${ip}:${port}...`);

      // 创建一个AbortController用于更可靠的超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log(`强制中断请求，代理测试超时: ${ip}:${port}`);
      }, timeout);

      try {
        // 创建代理agent
        const proxyAgent = new HttpsProxyAgent(proxyUrl);

        // 发送请求，通过代理连接测试URL
        const response = await axios({
          method: 'GET',
          url: testUrl,
          proxy: false, // 禁用Axios的默认代理设置
          httpsAgent: proxyAgent,
          timeout: Math.min(timeout / 2, 5000), // 更短的超时确保不会长时间等待
          signal: controller.signal, // 使用AbortController进行超时控制
          validateStatus: function (status: number) {
            return [200].includes(status);
          },
        });

        clearTimeout(timeoutId); // 清除超时计时器
        console.log(`代理测试成功，状态码: ${response.status}`);
        return true;
      } catch (error) {
        clearTimeout(timeoutId); // 确保清除超时计时器
        throw error; // 重新抛出错误，由外层处理
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (
          error.code === 'ECONNABORTED' ||
          error.message.includes('timeout')
        ) {
          console.log(`连接代理超时: ${ip}:${port}`);
        } else if (error.code === 'ECONNREFUSED') {
          console.log(`连接代理被拒绝: ${ip}:${port}`);
        } else if (error.response) {
          console.log(`代理返回错误状态码: ${error.response.status}`);
        } else {
          console.log(`测试代理出错: ${error.message}`);
          console.log('代理信息:', {
            ip,
            port,
            username,
            proxyUrl: `http://${ip}:${port}`,
          });
          // 增加详细的错误信息日志
          if (error.request) {
            console.log('请求信息:', {
              method: error.request.method,
              path: error.request.path,
              host: error.request.host,
            });
          }
        }
      } else if (
        error.name === 'AbortError' ||
        error.message?.includes('aborted')
      ) {
        console.log(`代理请求被中止: ${ip}:${port}`);
      } else {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log(`测试代理未知错误: ${errorMessage}`);
        console.log('错误详情:', error);
      }
      return false;
    }
  }

  /**
   * 测试代理连接是否可用，根据提供的代理类型选择测试方法
   * @param {ProxyInfo} proxyInfo - 代理信息对象
   * @param {string} testUrl - 测试URL，用于验证代理是否能访问特定网站
   * @param {number} timeout - 超时时间(毫秒)，默认为10000ms
   * @returns {Promise<boolean>} - 代理可用返回true，不可用返回false
   */
  async checkProxyConnection(
    proxyInfo: ProxyInfo,
    testUrl: string,
    timeout: number = 10000,
  ): Promise<boolean> {
    const { ipAddress, port, username, password, proxyType } = proxyInfo;
    console.log('testUrl', testUrl);

    // 首先检查端口是否开放，设置较短的超时时间
    const portTimeoutMs = Math.min(timeout / 3, 3000);
    console.log(
      `检查端口是否开放: ${ipAddress}:${port}，超时时间: ${portTimeoutMs}ms`,
    );
    const portOpen = await this.checkTCPConnection(
      ipAddress,
      port,
      portTimeoutMs,
    );

    if (!portOpen) {
      console.log(`端口 ${port} 未开放，无法连接到代理`);
      return false;
    }

    // 根据代理类型选择不同的测试方法
    if (
      proxyType.toLowerCase() === 'http' ||
      proxyType.toLowerCase() === 'https'
    ) {
      // 为测试设置较短的超时时间，确保不会长时间卡住
      const testTimeoutMs = Math.min(timeout / 2, 5000);
      console.log(`开始测试代理访问能力，每个测试超时时间: ${testTimeoutMs}ms`);

      // 串行测试两个URL，确保逻辑清晰
      // 先测试是否能够访问 ipinfo.io
      console.log(`测试代理访问 ipinfo.io...`);
      const ipInfoResult = await this.checkHttpProxy(
        ipAddress,
        port,
        username || null,
        password || null,
        testTimeoutMs,
        'https://ipinfo.io/json',
      );

      // 如果ipInfo测试失败，立即返回失败，不继续测试
      if (!ipInfoResult) {
        console.log(`访问ipinfo.io失败，中止测试`);
        return false;
      }

      // 再测试是否能够访问目标站点
      console.log(`测试代理访问目标站点 ${testUrl}...`);
      const projectInfoResult = await this.checkHttpProxy(
        ipAddress,
        port,
        username || null,
        password || null,
        testTimeoutMs,
        testUrl,
      );

      // 记录最终结果
      console.log(
        `代理测试结果: ipInfo=${ipInfoResult}, projectInfo=${projectInfoResult}`,
      );

      // 两个测试都成功才返回true
      return ipInfoResult && projectInfoResult;
    } else if (proxyType.toLowerCase() === 'socks5') {
      // TODO: 实现SOCKS5代理测试
      console.log('SOCKS5代理测试尚未实现');
      return false;
    } else {
      console.log(`不支持的代理类型: ${proxyType}`);
      return false;
    }
  }
}
