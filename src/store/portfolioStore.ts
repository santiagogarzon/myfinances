import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset, AssetType, PortfolioState } from '../types';
import { fetchAssetPrice, fetchExchangeRate } from '../services/api';

const STORAGE_KEY = '@portfolio_assets';

export const usePortfolioStore = create<PortfolioState & {
  addAsset: (symbol: string, quantity: number, type: AssetType, currency?: string) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  updatePrices: () => Promise<void>;
  loadAssets: () => Promise<void>;
}>((set, get) => ({
  assets: [],
  totalValue: 0,
  isLoading: false,
  error: null,

  addAsset: async (symbol: string, quantity: number, type: AssetType, currency?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      let priceData;
      if (type === 'cash') {
        // For cash, symbol is the currency code, and quantity is the amount.
        // We fetch the exchange rate to USD as the 'price'.
        if (!currency) throw new Error('Currency is required for cash assets');
        priceData = await fetchExchangeRate(currency);
      } else {
        priceData = await fetchAssetPrice(symbol, type);
      }

      const newAsset: Asset = {
        id: `${symbol}-${Date.now()}`,
        symbol,
        name: type === 'cash' ? `${quantity} ${currency?.toUpperCase()}` : symbol,
        type,
        quantity,
        currentPrice: priceData.price,
        lastUpdated: priceData.lastUpdated,
        currency: type === 'cash' ? currency?.toUpperCase() : undefined,
      };

      // Update local state and storage
      const updatedAssets = [...get().assets, newAsset];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAssets));
      
      // Recalculate total value in USD
      const totalValueUSD = updatedAssets.reduce((sum, asset) => {
        if (asset.type === 'cash') {
          // For cash, currentPrice is the exchange rate to USD
          return sum + (asset.quantity * asset.currentPrice);
        } else {
          // For other asset types, currentPrice is already in USD
          return sum + (asset.quantity * asset.currentPrice);
        }
      }, 0);

      set((state) => ({
        assets: updatedAssets,
        totalValue: totalValueUSD,
        isLoading: false,
      }));
    } catch (error) {
      console.error('addAsset - Error:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  removeAsset: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      // Update local state and storage
      const updatedAssets = get().assets.filter(asset => asset.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAssets));
      
      // Recalculate total value in USD
      const totalValueUSD = updatedAssets.reduce((sum, asset) => {
        if (asset.type === 'cash') {
          return sum + (asset.quantity * asset.currentPrice);
        } else {
          return sum + (asset.quantity * asset.currentPrice);
        }
      }, 0);

      set((state) => ({
        assets: updatedAssets,
        totalValue: totalValueUSD,
        isLoading: false,
      }));
    } catch (error) {
      console.error('removeAsset - Error:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updatePrices: async () => {
    try {
      set({ isLoading: true, error: null });
      const assets = get().assets;
      
      // Update prices for all assets in parallel
      const updatedAssets = await Promise.all(
        assets.map(async (asset) => {
          try {
             if (asset.type === 'cash' && asset.currency) {
                // Fetch updated exchange rate for cash
                const priceData = await fetchExchangeRate(asset.currency);
                 return {
                  ...asset,
                  currentPrice: priceData.price, // This is the new exchange rate
                  lastUpdated: priceData.lastUpdated,
                };
            } else if (asset.type !== 'cash') {
              // Fetch updated price for stock/crypto/etf
              const priceData = await fetchAssetPrice(asset.symbol, asset.type);
              return {
                ...asset,
                currentPrice: priceData.price,
                lastUpdated: priceData.lastUpdated,
              };
            }
            return asset; // Return asset as is if it's cash without currency or type is cash and cannot fetch price
          } catch (error) {
            console.warn(`Failed to update price for ${asset.symbol} (${asset.type}):`, error);
            return asset; // Keep the old price if update fails
          }
        })
      );

      // Update local storage and state
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAssets));
      
       // Recalculate total value in USD
      const totalValueUSD = updatedAssets.reduce((sum, asset) => {
         if (asset.type === 'cash') {
            return sum + (asset.quantity * asset.currentPrice);
          } else {
            return sum + (asset.quantity * asset.currentPrice);
          }
      }, 0);

      set((state) => ({
        assets: updatedAssets,
        totalValue: totalValueUSD,
        isLoading: false,
      }));
    } catch (error) {
      console.error('updatePrices - Error:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  loadAssets: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const storedAssets = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedAssets) {
        const assets = JSON.parse(storedAssets) as Asset[];
        
        // Recalculate total value in USD after loading
        const totalValueUSD = assets.reduce((sum, asset) => {
           if (asset.type === 'cash') {
              return sum + (asset.quantity * asset.currentPrice);
            } else {
              return sum + (asset.quantity * asset.currentPrice);
            }
        }, 0);

        set((state) => ({
          assets,
          totalValue: totalValueUSD,
          isLoading: false,
        }));
      } else {
        set({ assets: [], totalValue: 0, isLoading: false });
      }
    } catch (error) {
      console.error('loadAssets - Error:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },
})); 