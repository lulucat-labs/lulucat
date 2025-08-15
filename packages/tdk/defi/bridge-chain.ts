import { ScriptExecutionResult } from '../types';
import { 
  getClient, 
  createClient, 
  convertViemChainToRelayChain, 
  MAINNET_RELAY_API 
} from '@reservoir0x/relay-sdk';
import { 
  createWalletClient, 
  createPublicClient, 
  http, 
  formatEther, 
  parseEther 
} from 'viem';
import { zksync, abstract } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { WalletException } from '@lulucat/exceptions';

// 常量定义
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
const DEFAULT_FROM_CHAIN_ID = 324; // zkSync Era
const DEFAULT_TO_CHAIN_ID = 2741; // Abstract
const FIXED_GAS_RESERVE_ETH = '0.00001'; // 固定预留gas费为0.00001 ETH
const FIXED_GAS_LIMIT_ETH = '0.00001'; // Gas费上限为0.00001 ETH
const DEFAULT_RELAYER_FEE_PERCENTAGE_THRESHOLD = 2; // 中继费不能超过总金额的 2%

/**
 * 跨链桥接参数接口
 */
interface BridgeParams {
  /** 转账金额 */
  amount: string;
  /** 接收地址，默认与发送地址相同 */
  toAddress?: string;
  /** 钱包私钥 */
  privateKey: string;
  /** 源链ID，默认为zkSync Era */
  fromChainId?: number;
  /** 目标链ID，默认为Abstract */
  toChainId?: number;
  /** 最大可接受的Gas费用(ETH)，默认为0.00001 ETH */
  maxFeeEth?: string;
  /** 最大可接受的中继费百分比，默认为2% */
  maxRelayerFeePercentage?: number;
  /** 是否使用全部余额，如果为true，则忽略amount参数 */
  useFullAmount?: boolean;
}

/**
 * 初始化 Relay SDK 客户端
 */
function initializeRelayClient(): void {
  // 转换链配置
  const zkSyncChain = convertViemChainToRelayChain(zksync);
  const abstractChain = convertViemChainToRelayChain(abstract);
  
  createClient({
    baseApiUrl: MAINNET_RELAY_API,
    chains: [zkSyncChain, abstractChain],
    source: 'lulucat.bridge'
  });
}

/**
 * 根据链ID获取链名称
 * @param chainId 链ID
 * @returns 链名称
 */
function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: "以太坊主网",
    10: "Optimism",
    56: "BSC",
    137: "Polygon",
    42161: "Arbitrum",
    43114: "Avalanche",
    2741: "Abstract",
    324: "zkSync Era",
  };
  return chains[chainId] || `链ID ${chainId}`;
}

/**
 * 创建钱包和公共客户端
 * @param privateKey 私钥
 * @param chainId 链ID
 * @returns 钱包信息对象，包含账户、钱包客户端、公共客户端和余额
 */
async function createWalletAndClient(privateKey: string, chainId: number) {
  // 标准化私钥格式
  const formattedPrivateKey = privateKey.startsWith('0x') 
    ? privateKey as `0x${string}` 
    : `0x${privateKey}` as `0x${string}`;
  
  // 从私钥创建账户
  const account = privateKeyToAccount(formattedPrivateKey);

  // 获取RPC URL
  const rpcUrl = chainId === 324 
    ? 'https://mainnet.era.zksync.io' 
    : 'https://mainnet.abstrakt.network/';

  // 创建公共客户端
  const publicClient = createPublicClient({
    chain: chainId === 324 ? zksync : abstract,
    transport: http(rpcUrl)
  });

  // 创建钱包客户端
  const walletClient = createWalletClient({
    account,
    transport: http(rpcUrl),
    chain: chainId === 324 ? zksync : abstract
  });

  // 查询账户余额
  const balance = await publicClient.getBalance({
    address: account.address
  });

  return {
    account,
    walletClient,
    publicClient,
    balance,
    balanceInEth: formatEther(balance)
  };
}

/**
 * 获取跨链桥接报价和详情
 * @param walletInfo 钱包信息
 * @param params 桥接参数
 * @returns 报价和详情
 */
