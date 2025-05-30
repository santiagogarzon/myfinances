import { AssetType } from '../types';

// Common stock symbols and their names
const STOCK_SYMBOLS: { [key: string]: string } = {
  // Technology
  'AAPL': 'Apple Inc.',
  'MSFT': 'Microsoft Corporation',
  'GOOGL': 'Alphabet Inc.',
  'AMZN': 'Amazon.com Inc.',
  'META': 'Meta Platforms Inc.',
  'TSLA': 'Tesla Inc.',
  'NVDA': 'NVIDIA Corporation',
  'AMD': 'Advanced Micro Devices Inc.',
  'INTC': 'Intel Corporation',
  'CRM': 'Salesforce Inc.',
  'ADBE': 'Adobe Inc.',
  'CSCO': 'Cisco Systems Inc.',
  'ORCL': 'Oracle Corporation',
  'IBM': 'International Business Machines Corp.',
  'QCOM': 'Qualcomm Inc.',
  'AVGO': 'Broadcom Inc.',
  'TXN': 'Texas Instruments Inc.',
  'MU': 'Micron Technology Inc.',
  'NOW': 'ServiceNow Inc.',
  'PYPL': 'PayPal Holdings Inc.',

  // Finance
  'JPM': 'JPMorgan Chase & Co.',
  'BAC': 'Bank of America Corp.',
  'WFC': 'Wells Fargo & Co.',
  'GS': 'The Goldman Sachs Group Inc.',
  'MS': 'Morgan Stanley',
  'SCHW': 'Charles Schwab Corp.',
  'AXP': 'American Express Co.',
  'V': 'Visa Inc.',
  'MA': 'Mastercard Inc.',
  'BLK': 'BlackRock Inc.',
  'C': 'Citigroup Inc.',
  'USB': 'U.S. Bancorp',
  'PNC': 'PNC Financial Services Group Inc.',
  'COF': 'Capital One Financial Corp.',
  'TFC': 'Truist Financial Corp.',

  // Healthcare
  'JNJ': 'Johnson & Johnson',
  'PFE': 'Pfizer Inc.',
  'MRK': 'Merck & Co. Inc.',
  'ABBV': 'AbbVie Inc.',
  'LLY': 'Eli Lilly and Co.',
  'UNH': 'UnitedHealth Group Inc.',
  'CVS': 'CVS Health Corp.',
  'ABT': 'Abbott Laboratories',
  'TMO': 'Thermo Fisher Scientific Inc.',
  'DHR': 'Danaher Corp.',
  'BMY': 'Bristol Myers Squibb Co.',
  'AMGN': 'Amgen Inc.',
  'GILD': 'Gilead Sciences Inc.',
  'ISRG': 'Intuitive Surgical Inc.',
  'REGN': 'Regeneron Pharmaceuticals Inc.',

  // Consumer
  'WMT': 'Walmart Inc.',
  'TGT': 'Target Corporation',
  'COST': 'Costco Wholesale Corporation',
  'HD': 'Home Depot Inc.',
  'LOW': 'Lowe\'s Companies Inc.',
  'SBUX': 'Starbucks Corporation',
  'MCD': 'McDonald\'s Corporation',
  'NKE': 'Nike Inc.',
  'DIS': 'The Walt Disney Company',
  'NFLX': 'Netflix Inc.',
  'KO': 'The Coca-Cola Company',
  'PEP': 'PepsiCo Inc.',
  'PG': 'Procter & Gamble Co.',

  // Energy
  'XOM': 'Exxon Mobil Corporation',
  'CVX': 'Chevron Corporation',
  'COP': 'ConocoPhillips',
  'EOG': 'EOG Resources Inc.',
  'PXD': 'Pioneer Natural Resources Co.',
  'SLB': 'Schlumberger Ltd.',
  'HAL': 'Halliburton Company',
  'MPC': 'Marathon Petroleum Corp.',
  'VLO': 'Valero Energy Corporation',
  'PSX': 'Phillips 66',

  // Industrial
  'BA': 'The Boeing Company',
  'CAT': 'Caterpillar Inc.',
  'GE': 'General Electric Company',
  'HON': 'Honeywell International Inc.',
  'MMM': '3M Company',
  'UPS': 'United Parcel Service Inc.',
  'FDX': 'FedEx Corporation',
  'DE': 'Deere & Company',
  'LMT': 'Lockheed Martin Corporation',
  'RTX': 'Raytheon Technologies Corp.',

  // Communication Services
  'T': 'AT&T Inc.',
  'VZ': 'Verizon Communications Inc.',
  'CMCSA': 'Comcast Corporation',
  'CHTR': 'Charter Communications Inc.',
  'TMUS': 'T-Mobile US Inc.',
  'DISH': 'DISH Network Corporation',
  'PARA': 'Paramount Global',
  'FOX': 'Fox Corporation',
  'NWSA': 'News Corporation',
  'IPG': 'The Interpublic Group of Companies Inc.',

  // Materials
  'LIN': 'Linde plc',
  'ECL': 'Ecolab Inc.',
  'APD': 'Air Products and Chemicals Inc.',
  'NEM': 'Newmont Corporation',
  'FCX': 'Freeport-McMoRan Inc.',
  'NUE': 'Nucor Corporation',
  'BLL': 'Ball Corporation',
  'ALB': 'Albemarle Corporation',
  'IFF': 'International Flavors & Fragrances Inc.',
  'SHW': 'The Sherwin-Williams Company',

  // Real Estate
  'AMT': 'American Tower Corporation',
  'CCI': 'Crown Castle International Corp.',
  'PLD': 'Prologis Inc.',
  'WELL': 'Welltower Inc.',
  'EQR': 'Equity Residential',
  'AVB': 'AvalonBay Communities Inc.',
  'MAA': 'Mid-America Apartment Communities Inc.',
  'PSA': 'Public Storage',
  'O': 'Realty Income Corporation',
  'SPG': 'Simon Property Group Inc.'
};

