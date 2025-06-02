import axios from 'axios';
import { AssetType, PriceData } from '../types';
import { ApiCache, withRetry } from '../utils/apiCache';

const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const OPEN_EXCHANGE_RATES_API = 'https://openexchangerates.org/api/';
const apiCache = ApiCache.getInstance();

// Map of common crypto symbols to CoinGecko IDs
const CRYPTO_ID_MAP: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'USDC': 'usd-coin',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'DOGE': 'dogecoin',
  // Add more mappings as needed
};

export const fetchStockPrice = async (symbol: string): Promise<PriceData> => {
  const cacheKey = `stock_${symbol}`;
  
  // Try to get from cache first
  const cachedData = await apiCache.get<PriceData>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const priceData = await withRetry(async () => {
      const response = await axios.get(`${YAHOO_FINANCE_API}${symbol}`);
      const price = response.data.chart.result[0].meta.regularMarketPrice;
      return {
        symbol,
        price,
        lastUpdated: new Date().toISOString(),
      };
    });

    // Cache the result
    await apiCache.set(cacheKey, priceData);
    return priceData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch stock price for ${symbol}: ${error.message}`);
    }
    throw error;
  }
};

export const fetchCryptoPrice = async (symbol: string): Promise<PriceData> => {
  const coinId = CRYPTO_ID_MAP[symbol.toUpperCase()];
  if (!coinId) {
    throw new Error(`Unsupported cryptocurrency symbol: ${symbol}`);
  }

  const cacheKey = `crypto_${coinId}`;
  
  // Try to get from cache first
  const cachedData = await apiCache.get<PriceData>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const priceData = await withRetry(async () => {
      const response = await axios.get(`${COINGECKO_API}?ids=${coinId}&vs_currencies=usd`);
      const price = response.data[coinId].usd;
      return {
        symbol,
        price,
        lastUpdated: new Date().toISOString(),
      };
    });

    // Cache the result
    await apiCache.set(cacheKey, priceData);
    return priceData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Failed to fetch crypto price for ${symbol}: ${error.message}`);
    }
    throw error;
  }
};

// Function to fetch exchange rate for a currency against USD
export const fetchExchangeRate = async (currency: string): Promise<PriceData> => {
  console.log('API: Calling fetchExchangeRate for currency:', currency);
  const APP_ID = '17f1dce8c68f4890953bc8cb4082da5c'; // Your OpenExchangeRates App ID
  const baseCurrency = 'USD';

  // If the currency is USD, the exchange rate to USD is 1
  if (currency.toUpperCase() === baseCurrency) {
    return {
      symbol: currency,
      price: 1,
      lastUpdated: new Date().toISOString(),
    };
  }

  const cacheKey = `exchange_rate_${currency}_to_${baseCurrency}`;

  // Try to get from cache first
  const cachedData = await apiCache.get<PriceData>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const priceData = await withRetry(async () => {
      const response = await axios.get(
        `${OPEN_EXCHANGE_RATES_API}latest.json?app_id=${APP_ID}&symbols=${currency}&base=${baseCurrency}`
      );

      // OpenExchangeRates returns rates relative to the base currency.
      // The rate for the requested currency is directly in the rates object.
      const rate = response.data.rates[currency.toUpperCase()];

      if (rate === undefined) {
        throw new Error(`Exchange rate not found for ${currency}`);
      }

      console.log('API: fetchExchangeRate success for', currency, 'rate:', rate);
      return {
        symbol: currency,
        price: 1 / rate, // We want rate FROM currency TO USD
        lastUpdated: new Date().toISOString(),
      };
    });

    // Cache the result
    await apiCache.set(cacheKey, priceData);
    return priceData;
  } catch (error) {
    console.error('API: Error fetching exchange rate for', currency, error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch exchange rate for ${currency}: ${error.message}`);
    }
    throw error;
  }
};

export const fetchAssetPrice = async (symbol: string, type: AssetType): Promise<PriceData> => {
  if (type === 'crypto') {
    return fetchCryptoPrice(symbol);
  } else if (type === 'cash') {
    // For cash, the price is the exchange rate to USD
    return fetchExchangeRate(symbol);
  }
  return fetchStockPrice(symbol);
};

// Function to clear the cache (useful for testing or when you need fresh data)
export const clearPriceCache = async () => {
  await apiCache.clear();
}; 