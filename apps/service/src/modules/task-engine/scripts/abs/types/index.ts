export interface Wallet {
  readonly privateKey: string;
  readonly address: string;
}

export interface TaskStatus {
  // 认证 X
  readonly authX: boolean;
  // 认证 Discord
  readonly authDiscord: boolean;
  // 注册 ABS
  readonly registerABS: boolean;
  // ABS 到 ABS ETH 交换
  readonly absToAbsETHSwap: boolean;
  // 到 OKX 兑换
  readonly exchangeToOkx: boolean;
  // ZK桥接 ABS
  readonly zKBridgeABS: boolean;
  // OKX 转移到 ABS
  readonly evmTransferABS: boolean;
  // Discover 投票
  readonly discoverVote?: boolean;
}

export interface DBItem {
  // 钱包地址
  readonly id: string;
  readonly wallet: Wallet;
  // X token
  readonly xToken?: string;
  // Discord token
  readonly discordToken?: string;
  // ABS 钱包
  readonly absWallet: Wallet;
  // 任务状态
  readonly tasks: TaskStatus;
}

export interface AbsTaskResult {
  id: string;
  wallet: {
    privateKey: string;
    address: string;
  };
  xToken: string;
  discordToken: string;
  absWallet: {
    privateKey: string;
    address: string;
  };
  tasks: {
    registerABS: boolean;
    exchangeToOkx: boolean;
    zKBridgeABS: boolean;
    evmTransferABS: boolean;
    absToAbsETHSwap: boolean;
    authX: boolean;
    authDiscord: boolean;
    discoverVote: boolean;
  };
}