async function getQuoteAndDetails(walletInfo: any, params: BridgeParams) {
  const { 
    amount, 
    fromChainId = DEFAULT_FROM_CHAIN_ID, 
    toChainId = DEFAULT_TO_CHAIN_ID,
    toAddress,
    useFullAmount = false
  } = params;

  // 初始估算发送金额
  let amountToUse = amount;
  
  // Relay客户端
  const client = getClient();
  if (!client || !client.actions) {
    throw new Error('Relay 客户端未正确初始化');
  }
  
  const recipient = toAddress || walletInfo.account.address;
  
  // 固定预留gas费为0.00001 ETH
  const gasReserveEth = FIXED_GAS_RESERVE_ETH;
  let usingFullBalanceWithoutReserve = false;

  if (useFullAmount) {
    // 使用固定的ETH预留用于gas费
    const gasReserve = parseEther(gasReserveEth);
    
    // 检查余额是否低于预留金额
    if (walletInfo.balance < gasReserve) {
      // 如果余额低于预留金额，则直接使用全部余额
      console.log(`余额(${walletInfo.balanceInEth} ETH)低于预留的gas费(${gasReserveEth} ETH)，将直接使用全部余额进行交易`);
      amountToUse = walletInfo.balanceInEth;
      usingFullBalanceWithoutReserve = true;
    } else {
      // 计算可发送的最大金额 = 总余额 - 预留gas费
      const maxSendableAmount = walletInfo.balance - gasReserve;
      
      if (maxSendableAmount <= BigInt(0)) {
        throw new Error(`余额不足，无法执行全部余额转账。当前余额(${walletInfo.balanceInEth} ETH)不足以支付基本gas费(${gasReserveEth} ETH)`);
      }
      
      // 使用可发送的最大金额
      amountToUse = formatEther(maxSendableAmount);
      console.log(`全额模式: 账户余额 ${walletInfo.balanceInEth} ETH, 预留固定gas费 ${gasReserveEth} ETH, 可发送金额 ${amountToUse} ETH`);
    }
  }

  // 将金额转换为 Wei 格式
  const amountInWei = parseEther(amountToUse);
  const amountToSend = amountInWei.toString();
  
  // 获取最终报价
  console.log(`正在获取从${getChainName(fromChainId)}到${getChainName(toChainId)}的报价，金额: ${amountToUse} ETH...`);
  
  const quote = await client.actions.getQuote({
    wallet: walletInfo.walletClient,
    chainId: fromChainId,
    toChainId: toChainId,
    amount: amountToSend,
    currency: ETH_ADDRESS,
    toCurrency: ETH_ADDRESS,
    recipient,
    tradeType: 'EXACT_INPUT'
  });
  
  // 分析费用信息
  const gasFeeEth = BigInt(quote.fees.gas.amount);
  const relayerFeeEth = BigInt(quote.fees.relayer.amount);
  const totalFees = gasFeeEth + relayerFeeEth;
  let totalRequiredBigInt: bigint;
  
  // 如果使用全额模式，检查实际所需gas费是否超过了预留费用
  if (useFullAmount && !usingFullBalanceWithoutReserve) {
    const gasReserveBigInt = parseEther(gasReserveEth);
    
    // 如果实际fee超过了预留的gas费，需要重新计算可发送金额
    if (totalFees > gasReserveBigInt) {
      console.log(`\n⚠️ 注意: 实际所需gas费(${formatEther(totalFees)} ETH)超过了预留的gas费(${gasReserveEth} ETH)`);
      
      // 重新计算可发送的最大金额 = 总余额 - 实际所需gas费
      const actualMaxSendableAmount = walletInfo.balance - totalFees;
      
      if (actualMaxSendableAmount <= BigInt(0)) {
        throw new Error(`余额不足，无法执行全部余额转账。当前余额(${walletInfo.balanceInEth} ETH)不足以支付实际所需gas费(${formatEther(totalFees)} ETH)`);
      }
      
      // 更新可发送的最大金额
      amountToUse = formatEther(actualMaxSendableAmount);
      console.log(`由于实际gas费较高，重新计算后的可发送金额: ${amountToUse} ETH`);
      
      // 重新获取报价
      console.log(`正在重新获取报价，调整后的金额: ${amountToUse} ETH...`);
      
      // 将调整后的金额转换为 Wei 格式
      const adjustedAmountInWei = parseEther(amountToUse);
      
      // 重新获取报价
      const adjustedQuote = await client.actions.getQuote({
        wallet: walletInfo.walletClient,
        chainId: fromChainId,
        toChainId: toChainId,
        amount: adjustedAmountInWei.toString(),
        currency: ETH_ADDRESS,
        toCurrency: ETH_ADDRESS,
        recipient,
        tradeType: 'EXACT_INPUT'
      });
      
      // 更新报价和费用信息
      Object.assign(quote, adjustedQuote);
      const adjustedGasFeeEth = BigInt(adjustedQuote.fees.gas.amount);
      const adjustedRelayerFeeEth = BigInt(adjustedQuote.fees.relayer.amount);
      
      // 更新总所需费用
      totalRequiredBigInt = adjustedAmountInWei + adjustedGasFeeEth + adjustedRelayerFeeEth;
    } else {
      totalRequiredBigInt = amountInWei + gasFeeEth + relayerFeeEth;
    }
  } else {
    totalRequiredBigInt = amountInWei + gasFeeEth + relayerFeeEth;
  }
  
  // 打印中继费详细信息
  console.log("\n中继费详细信息:");
  console.log(`中继费(ETH): ${formatEther(relayerFeeEth)} ETH`);
  console.log(`Gas费(ETH): ${formatEther(gasFeeEth)} ETH`);
  console.log(`交易金额(ETH): ${amountToUse} ETH`);
  console.log(`注意: 中继费是额外收取的，并不从转账金额中扣除`);
  console.log(`所需总ETH: ${formatEther(totalRequiredBigInt)} ETH (转账金额 + Gas费 + 中继费)\n`);
  
  // 获取代币信息
  const tokenInSymbol = quote.details.currencyIn.currency.symbol || "ETH";
  const tokenOutSymbol = quote.details.currencyOut.currency.symbol || "ETH";

  // 计算中继费占总金额的百分比
  const relayerFeeEthFloat = parseFloat(formatEther(relayerFeeEth));
  const transactionValueEthFloat = parseFloat(amountToUse);
  const relayerFeePercentage = (relayerFeeEthFloat / transactionValueEthFloat) * 100;
  
  return {
    quote,
    fees: {
      gasFeeEth,
      relayerFeeEth,
      relayerFeePercentage: relayerFeePercentage.toFixed(2),
      totalRequiredEth: formatEther(totalRequiredBigInt),
      totalRequiredBigInt
    },
    details: {
      fromChain: getChainName(fromChainId),
      toChain: getChainName(toChainId),
      tokenInSymbol,
      tokenOutSymbol,
      amountIn: formatEther(BigInt(quote.details.currencyIn.amount)), 
      amountOut: formatEther(BigInt(quote.details.currencyOut.amount)),
      valueInUsd: quote.details.currencyIn.amountUsd,
      valueOutUsd: quote.details.currencyOut.amountUsd,
      estimatedTime: quote.details.timeEstimate || '未知'
    },
    sentAmount: amountToUse,
    gasReserveForFullAmount: useFullAmount && !usingFullBalanceWithoutReserve ? gasReserveEth : '0', // 记录为全额模式预留的gas
    usingFullBalanceWithoutReserve // 是否使用全额无预留模式
  };
}

