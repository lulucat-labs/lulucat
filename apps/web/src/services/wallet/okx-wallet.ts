import { ethers } from 'ethers';
import { message } from 'antd';
import { getNonce, walletLogin } from '@/services/common/api';

/**
 * OKX钱包服务
 * 提供连接钱包、获取地址、签名等功能
 */
export class OkxWalletService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;

  /**
   * 检查OKX钱包是否已安装
   */
  public isWalletInstalled(): boolean {
    return typeof window !== 'undefined' && window.okexchain !== undefined;
  }

  /**
   * 连接OKX钱包
   */
  public async connectWallet(): Promise<string | null> {
    try {
      if (!this.isWalletInstalled()) {
        message.error('请先安装OKX钱包插件');
        window.open('https://www.okx.com/cn/web3/wallet', '_blank');
        return null;
      }

      // 初始化provider
      this.provider = new ethers.providers.Web3Provider(window.okexchain, 'any');

      // 请求用户授权
      await this.provider.send('eth_requestAccounts', []);

      // 获取签名者
      this.signer = this.provider.getSigner();

      // 获取钱包地址
      this.address = await this.signer.getAddress();

      return this.address;
    } catch (error: unknown) {
      console.error('连接钱包失败:', error);
      message.error('连接钱包失败，请重试');
      return null;
    }
  }

  /**
   * 获取钱包地址
   */
  public getAddress(): string | null {
    return this.address;
  }

  /**
   * 断开钱包连接
   */
  public disconnectWallet(): void {
    this.provider = null;
    this.signer = null;
    this.address = null;
  }

  /**
   * 获取登录nonce
   */
  public async getNonce(walletAddress: string): Promise<string> {
    try {
      const response = await getNonce(walletAddress);
      console.log('getNonce响应:', response);

      if (response && response.code === 200 && response.data && response.data.nonce) {
        return response.data.nonce;
      } else {
        console.error('获取nonce响应格式不正确:', response);
        message.error('获取nonce失败，服务器响应格式不正确');
        throw new Error('获取nonce失败，服务器响应格式不正确');
      }
    } catch (error: unknown) {
      console.error('获取nonce失败:', error);
      message.error('获取nonce失败，请重试');
      throw error;
    }
  }

  /**
   * 签名消息
   */
  public async signMessage(messageToSign: string): Promise<string | null> {
    try {
      if (!this.signer) {
        throw new Error('钱包未连接');
      }
      return await this.signer.signMessage(messageToSign);
    } catch (error: unknown) {
      console.error('签名失败:', error);
      message.error('签名失败，请重试');
      return null;
    }
  }

  /**
   * 钱包登录
   */
  public async login(): Promise<{ token: string; user: any } | null> {
    try {
      console.log('开始钱包登录流程');

      if (!this.address) {
        console.log('钱包未连接，尝试连接钱包');
        const address = await this.connectWallet();
        if (!address) {
          console.log('钱包连接失败');
          return null;
        }
        console.log('钱包连接成功，地址:', address);
      }

      // 获取nonce
      console.log('获取nonce');
      const nonce = await this.getNonce(this.address!);
      console.log('获取到nonce:', nonce);

      // 构建签名消息
      const messageToSign = `Sign this message to verify your identity. Nonce: ${nonce}`;
      console.log('构建签名消息:', messageToSign);

      // 签名消息
      console.log('开始签名消息');
      const signature = await this.signMessage(messageToSign);
      if (!signature) {
        console.log('签名失败');
        return null;
      }
      console.log('签名成功');

      // 发送登录请求
      console.log('发送登录请求');
      const response = await walletLogin({
        walletAddress: this.address!,
        signature,
        message: messageToSign,
      });
      console.log('登录响应:', response);

      // 检查响应结构
      if (response && response.code === 200 && response.data) {
        const { token, user } = response.data;

        // 保存token到localStorage
        localStorage.setItem('token', token);
        console.log('Token已保存到localStorage');

        return {
          token,
          user
        };
      } else {
        console.error('登录响应格式不正确:', response);
        message.error('登录失败，服务器响应格式不正确');
        return null;
      }
    } catch (error: unknown) {
      console.error('钱包登录失败:', error);
      message.error('钱包登录失败，请重试');
      return null;
    }
  }
}

// 创建单例实例
const okxWalletService = new OkxWalletService();
export default okxWalletService;
