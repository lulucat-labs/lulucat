import Web3 from 'web3';
import axios from 'axios';
import { ScriptExecutionResult } from '../types';
import { WalletException } from '@lulucat/exceptions';

/**
 * 价格提供者接口
 */
interface PriceProvider {
  getETHPriceUSD(): Promise<number | null>;
}

/**
 * CoinGecko API 响应接口
 */
interface CoinGeckoResponse {
  ethereum: {
    usd: number;
  };
}

/**
 * 默认价格提供者，尝试多个API源获取ETH价格
 */
class DefaultPriceProvider implements PriceProvider {
  private readonly priceAPIs = [
    {
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      parser: (data: any): number | null => data?.ethereum?.usd || null
    },
    {
      url: 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
      parser: (data: any): number | null => parseFloat(data?.price) || null
    },
    {
      url: 'https://api.kraken.com/0/public/Ticker?pair=ETHUSD',
      parser: (data: any): number | null => {
        try {
          return parseFloat(data?.result?.XETHZUSD?.c?.[0]) || null;
        } catch (e) {
          return null;
        }
      }
    }
  ];

  /**
   * 尝试从多个API源获取ETH价格
   * @returns ETH价格（USD）或null（如果所有API源都失败）
   */
  public async getETHPriceUSD(): Promise<number | null> {
    // 尝试所有API，使用第一个成功的结果
    for (const api of this.priceAPIs) {
      try {
        console.log(`尝试从 ${api.url} 获取ETH价格...`);
        const response = await axios.get(api.url, { timeout: 3000 });
        const price = api.parser(response.data);
        if (price !== null) {
          console.log(`成功获取ETH价格: $${price}`);
          return price;
        }
      } catch (error) {
        console.warn(`API ${api.url} 调用失败:`, error instanceof Error ? error.message : String(error));
        // 继续尝试下一个API
      }
    }
    
    console.warn('所有价格API源都失败，将使用默认USD估算');
    return null;
  }
}

/**
 * 固定价格提供者，用于当无法获取实时价格时
 */
class StaticPriceProvider implements PriceProvider {
  private readonly price: number;

  constructor(price: number = 3000) {
    this.price = price;
  }

  public async getETHPriceUSD(): Promise<number> {
    console.log(`使用静态ETH价格: $${this.price}`);
    return this.price;
  }
}

/**
 * EVM转账参数接口
 */
export interface EVMTransferParams {
  /** 发送方私钥 */
  privateKey: string;
  /** 接收方地址 */
  toAddress: string;
  /** 转账金额(ETH) */
  amount: string;
  /** 最大可接受的Gas费用(ETH) */
  maxGasETH?: number;
  /** 全额模式，使用 (余额 - maxGasETH) 作为转账金额 */
  fullBalanceMode?: boolean;
  /** 链ID */
  chainId: number;
  /** RPC URL */
  rpcUrl: string;
  /** 静态ETH价格（USD），当无法获取实时价格时使用 */
  staticETHPriceUSD?: number;
  /** 跳过价格查询 */
  skipPriceQuery?: boolean;
}

/**
 * EVM转账结果接口
 */
export interface EVMTransferResult {
  success: boolean;
  error: string;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  fee?: {
    eth: string;
    usd?: string;
  };
  gasPrice?: {
    gwei: string;
    eth: string;
    usd?: string;
  };
  fromAddress?: string;
  toAddress?: string;
  amount?: string;
  [key: string]: unknown;
}

/**
 * 在EVM兼容链上执行ETH转账
 * @param params 转账参数
 * @returns 转账结果
 */
