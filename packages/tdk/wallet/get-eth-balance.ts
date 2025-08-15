import { createPublicClient, http, formatEther } from 'viem';
import { abstract, arbitrum, zksync } from 'viem/chains';

// Define the supported chains and their configurations
const chainConfigs = {
  arbitrum: {
    chain: arbitrum,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io'
  },
  abstract: {
    chain: abstract,
    name: 'Abstract',
    rpcUrl: 'https://api.mainnet.abs.xyz',
    explorer: 'https://abscan.org'
  },
  zksync: {
    chain: zksync,
    name: 'ZKsync Era',
    rpcUrl: 'https://mainnet.era.zksync.io',
    explorer: 'https://explorer.zksync.io'
  }
};

/**
 * Get ETH balance for a wallet address across specified chains
 * @param walletAddress - The wallet address to check balances for
 * @param chains - Optional. Array of chain names to check ('arbitrum', 'abstract', 'zksync'). If not provided, checks all chains.
 * @returns Object with chain names as keys and balance info as values
 */
export const getEthBalance = async (
  walletAddress: string,
  chains: string[] = ['arbitrum', 'abstract', 'zksync']
): Promise<{
  address: string;
  balances: Record<string, any>;
  totalBalance: number;
  errors?: Record<string, string>;
  timestamp: string;
}> => {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  // Filter out unsupported chains
  const validChains = chains.filter(chain => chainConfigs[chain.toLowerCase()]);
  
  if (validChains.length === 0) {
    throw new Error('No valid chains specified. Supported chains: arbitrum, abstract, zksync');
  }

  const balances: Record<string, any> = {};
  const errors: Record<string, string> = {};

  // Query balances for each chain in parallel
  await Promise.all(
    validChains.map(async (chainName) => {
      const chainConfig = chainConfigs[chainName.toLowerCase()];
      
      try {
        // Create a public client for this chain
        const publicClient = createPublicClient({
          chain: chainConfig.chain,
          transport: http(chainConfig.rpcUrl)
        });

        // Query the balance
        const balance = await publicClient.getBalance({
          address: walletAddress as `0x${string}`
        });

        // Format and store the result
        balances[chainName] = {
          chain: chainConfig.name,
          balanceWei: balance.toString(),
          balanceEth: formatEther(balance),
          explorer: `${chainConfig.explorer}/address/${walletAddress}`
        };
      } catch (error) {
        errors[chainName] = (error as Error).message;
      }
    })
  );

  // Calculate total balance
  const totalBalance = Object.values(balances).reduce(
    (sum, balance) => sum + parseFloat(balance.balanceEth), 
    0
  );

  return {
    address: walletAddress,
    balances,
    totalBalance,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    timestamp: new Date().toISOString()
  };
};

/**
 * Get ETH balance for a wallet address on a single chain
 * @param walletAddress - The wallet address to check balance for
 * @param chain - The chain to check ('arbitrum', 'abstract', or 'zksync')
 * @returns Object with balance information
 */
export const getSingleChainBalance = async (
  walletAddress: string,
  chain: string
): Promise<{
  address: string;
  chain: string;
  balanceWei: string;
  balanceEth: string;
  explorer: string;
  error?: string;
  timestamp: string;
}> => {
  const result = await getEthBalance(walletAddress, [chain]);
  return {
    address: walletAddress,
    ...result.balances[chain],
    error: result.errors ? result.errors[chain] : undefined,
    timestamp: result.timestamp
  };
};

/**
 * Summarizes and provides statistics for ETH balance results
 * @param balanceResult - The result from getEthBalance function
 * @returns Summary statistics and formatted output
 */
export const summarizeBalances = (
  balanceResult: {
    address: string;
    balances: Record<string, any>;
    timestamp: string;
  }
): {
  address: string;
  totalBalance: string;
  highestBalance?: {
    chain: string;
    balance: string;
    percentage: string;
  };
  balanceDistribution: Record<string, {
    balance: string;
    percentage: string;
  }>;
  allBalances: Record<string, any>;
  timestamp: string;
} => {
  if (!balanceResult || !balanceResult.balances) {
    throw new Error('Invalid balance result provided');
  }

  const { address, balances, timestamp } = balanceResult;
  const chainsWithBalance = Object.keys(balances);
  
  if (chainsWithBalance.length === 0) {
    return {
      address,
      totalBalance: '0',
      balanceDistribution: {},
      allBalances: {},
      timestamp
    };
  }

  // Calculate total balance in ETH
  let totalBalanceEth = 0;
  let highestBalanceChain = chainsWithBalance[0];
  let highestBalanceAmount = parseFloat(balances[highestBalanceChain].balanceEth);

  const balanceDetails = chainsWithBalance.map(chain => {
    const { balanceEth, chain: chainName } = balances[chain];
    const balanceFloat = parseFloat(balanceEth);
    
    // Track highest balance
    if (balanceFloat > highestBalanceAmount) {
      highestBalanceChain = chain;
      highestBalanceAmount = balanceFloat;
    }
    
    totalBalanceEth += balanceFloat;
    
    return {
      chain: chainName,
      balance: balanceEth,
      balanceFloat
    };
  });

  // Calculate percentage distribution
  const balanceDistribution: Record<string, { balance: string; percentage: string }> = {};
  balanceDetails.forEach(detail => {
    const percentage = totalBalanceEth > 0 
      ? (detail.balanceFloat / totalBalanceEth * 100).toFixed(2)
      : '0.00';
    
    balanceDistribution[detail.chain] = {
      balance: detail.balance,
      percentage: `${percentage}%`
    };
  });

  // Format the total balance to match the precision of individual balances
  const totalBalanceFormatted = totalBalanceEth.toString();

  return {
    address,
    totalBalance: totalBalanceFormatted,
    highestBalance: {
      chain: balances[highestBalanceChain].chain,
      balance: balances[highestBalanceChain].balanceEth,
      percentage: (parseFloat(balances[highestBalanceChain].balanceEth) / totalBalanceEth * 100).toFixed(2) + '%'
    },
    balanceDistribution,
    allBalances: balances,
    timestamp
  };
}; 