// Common ETF symbols and their names
const ETF_SYMBOLS: { [key: string]: string } = {
  // Schwab ETFs
  'SCHB': 'Schwab U.S. Broad Market ETF',
  'SCHX': 'Schwab U.S. Large-Cap ETF',
  'SCHM': 'Schwab U.S. Mid-Cap ETF',
  'SCHA': 'Schwab U.S. Small-Cap ETF',
  'SCHF': 'Schwab International Equity ETF',
  'SCHC': 'Schwab International Small-Cap Equity ETF',
  'SCHE': 'Schwab Emerging Markets Equity ETF',
  'SCHD': 'Schwab U.S. Dividend Equity ETF',
  'SCHG': 'Schwab U.S. Large-Cap Growth ETF',
  'SCHV': 'Schwab U.S. Large-Cap Value ETF',
  'SCHH': 'Schwab U.S. REIT ETF',
  'SCHP': 'Schwab U.S. TIPS ETF',
  'SCHR': 'Schwab Intermediate-Term U.S. Treasury ETF',
  'SCHZ': 'Schwab U.S. Aggregate Bond ETF',
  'SCHY': 'Schwab International Dividend Equity ETF',

  // Vanguard ETFs
  'VTI': 'Vanguard Total Stock Market ETF',
  'VOO': 'Vanguard S&P 500 ETF',
  'VEA': 'Vanguard FTSE Developed Markets ETF',
  'VWO': 'Vanguard FTSE Emerging Markets ETF',
  'VUG': 'Vanguard Growth ETF',
  'VTV': 'Vanguard Value ETF',
  'VYM': 'Vanguard High Dividend Yield ETF',
  'VGT': 'Vanguard Information Technology ETF',
  'VHT': 'Vanguard Health Care ETF',
  'VFH': 'Vanguard Financials ETF',
  'VNQ': 'Vanguard Real Estate ETF',
  'BND': 'Vanguard Total Bond Market ETF',
  'VXUS': 'Vanguard Total International Stock ETF',
  'VGK': 'Vanguard FTSE Europe ETF',
  'VPL': 'Vanguard FTSE Pacific ETF',
  'VCR': 'Vanguard Consumer Discretionary ETF',
  'VDC': 'Vanguard Consumer Staples ETF',
  'VDE': 'Vanguard Energy ETF',
  'VIOO': 'Vanguard S&P Small-Cap 600 ETF',
  'VO': 'Vanguard Mid-Cap ETF',
  'VV': 'Vanguard Large-Cap ETF',
  'VXF': 'Vanguard Extended Market ETF',

  // iShares ETFs
  'IVV': 'iShares Core S&P 500 ETF',
  'IJH': 'iShares Core S&P Mid-Cap ETF',
  'IJR': 'iShares Core S&P Small-Cap ETF',
  'EFA': 'iShares MSCI EAFE ETF',
  'EEM': 'iShares MSCI Emerging Markets ETF',
  'AGG': 'iShares Core U.S. Aggregate Bond ETF',
  'IEFA': 'iShares Core MSCI EAFE ETF',
  'IEMG': 'iShares Core MSCI Emerging Markets ETF',
  'IWM': 'iShares Russell 2000 ETF',
  'IWB': 'iShares Russell 1000 ETF',
  'IWD': 'iShares Russell 1000 Value ETF',
  'IWF': 'iShares Russell 1000 Growth ETF',
  'IYR': 'iShares U.S. Real Estate ETF',
  'TLT': 'iShares 20+ Year Treasury Bond ETF',
  'LQD': 'iShares iBoxx $ Investment Grade Corporate Bond ETF',

  // SPDR ETFs
  'SPY': 'SPDR S&P 500 ETF',
  'QQQ': 'Invesco QQQ Trust',
  'DIA': 'SPDR Dow Jones Industrial Average ETF',
  'MDY': 'SPDR S&P MidCap 400 ETF',
  'GLD': 'SPDR Gold Shares',
  'XLE': 'Energy Select Sector SPDR Fund',
  'XLF': 'Financial Select Sector SPDR Fund',
  'XLK': 'Technology Select Sector SPDR Fund',
  'XLV': 'Health Care Select Sector SPDR Fund',
  'XLI': 'Industrial Select Sector SPDR Fund',
  'XLP': 'Consumer Staples Select Sector SPDR Fund',
  'XLY': 'Consumer Discretionary Select Sector SPDR Fund',
  'XLB': 'Materials Select Sector SPDR Fund',
  'XLU': 'Utilities Select Sector SPDR Fund',
  'XLRE': 'Real Estate Select Sector SPDR Fund',

  // ARK ETFs
  'ARKK': 'ARK Innovation ETF',
  'ARKW': 'ARK Next Generation Internet ETF',
  'ARKG': 'ARK Genomic Revolution ETF',
  'ARKF': 'ARK Fintech Innovation ETF',
  'ARKQ': 'ARK Autonomous Technology & Robotics ETF'
};

