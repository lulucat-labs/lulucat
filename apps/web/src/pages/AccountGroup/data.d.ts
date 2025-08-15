export interface AccountGroup {
  id: number;
  name: string;
  items: AccountGroupItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AccountGroupItem {
  id: number;
  accountGroupId: number;
  discordAccountId: number | null;
  emailAccountId: number | null;
  evmWalletId: number | null;
  twitterAccountId: number | null;
  proxyIpId: number | null;
  browserFingerprintId: number | null;
  discordAccount?: {
    id: number;
    username: string;
    status?: string;
  };
  emailAccount?: {
    id: number;
    emailAddress: string;
    status?: string;
  };
  evmWallet?: {
    id: number;
    walletAddress: string;
    status?: string;
  };
  twitterAccount?: {
    id: number;
    username: string;
    status?: string;
  };
  proxyIp?: {
    [x: string]: ReactNode;
    id: number;
    ipAddress: string;
    status?: string;
  };
  browserFingerprint?: {
    id: number;
    userAgent: string;
    status?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AccountGroupFormData {
  name: string;
  items: AccountGroupItemFormData[];
}

export interface AccountGroupItemFormData {
  id?: number;
  discordAccountId?: number;
  emailAccountId?: number;
  evmWalletId?: number;
  twitterAccountId?: number;
  proxyIpId?: number;
  browserFingerprintId?: number;
}

export interface IdRangeDto {
  start: number;
  end: number;
}

export interface CreateAccountGroupByRangeDto {
  name: string;
  discordAccountRange?: IdRangeDto;
  emailAccountRange?: IdRangeDto;
  evmWalletRange?: IdRangeDto;
  twitterAccountRange?: IdRangeDto;
}

export enum AccountType {
  TWITTER = 'twitter',
  DISCORD = 'discord',
  EMAIL = 'email',
  WALLET = 'wallet',
  IP = 'ip',
  BROWSER_FINGERPRINT = 'browserFingerprint',
}

export interface CreateQuickAccountGroupDto {
  name: string;
  count: number;
  accountTypes: AccountType[];
  excludeAssociated?: boolean;
  excludeInvalid?: boolean;
}
