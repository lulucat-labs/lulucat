import axios from 'axios';
import CryptoJS from 'crypto-js';
import { WalletException } from '@lulucat/exceptions';

interface CurrencyInfo {
  ccy: string;
  chain: string;
}

interface GetCurrenciesResult {
  success: boolean;
  data?: CurrencyInfo[];
  error?: string;
}

/**
 * 通过OKX API获取币种支持的链
 */
export class GetCurrencyChain {
  private readonly OKXBaseUrl = 'https://www.okx.com';

  /**
   * 通过OKX API获取币种支持的链
   * @param currency 币种名称, 如 'BTC'.
   * @returns 币种支持的链信息
   */
  public async execute(currency: string = ''): Promise<GetCurrenciesResult> {
    const requestPath = currency ? `/api/v5/asset/currencies?ccy=${currency}` : '/api/v5/asset/currencies';
    const timestamp = new Date().toISOString();
    const signString = timestamp + 'GET' + requestPath;
    const signature = CryptoJS.HmacSHA256(signString, process.env.SECRET_KEY).toString(CryptoJS.enc.Base64);

    const headers = {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': process.env.API_KEY,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': process.env.PASSPHRASE
    };

    try {
      const response = await axios({
        method: 'GET',
        url: this.OKXBaseUrl + requestPath,
        headers: headers
      });

      const currencyData: CurrencyInfo[] = response.data.data?.map((item: any) => ({
        ccy: item.ccy,
        chain: item.chain
      })) || [];

      console.log('Fetched currencies:', currencyData);
      return {
        success: true,
        data: currencyData
      };
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
      throw WalletException.transactionFailed('获取币种支持的链失败', {
        message: `获取币种支持的链失败: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}