// Crypto symbols and their names (using CoinGecko IDs as keys)
const CRYPTO_SYMBOLS: { [key: string]: string } = {
  // Major Cryptocurrencies
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'USDT': 'Tether',
  'BNB': 'Binance Coin',
  'SOL': 'Solana',
  'XRP': 'Ripple',
  'USDC': 'USD Coin',
  'ADA': 'Cardano',
  'AVAX': 'Avalanche',
  'DOGE': 'Dogecoin',
  'DOT': 'Polkadot',
  'MATIC': 'Polygon',
  'LINK': 'Chainlink',
  'SHIB': 'Shiba Inu',
  'UNI': 'Uniswap',
  'LTC': 'Litecoin',
  'ATOM': 'Cosmos',
  'XLM': 'Stellar',
  'ALGO': 'Algorand',
  'FIL': 'Filecoin',
  'VET': 'VeChain',
  'MANA': 'Decentraland',
  'SAND': 'The Sandbox',
  'AXS': 'Axie Infinity',
  'GALA': 'Gala',
  'ENJ': 'Enjin Coin',
  'CHZ': 'Chiliz',
  'NEAR': 'NEAR Protocol',
  'FTM': 'Fantom',
  'ONE': 'Harmony',
  'EOS': 'EOS',
  'XTZ': 'Tezos',
  'AAVE': 'Aave',
  'MKR': 'Maker',
  'COMP': 'Compound',
  'SNX': 'Synthetix',
  'YFI': 'yearn.finance',
  'ZIL': 'Zilliqa',
  'BAT': 'Basic Attention Token',
  'GRT': 'The Graph',
  'OCEAN': 'Ocean Protocol',
  'BAND': 'Band Protocol',
  'REN': 'Ren',
  'KSM': 'Kusama',
  'DASH': 'Dash',
  'ZEC': 'Zcash',
  'XMR': 'Monero',
  'NEO': 'Neo',
  'QTUM': 'Qtum',
  'ONT': 'Ontology'
};

