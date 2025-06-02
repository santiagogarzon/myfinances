export type AssetType = 'stock' | 'etf' | 'crypto' | 'cash';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  currentPrice: number;
  buyPrice: number;
  lastUpdated: string;
  currency?: string;
  description?: string;
}

export interface PortfolioState {
  assets: Asset[];
  totalValue: number;
  isLoading: boolean;
  error: string | null;
}

export interface AddAssetFormData {
  symbol: string;
  quantity: string;
  type: AssetType;
  currency?: string;
  description?: string;
  buyPrice: string;
}

export interface PriceData {
  symbol: string;
  price: number;
  lastUpdated: string;
} 