/**
 * 显示交易摘要
 * @param quoteDetails 报价详情
 */
function displayTransactionSummary(quoteDetails: any): void {
  const { details, fees, sentAmount } = quoteDetails;
  
  console.log("\n===== 跨链桥交易概要 =====");
  console.log(`从: ${details.fromChain} -> 到: ${details.toChain}`);
  console.log(`转出: ${details.amountIn} ${details.tokenInSymbol} (价值: $${details.valueInUsd})`);
  console.log(`预计收到: ${details.amountOut} ${details.tokenOutSymbol} (价值: $${details.valueOutUsd})`);
  console.log(`预计时间: ${details.estimatedTime} 分钟`);
  
  console.log("\n--- 费用明细 ---");
  console.log(`Gas费: ${formatEther(fees.gasFeeEth)} ETH`);
  console.log(`中继费: ${formatEther(fees.relayerFeeEth)} ETH`);
  console.log(`总费用: ${formatEther(fees.gasFeeEth + fees.relayerFeeEth)} ETH`);
  
  console.log("\n--- 交易金额与费用计算 ---");
  console.log(`实际发送金额: ${sentAmount} ETH`);
  console.log(`中继费和Gas费是额外收取的，不从转账金额中扣除`);
  console.log(`总需要的ETH: ${fees.totalRequiredEth} (转账金额 + Gas费 + 中继费)`);
}