// Common currency symbols and their names
const CURRENCY_SYMBOLS: { [key: string]: string } = {
  'USD': 'United States Dollar',
  'EUR': 'Euro',
  'GBP': 'British Pound',
  'JPY': 'Japanese Yen',
  'CAD': 'Canadian Dollar',
  'AUD': 'Australian Dollar',
  'CHF': 'Swiss Franc',
  'CNY': 'Chinese Yuan',
  'SEK': 'Swedish Krona',
  'NZD': 'New Zealand Dollar',
  'ARS': 'Argentine Peso',
  'BRL': 'Brazilian Real',
  'MXN': 'Mexican Peso',
  'COP': 'Colombian Peso',
  'CLP': 'Chilean Peso',
  'PEN': 'Peruvian Sol',
  'UYU': 'Uruguayan Peso',
  'PYG': 'Paraguayan Guarani',
  'BOB': 'Bolivian Boliviano',
  'VES': 'Venezuelan Bolívar',
  'GHS': 'Ghanaian Cedi',
  'NGN': 'Nigerian Naira',
  'ZAR': 'South African Rand',
  'EGP': 'Egyptian Pound',
  'KES': 'Kenyan Shilling',
  'MAD': 'Moroccan Dirham',
  'XOF': 'West African CFA franc',
  'XAF': 'Central African CFA franc',
};

// Combined symbols for autocomplete
export const ALL_SYMBOLS = {
  ...STOCK_SYMBOLS,
  ...ETF_SYMBOLS,
  ...CRYPTO_SYMBOLS,
  ...CURRENCY_SYMBOLS,
};

interface AssetSuggestion {
  symbol: string;
  name: string;
  type: AssetType;
}

// Helper to determine asset type based on symbol
export function detectAssetType(symbol: string): AssetType {
  if (STOCK_SYMBOLS[symbol]) return 'stock';
  if (ETF_SYMBOLS[symbol]) return 'etf';
  if (CRYPTO_SYMBOLS[symbol]) return 'crypto';
  if (CURRENCY_SYMBOLS[symbol]) return 'cash';
  return 'stock'; // Default to stock if type is unknown
}

export function getAssetSuggestions(input: string): Array<AssetSuggestion> {
  const lowerInput = input.toLowerCase();
  const suggestions: Array<AssetSuggestion> = [];

  // Helper to add suggestions from a symbol map
  const addSuggestions = (map: { [key: string]: string }, type: AssetType) => {
    Object.entries(map).forEach(([symbol, name]) => {
      if (symbol.toLowerCase().includes(lowerInput) || name.toLowerCase().includes(lowerInput)) {
        suggestions.push({ symbol, name, type });
      }
    });
  };

  // Add suggestions from all categories
  addSuggestions(STOCK_SYMBOLS, 'stock');
  addSuggestions(ETF_SYMBOLS, 'etf');
  addSuggestions(CRYPTO_SYMBOLS, 'crypto');
  addSuggestions(CURRENCY_SYMBOLS, 'cash');

  // Sort suggestions (basic sorting by symbol for now)
  suggestions.sort((a, b) => a.symbol.localeCompare(b.symbol));

  return suggestions;
}

// Helper to get asset name from symbol
export function getAssetName(symbol: string): string {
  return ALL_SYMBOLS[symbol] || symbol; // Return symbol if name not found
} 