export async function transferETH(params: EVMTransferParams): Promise<EVMTransferResult> {
  const { privateKey, toAddress, chainId, rpcUrl, fullBalanceMode, skipPriceQuery } = params;
  const maxGasETH = params.maxGasETH || 0.00001;
  let { amount } = params;
  
  // 初始化Web3
  const web3 = new Web3(rpcUrl);
  
  try {
    // 从私钥获取钱包地址
    const account = web3.eth.accounts.privateKeyToAccount(privateKey.replace('0x', ''));
    const fromAddress = account.address;
    console.log(`发送方钱包地址: ${fromAddress}`);
    
    // 获取ETH价格（如果需要）
    let ethPriceUSD: number | null = null;
    if (!skipPriceQuery) {
      // 选择价格提供者
      const priceProvider: PriceProvider = params.staticETHPriceUSD !== undefined
        ? new StaticPriceProvider(params.staticETHPriceUSD)
        : new DefaultPriceProvider();
      
      // 尝试获取价格
      ethPriceUSD = await priceProvider.getETHPriceUSD();
      if (ethPriceUSD !== null) {
        console.log(`当前ETH价格: $${ethPriceUSD}`);
      } else {
        console.log('无法获取ETH价格，将不显示USD估算');
      }
    } else {
      console.log('已跳过价格查询');
    }
    
    // 获取账户余额
    const balance = await web3.eth.getBalance(fromAddress);
    const balanceETH = web3.utils.fromWei(balance, 'ether');
    console.log(`账户余额: ${balanceETH} ETH`);
    
    // 获取当前gas价格
    const gasPrice = await web3.eth.getGasPrice();
    const gasPriceGwei = web3.utils.fromWei(gasPrice, 'gwei');
    
    // 计算gas价格的ETH等价物
    const gasPriceETH = parseFloat(gasPriceGwei) * 0.000000001;
    
    // 计算gas价格的美元等价物（如果有价格数据）
    let gasPriceUSD: number | null = null;
    if (ethPriceUSD !== null) {
      gasPriceUSD = gasPriceETH * ethPriceUSD;
    }
    
    console.log(`当前Gas价格: ${gasPriceGwei} Gwei (约 ${gasPriceETH.toFixed(12)} ETH 每单位Gas)`);
    if (gasPriceUSD !== null) {
      console.log(`每单位Gas价格约 $${gasPriceUSD.toFixed(12)} USD`);
    }
    
    try {
      // 全额模式下，计算可用的最大转账金额
      if (fullBalanceMode) {
        console.log('启用全额转账模式，计算最大可转账金额...');
        
        // 估算基本交易所需的gas
        const estimateGas = await web3.eth.estimateGas({
          from: fromAddress,
          to: toAddress,
          value: web3.utils.toWei('0.0001', 'ether') // 使用小额估算gas
        });
        
        // 为安全起见，增加gas限制
        const gasLimit = Math.floor(Number(estimateGas) * 1.2);
        
        // 计算预留的gas费用
        const reservedGasETH = maxGasETH; // 直接使用maxGasETH作为预留费用
        console.log(`预留Gas费: ${reservedGasETH} ETH, 估算基本Gas限制: ${gasLimit}`);
        
        // 计算可用于转账的最大金额 (总余额 - 预留gas费用)
        const maxTransferableETH = parseFloat(balanceETH) - reservedGasETH;
        console.log(`计算: 总余额(${balanceETH} ETH) - 预留费用(${reservedGasETH} ETH) = 可转账金额(${maxTransferableETH} ETH)`);
        
        if (maxTransferableETH <= 0) {
          throw WalletException.transactionFailed('余额不足', {
            walletInfo: params,
            message: `余额不足以支付Gas费用: 余额 ${balanceETH} ETH, 需预留 ${reservedGasETH} ETH 作为Gas费用`
          });
        }
        
        // 更新转账金额为最大可用金额
        amount = maxTransferableETH.toFixed(18);
        console.log(`全额模式: 计算得出的最大可转账金额: ${amount} ETH`);
      }

      // 估算交易所需的gas
      const estimateGas = await web3.eth.estimateGas({
        from: fromAddress,
        to: toAddress,
        value: web3.utils.toWei(amount, 'ether')
      });
      
      console.log(`估算的Gas上限: ${estimateGas}`);
      
      // 为安全起见，增加gas限制
      const gasLimit = Math.floor(Number(estimateGas) * 1);
      
      // 计算gas费用 - 使用BigInt正确处理
      const gasPriceBigInt = BigInt(gasPrice);
      const gasLimitBigInt = BigInt(gasLimit);
      const gasCostWeiBigInt = gasPriceBigInt * gasLimitBigInt;
      
      // 计算gas费用（以ETH为单位）
      const gasCostETH = web3.utils.fromWei(gasCostWeiBigInt.toString(), 'ether');
      console.log(`估算的Gas费用: ${gasCostETH} ETH`);
      
      // 计算gas费用（以USD为单位，如果有价格数据）
      let gasCostUSD: number | null = null;
      if (ethPriceUSD !== null) {
        gasCostUSD = parseFloat(gasCostETH) * ethPriceUSD;
        console.log(`估算的Gas费用: $${gasCostUSD.toFixed(6)} USD`);
      }
      
      // 检查gas费用是否超过最大接受值
      if (parseFloat(gasCostETH) > maxGasETH) {
        throw WalletException.transactionFailed('gas 费用过高', {
          walletInfo: params,
          message: `Gas费用过高: ${gasCostETH} ETH，超过了设定的最大值: ${maxGasETH} ETH`
        });
      }
      
      // 准备交易参数
      const amountWei = web3.utils.toWei(amount, 'ether');
      const nonce = await web3.eth.getTransactionCount(fromAddress);
      
      // 检查余额是否足够 - 使用BigInt正确处理
      const amountWeiBigInt = BigInt(amountWei);
      const balanceBigInt = BigInt(balance);
      const totalCostWeiBigInt = amountWeiBigInt + gasCostWeiBigInt;
      
      if (balanceBigInt < totalCostWeiBigInt) {
        const totalETH = web3.utils.fromWei(totalCostWeiBigInt.toString(), 'ether');
        throw WalletException.transactionFailed('余额不足', {
          walletInfo: params,
          message: `余额不足: 需要 ${totalETH} ETH，但只有 ${balanceETH} ETH`
        });
      }
      
      // 创建交易对象
      const txData = {
        from: fromAddress,
        to: toAddress,
        value: web3.utils.numberToHex(amountWei),
        gasLimit: web3.utils.numberToHex(gasLimit),
        gasPrice: web3.utils.numberToHex(gasPrice),
        nonce: web3.utils.numberToHex(nonce),
        chainId
      };
      
      // 签名交易
      const signedTx = await account.signTransaction(txData);
      
      // 发送已签名的交易
      console.log(`准备从 ${fromAddress} 发送 ${amount} ETH 到 ${toAddress}`);
      
      // Web3.js v4 类型处理
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const receipt = await web3.eth.sendSignedTransaction((signedTx as any).rawTransaction);
      
      // 计算实际使用的gas费用
      const gasUsedETH = web3.utils.fromWei((BigInt(receipt.gasUsed.toString()) * gasPriceBigInt).toString(), 'ether');
      
      // 如果有价格数据，计算USD等价物
      let gasUsedUSD: number | null = null;
      if (ethPriceUSD !== null) {
        gasUsedUSD = parseFloat(gasUsedETH) * ethPriceUSD;
      }
      
      // 格式化blockNumber和gasUsed（如果是BigInt）
      const blockNumberFormatted = typeof receipt.blockNumber === 'bigint'
        ? Number(receipt.blockNumber)
        : typeof receipt.blockNumber === 'string'
          ? parseInt(receipt.blockNumber, 10)
          : receipt.blockNumber as number;
        
      const gasUsedFormatted = typeof receipt.gasUsed === 'bigint'
        ? Number(receipt.gasUsed)
        : typeof receipt.gasUsed === 'string'
          ? parseInt(receipt.gasUsed, 10)
          : receipt.gasUsed as number;
      
      // 构建结果对象，根据是否有价格数据添加USD信息
      const result: EVMTransferResult = {
        success: true,
        txHash: receipt.transactionHash.toString(),
        blockNumber: blockNumberFormatted,
        gasUsed: gasUsedFormatted,
        fee: {
          eth: gasUsedETH
        },
        gasPrice: {
          gwei: gasPriceGwei,
          eth: gasPriceETH.toFixed(12)
        },
        fromAddress,
        toAddress,
        amount,
        error: `交易成功: 从 ${fromAddress} 发送 ${amount} ETH 到 ${toAddress}`
      };
      
      // 如果有价格数据，添加USD信息
      if (gasUsedUSD !== null) {
        result.fee.usd = `$${gasUsedUSD.toFixed(6)}`;
      }
      
      if (gasPriceUSD !== null) {
        result.gasPrice.usd = `$${gasPriceUSD.toFixed(10)}`;
      }
      
      return result;
    
    } catch (error) {
      // 处理具体的错误
      if (error instanceof Error && error.message.includes('insufficient funds')) {
        console.error('余额不足错误:', error);
        const recommendedAmount = parseFloat(balanceETH) * 0.7; // 使用余额的70%作为推荐金额
        throw new Error(`余额不足，无法执行交易。当前余额：${balanceETH} ETH，建议尝试较小的金额，如 ${recommendedAmount.toFixed(8)} ETH`);
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('交易失败:', error);
    throw WalletException.transactionFailed('交易失败', {
      walletInfo: params,
      message: `交易失败: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

/**
 * 执行EVM转账并生成执行结果
 * @param params 转账参数
 * @returns 脚本执行结果
 */
export async function executeEVMTransfer(params: EVMTransferParams): Promise<ScriptExecutionResult> {
  try {
    // 执行转账操作
    const result = await transferETH(params);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    console.log('转账交易成功:', result);
    
    // 构建结果消息，不依赖USD价格信息
    const successMessage = `成功将 ${result.amount || params.amount}${params.fullBalanceMode ? ' (全额模式)' : ''} ETH 从 ${result.fromAddress} 转账到 ${params.toAddress}，Gas费: ${result.fee?.eth} ETH`;
    
    return { 
      success: true, 
      data: {
        ...result,
        error: successMessage
      } 
    };
  } catch (error) {
    console.error('转账任务失败:', error);
    throw WalletException.transactionFailed('转账任务失败', {
      walletInfo: params,
      message: `转账任务失败: ${error instanceof Error ? error.message : String(error)}`
    });
  }
} 