/**
 * 跨链桥接任务类
 * 使用 Relay SDK 进行资产跨链
 */
export class BridgeChainTask {
  /**
   * 执行桥接操作
   * @param params 桥接参数，包含金额、目标地址和钱包私钥等
   * @returns 桥接请求的响应数据
   */
  public async execute(params: BridgeParams): Promise<ScriptExecutionResult> {
    // 使用这些变量跟踪执行状态，使它们在catch块中可用
    let walletInfo = null;
    const useFullAmount = params.useFullAmount || false;
    
    try {
      // 初始化 Relay 客户端
      initializeRelayClient();
      
      // 解构参数
      const { 
        amount, 
        toAddress, 
        privateKey, 
        fromChainId = DEFAULT_FROM_CHAIN_ID, 
        toChainId = DEFAULT_TO_CHAIN_ID,
        maxFeeEth = FIXED_GAS_LIMIT_ETH,
        maxRelayerFeePercentage = DEFAULT_RELAYER_FEE_PERCENTAGE_THRESHOLD
      } = params;
      
      // 创建钱包客户端和公共客户端
      walletInfo = await createWalletAndClient(privateKey, fromChainId);
      console.log(`钱包地址: ${walletInfo.account.address}`);
      console.log(`账户余额: ${walletInfo.balanceInEth} ETH`);
      
      if (useFullAmount) {
        console.log(`\n注意: 使用全额模式，将固定预留 ${FIXED_GAS_RESERVE_ETH} ETH 作为Gas费`);
        if (parseFloat(walletInfo.balanceInEth) < parseFloat(FIXED_GAS_RESERVE_ETH)) {
          console.log(`当前余额(${walletInfo.balanceInEth} ETH)低于预留值，将直接使用全部余额进行交易，可能会导致交易失败`);
        }
      }
      
      // 获取报价和详情
      const quoteDetails = await getQuoteAndDetails(walletInfo, {
        amount,
        toAddress: toAddress || walletInfo.account.address,
        privateKey,
        fromChainId,
        toChainId,
        useFullAmount
      });
      
      // 显示交易摘要
      displayTransactionSummary(quoteDetails);
      
      // 检查 Gas 费是否超过阈值
      const maxFeeEthBigInt = parseEther(maxFeeEth);
      if (quoteDetails.fees.gasFeeEth > maxFeeEthBigInt) {
        console.log(`\n❌ 交易已取消: Gas 费用 ${formatEther(quoteDetails.fees.gasFeeEth)} ETH 超过设定的上限 ${maxFeeEth} ETH`);
        throw WalletException.transactionFailed('gas 费用过高', {
          walletInfo: params,
          message: `当前 Gas 费 ${formatEther(quoteDetails.fees.gasFeeEth)} ETH 超过阈值 ${maxFeeEth} ETH，取消桥接`
        });
      }
      
      // 计算中继费占总金额的百分比
      const relayerFeeEthFloat = parseFloat(formatEther(quoteDetails.fees.relayerFeeEth));
      const transactionValueEthFloat = parseFloat(quoteDetails.sentAmount);
      const relayerFeePercentage = (relayerFeeEthFloat / transactionValueEthFloat) * 100;
      
      // 打印中继费占比计算详情
      console.log("\n===== 中继费占比计算 =====");
      console.log(`交易金额(ETH): ${transactionValueEthFloat} ETH`);
      console.log(`中继费(ETH): ${relayerFeeEthFloat} ETH`);
      console.log(`中继费占交易金额百分比: ${relayerFeePercentage.toFixed(2)}%`);
      console.log(`中继费上限阈值: ${maxRelayerFeePercentage}%`);
      
      // 检查中继费百分比是否超过阈值
      if (relayerFeePercentage > maxRelayerFeePercentage) {
        console.log(`\n❌ 交易已取消: 中继费占比 ${relayerFeePercentage.toFixed(2)}% 超过设定的上限 ${maxRelayerFeePercentage}%`);
        throw WalletException.transactionFailed('中继费占比过高', {
          walletInfo: params,
          message: `中继费占比 ${relayerFeePercentage.toFixed(2)}% 超过设定的上限 ${maxRelayerFeePercentage}%，取消桥接`
        });
      }
      
      // 如果使用全额模式，我们检查交易是否可以执行
      if (useFullAmount) {
        // 检查是否有足够的余额支付至少网络费用
        const amountOutValue = parseFloat(quoteDetails.details.amountOut);
        if (amountOutValue <= 0) {
          const errorMsg = `余额不足以支付跨链桥交易费用！即使只发送预估金额(${quoteDetails.sentAmount} ETH)而非全部余额(${walletInfo.balanceInEth} ETH)，仍无法覆盖必要的中继费和Gas费`;
          console.error(errorMsg);
          throw WalletException.transactionFailed('余额不足', {
            walletInfo: params,
            message: errorMsg
          });
        }
        
        // 获取实际需要的gas费总额
        const actualTotalFees = quoteDetails.fees.gasFeeEth + quoteDetails.fees.relayerFeeEth;
        const gasReserveBigInt = parseEther(FIXED_GAS_RESERVE_ETH);
        
        // 告知用户实际发送的金额
        if (quoteDetails.usingFullBalanceWithoutReserve) {
          console.log(`\n注意：由于余额(${walletInfo.balanceInEth} ETH)较低，将直接使用全部余额进行交易，不预留gas费`);
          console.log(`此操作可能会导致交易失败，请确保钱包中有足够的ETH支付中继费和Gas费`);
        } else {
          console.log(`\n注意：为确保交易成功，已预留费用用于Gas，实际发送金额为 ${quoteDetails.sentAmount} ETH（总余额 ${walletInfo.balanceInEth} ETH）`);
          
          // 如果实际所需gas费超过了预留的gas费，给出警告
          if (quoteDetails.fees.gasFeeEth + quoteDetails.fees.relayerFeeEth > parseEther(FIXED_GAS_RESERVE_ETH)) {
            console.log(`\n⚠️ 警告: 实际所需费用(${formatEther(quoteDetails.fees.gasFeeEth + quoteDetails.fees.relayerFeeEth)} ETH)大于最初预留的费用(${FIXED_GAS_RESERVE_ETH} ETH)，已自动调整发送金额`);
          }
        }
        
        console.log(`此外，需额外支付中继费 ${formatEther(quoteDetails.fees.relayerFeeEth)} ETH 和Gas费 ${formatEther(quoteDetails.fees.gasFeeEth)} ETH，这部分费用是在交易执行时单独收取的，不从转账金额中扣除`);
        console.log(`钱包需要有足够的ETH支付: 转账金额(${quoteDetails.sentAmount} ETH) + 中继费(${formatEther(quoteDetails.fees.relayerFeeEth)} ETH) + Gas费(${formatEther(quoteDetails.fees.gasFeeEth)} ETH)`);
      } else {
        // 非全额模式下，检查余额是否足够 (金额 + Gas费 + 中继费)
        if (walletInfo.balance < quoteDetails.fees.totalRequiredBigInt) {
          const errorMsg = `余额不足！需要至少 ${quoteDetails.fees.totalRequiredEth} ETH，但当前只有 ${walletInfo.balanceInEth} ETH`;
          console.error(errorMsg);
          throw WalletException.transactionFailed('余额不足', {
            walletInfo: params,
            message: errorMsg
          });
        }
      }
      
      console.log("\n✅ 费用在可接受范围内且余额充足，开始执行交易");
      
      // 执行跨链交易
      const executionClient = getClient();
   
      const result = await executionClient.actions.execute({
        quote: quoteDetails.quote,
        wallet: walletInfo.walletClient,
        onProgress: (data: any) => {
          const { steps, fees, currentStep, currentStepItem } = data;
          if (currentStep) {
            console.log("\n当前步骤:", currentStep.action);
            if (currentStepItem) {
              console.log("步骤详情:", currentStepItem);
            }
          } else {
            console.log("交易进行中...");
          }
        }
      });
      
      console.log("\n✅ 交易成功执行!");
      
      // 提取交易的基本信息
      const stepInfos = result.steps.map(step => ({
        action: step.action,
        description: step.description,
        kind: step.kind,
      }));
      
      return {
        success: true,
        data: {
          fromChainId,
          toChainId,
          amount: useFullAmount ? quoteDetails.sentAmount : amount,
          amountOut: quoteDetails.details.amountOut,
          status: 'confirmed',
          gasFeeEth: formatEther(quoteDetails.fees.gasFeeEth),
          relayerFeeEth: formatEther(quoteDetails.fees.relayerFeeEth),
          relayerFeePercentage: quoteDetails.fees.relayerFeePercentage,
          totalFeeEth: formatEther(quoteDetails.fees.gasFeeEth + quoteDetails.fees.relayerFeeEth),
          estimatedTimeInMinutes: quoteDetails.details.estimatedTime,
          useFullAmount,
          walletBalance: walletInfo.balanceInEth,
          gasReserveForFullAmount: quoteDetails.gasReserveForFullAmount,
          usingFullBalanceWithoutReserve: quoteDetails.usingFullBalanceWithoutReserve,
          steps: stepInfos
        }
      };
    } catch (error) {
      console.error('桥接交易失败:', error);
      
      // 提供详细的错误信息
      const errorMessage = error.message || 'Unknown error';
      let detailedError = `桥接任务执行失败: ${errorMessage}`;
      
      if (error.code === 'CALL_EXCEPTION') {
        detailedError += `. 智能合约调用异常，可能是因为金额不足或者合约方法调用无效。`;
      } else if (error.code === 'INSUFFICIENT_FUNDS' || errorMessage.includes('insufficient funds')) {
        // 分析错误中的余额和费用信息
        const balanceMatch = errorMessage.match(/balance: (\d+)/);
        const feeMatch = errorMessage.match(/fee: (\d+)/);
        const valueMatch = errorMessage.match(/value: (\d+)/);
        
        if (balanceMatch && feeMatch && valueMatch) {
          const balance = BigInt(balanceMatch[1]);
          const fee = BigInt(feeMatch[1]);
          const value = BigInt(valueMatch[1]);
          
          const formattedBalance = formatEther(balance);
          const formattedFee = formatEther(fee);
          const formattedValue = formatEther(value);
          
          detailedError = `钱包ETH余额不足以支付gas费和转账金额。账户余额: ${formattedBalance} ETH, 需要的gas费: ${formattedFee} ETH, 转账金额: ${formattedValue} ETH, 总需要: ${formatEther(fee + value)} ETH`;
          console.log(`\n详细错误分析:\n余额: ${formattedBalance} ETH\nGas费: ${formattedFee} ETH\n转账金额: ${formattedValue} ETH\n总需求: ${formatEther(fee + value)} ETH\n差额: ${formatEther((fee + value) - balance)} ETH`);
        } else {
          // 处理余额不足的情况
          if (useFullAmount) {
            detailedError = `钱包ETH余额不足以支付gas费。预留的gas费(${FIXED_GAS_RESERVE_ETH} ETH)可能不足以支付实际所需的gas费，请增加预留金额或确保钱包有足够余额。`;
          } else {
            detailedError = `钱包余额不足，请确保有足够的ETH支付交易金额和Gas费用。当前余额：${walletInfo ? walletInfo.balanceInEth : '未知'} ETH。`;
          }
        }
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        detailedError += `. 无法预测Gas限制，可能是合约调用参数无效。`;
      } else if (errorMessage.includes('gas') && errorMessage.includes('value')) {
        // 处理gas+value相关错误
        detailedError = `交易失败：在支付gas费用后没有足够的ETH进行转账。当前钱包余额(${walletInfo.balanceInEth} ETH)过低，无法同时支付转账金额和gas费用。`;
      } else if (error.rawError) {
        detailedError += `. 原始错误: ${JSON.stringify(error.rawError)}`;
      }
      
      throw WalletException.transactionFailed('桥接交易失败', {
        walletInfo: params,
        message: detailedError
      });
    }
  }
}