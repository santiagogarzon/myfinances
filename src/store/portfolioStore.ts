import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset, AssetType } from '../types';
import { fetchAssetPrice, fetchExchangeRate } from '../services/api';
import { db } from '../config/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, getDocs, query, where, onSnapshot, DocumentData, limit } from 'firebase/firestore';
import { useAuthStore } from './authStore';

const STORAGE_KEY = '@portfolio_assets';

export interface PortfolioState {
  assets: Asset[];
  totalValue: number;
  totalGainLoss: number;
  isLoading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;
  cleanup: () => void;
  addAsset: (
    symbol: string,
    quantity: number,
    type: AssetType,
    buyPrice: number,
    currency?: string,
    description?: string
  ) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Omit<Asset, 'id' | 'currentPrice' | 'lastUpdated'>>) => Promise<void>;
  updatePrices: () => Promise<void>;
  loadAssets: () => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  assets: [],
  totalValue: 0,
  totalGainLoss: 0,
  isLoading: false,
  error: null,
  unsubscribe: null,

  cleanup: () => {
    const unsubscribe = get().unsubscribe;
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  },

  addAsset: async (symbol: string, quantity: number, type: AssetType, buyPrice: number, currency?: string, description?: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = useAuthStore.getState().user;
      
      if (!user) {
        console.error('addAsset: No user found - user must be logged in');
        throw new Error('User must be logged in to add assets');
      }

      let priceData;
      if (type === 'cash') {
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
        buyPrice,
        currentPrice: priceData.price,
        lastUpdated: priceData.lastUpdated,
        ...(currency && { currency }),
        ...(description && { description }),
      };

      try {
        // Save to Firestore with retry
        const assetRef = doc(db, 'users', user.uid, 'assets', newAsset.id);
        await setDoc(assetRef, newAsset as DocumentData);
      } catch (firestoreError) {
        console.error('addAsset: Firestore write error:', firestoreError);
        // Even if Firestore fails, update local state
        const updatedAssets = [...get().assets, newAsset];
        const totalValueUSD = calculateTotalValue(updatedAssets);
        const totalGainLoss = calculateTotalGainLoss(updatedAssets);

        set((state) => ({
          assets: updatedAssets,
          totalValue: totalValueUSD,
          totalGainLoss,
          isLoading: false,
          error: 'Asset added locally but failed to sync with cloud. Will retry later.'
        }));
        return;
      }

      // Update local state
      const updatedAssets = [...get().assets, newAsset];
      const totalValueUSD = calculateTotalValue(updatedAssets);
      const totalGainLoss = calculateTotalGainLoss(updatedAssets);

      set((state) => ({
        assets: updatedAssets,
        totalValue: totalValueUSD,
        totalGainLoss,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('addAsset - Error:', error);
      set({ 
        error: (error as Error).message, 
        isLoading: false 
      });
      throw error;
    }
  },

  removeAsset: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = useAuthStore.getState().user;
      
      if (!user) {
        console.error('removeAsset: No user found - user must be logged in');
        throw new Error('User must be logged in to remove assets');
      }

      try {
        // Delete from Firestore
        const assetRef = doc(db, 'users', user.uid, 'assets', id);
        await deleteDoc(assetRef);
      } catch (firestoreError) {
        console.error('removeAsset: Firestore delete error:', firestoreError);
        // Even if Firestore fails, update local state
        const updatedAssets = get().assets.filter(asset => asset.id !== id);
        const totalValueUSD = calculateTotalValue(updatedAssets);
        const totalGainLoss = calculateTotalGainLoss(updatedAssets);

        set((state) => ({
          assets: updatedAssets,
          totalValue: totalValueUSD,
          totalGainLoss,
          isLoading: false,
        }));
        return;
      }

      // Update local state
      const updatedAssets = get().assets.filter(asset => asset.id !== id);
      const totalValueUSD = calculateTotalValue(updatedAssets);
      const totalGainLoss = calculateTotalGainLoss(updatedAssets);

      set((state) => ({
        assets: updatedAssets,
        totalValue: totalValueUSD,
        totalGainLoss,
        isLoading: false,
      }));
    } catch (error) {
      console.error('removeAsset - Error:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateAsset: async (id: string, updates: Partial<Omit<Asset, 'id' | 'currentPrice' | 'lastUpdated'>>) => {
    try {
      set({ isLoading: true, error: null });
      const user = useAuthStore.getState().user;
      
      if (!user) {
        console.error('updateAsset: No user found - user must be logged in');
        throw new Error('User must be logged in to update assets');
      }

      const assets = get().assets;
      const assetIndex = assets.findIndex(asset => asset.id === id);
      
      if (assetIndex === -1) {
        console.error('updateAsset: Asset with id not found:', id);
        throw new Error('Asset not found.');
      }

      const asset = assets[assetIndex];
      let priceData;

      const filteredUpdates = {
        ...updates,
        symbol: updates.symbol ? ensureString(updates.symbol) : undefined,
        currency: updates.currency ? ensureString(updates.currency) : undefined,
        name: updates.type === "cash" && (updates.currency || updates.symbol)
          ? `${updates.quantity || asset.quantity} ${ensureString(updates.currency || updates.symbol || '').toUpperCase()}`
          : updates.name || asset.name,
      };

      // Fetch updated price data if symbol or type changed in filteredUpdates
      if (filteredUpdates.symbol || filteredUpdates.type) {
        const symbol = filteredUpdates.symbol || asset.symbol;
        const type = filteredUpdates.type || asset.type;

        if (type === 'cash') {
          // Ensure currency is present for cash type if type is being updated to cash
          if (!filteredUpdates.currency && !asset.currency && !filteredUpdates.symbol) {
             throw new Error('Currency or symbol is required for cash assets');
          }
          const currencyToFetch = filteredUpdates.currency || filteredUpdates.symbol || asset.currency!;
           // Only fetch if currency has changed or was just provided
          if (currencyToFetch && currencyToFetch !== asset.currency) {
             priceData = await fetchExchangeRate(ensureString(currencyToFetch));
          }
        } else {
           const symbolToFetch = filteredUpdates.symbol || asset.symbol;
           // Only fetch if symbol has changed or type is changing from cash
           if (symbolToFetch && (symbolToFetch !== asset.symbol || asset.type === 'cash')){
              priceData = await fetchAssetPrice(ensureString(symbolToFetch), type);
           }
        }
      }

      const updatedAsset: Asset = {
        ...asset,
        ...filteredUpdates, // Use filtered updates
        currentPrice: priceData?.price !== undefined ? priceData.price : asset.currentPrice,
        lastUpdated: priceData?.lastUpdated || asset.lastUpdated,
         // Ensure name is updated if symbol/currency changes, especially for cash
        name: filteredUpdates.name,
      };

      // Update in Firestore - send only the filtered updates or the relevant fields
      const assetRef = doc(db, 'users', user.uid, 'assets', id);
       // Construct the data to send to Firestore, only including fields that were updated
       const dataToUpdate: any = { ...filteredUpdates };

       // Include currentPrice and lastUpdated if they were fetched
       if (priceData?.price !== undefined) {
         dataToUpdate.currentPrice = priceData.price;
       }
        if (priceData?.lastUpdated) {
           dataToUpdate.lastUpdated = priceData.lastUpdated;
        }

        // Ensure name is included if it was recalculated
        if (updatedAsset.name !== asset.name) {
            dataToUpdate.name = updatedAsset.name;
        }

       // Remove undefined from dataToUpdate before sending
       Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

      await updateDoc(assetRef, dataToUpdate);

      // Update local state
      const updatedAssets = [...assets];
      updatedAssets[assetIndex] = updatedAsset;
      const totalValueUSD = calculateTotalValue(updatedAssets);
      const totalGainLoss = calculateTotalGainLoss(updatedAssets);

      set((state) => ({
        assets: updatedAssets,
        totalValue: totalValueUSD,
        totalGainLoss,
        isLoading: false,
      }));
    } catch (error) {
      console.error('updateAsset - Error:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updatePrices: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = useAuthStore.getState().user;
      
      if (!user) {
        console.error('updatePrices: No user found - user must be logged in');
        throw new Error('User must be logged in to update prices');
      }

      const assets = get().assets;
      const updatePromises = assets.map(async (asset) => {
        try {
          let priceData;
          if (asset.type === 'cash' && asset.currency) {
            priceData = await fetchExchangeRate(asset.currency);
          } else if (asset.type !== 'cash') {
            priceData = await fetchAssetPrice(asset.symbol, asset.type);
          }

          if (priceData) {
            const updatedAsset = {
              ...asset,
              currentPrice: priceData.price,
              lastUpdated: priceData.lastUpdated,
            };

            try {
              // Update in Firestore with retry
              const assetRef = doc(db, 'users', user.uid, 'assets', asset.id);
              await updateDoc(assetRef, {
                currentPrice: priceData.price,
                lastUpdated: priceData.lastUpdated,
              } as DocumentData);
            } catch (firestoreError) {
              console.warn(`Failed to update Firestore for ${asset.symbol}:`, firestoreError);
              // Continue with local update even if Firestore fails
            }

            return updatedAsset;
          }
          return asset;
        } catch (error) {
          console.warn(`Failed to update price for ${asset.symbol}:`, error);
          return asset;
        }
      });

      // Wait for all updates to complete, even if some fail
      const updatedAssets = await Promise.all(updatePromises);
      const totalValueUSD = calculateTotalValue(updatedAssets);
      const totalGainLoss = calculateTotalGainLoss(updatedAssets);

      set((state) => ({
        assets: updatedAssets,
        totalValue: totalValueUSD,
        totalGainLoss,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('updatePrices - Error:', error);
      set({ 
        error: (error as Error).message, 
        isLoading: false 
      });
      throw error;
    }
  },

  loadAssets: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = useAuthStore.getState().user;
      
      if (!user) {
        set({ assets: [], totalValue: 0, totalGainLoss: 0, isLoading: false });
        return;
      }

      // Cleanup any existing listener
      get().cleanup();

      // Explicitly fetch all documents once using getDocs
      try {
        const assetsRef = collection(db, 'users', user.uid, 'assets');
        const querySnapshot = await getDocs(assetsRef);
        
        const assets: Asset[] = [];
        querySnapshot.forEach((doc) => {
          const asset = doc.data() as Asset;
          assets.push(asset);
        });

        if (assets.length > 0) {
          const totalValueUSD = calculateTotalValue(assets);
          const totalGainLoss = calculateTotalGainLoss(assets);

          set((state) => ({
            assets,
            totalValue: totalValueUSD,
            totalGainLoss,
            isLoading: false,
          }));
        } else {
          set({ assets: [], totalValue: 0, totalGainLoss: 0, isLoading: false });
        }
      } catch (fetchError) {
        console.error('loadAssets: Explicit fetch failed with error:', fetchError);
        console.error('loadAssets: Error code:', (fetchError as any).code);
        console.error('loadAssets: Error message:', (fetchError as any).message);
        set({ error: (fetchError as Error).message, isLoading: false });
      }
    } catch (error) {
      console.error('loadAssets - Outer catch error:', error);
      console.error('loadAssets: Error code:', (error as any).code);
      console.error('loadAssets: Error message:', (error as any).message);
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));

// Helper function to calculate total value
const calculateTotalValue = (assets: Asset[]): number => {
  return assets.reduce((sum, asset) => {
    if (asset.type === 'cash') {
      return sum + (asset.quantity * asset.currentPrice);
    } else {
      return sum + (asset.quantity * asset.currentPrice);
    }
  }, 0);
};

// Helper function to calculate total gain/loss
const calculateTotalGainLoss = (assets: Asset[]): number => {
  return assets.reduce((total, asset) => {
    const gainLoss = (asset.currentPrice - asset.buyPrice) * asset.quantity;
    return total + gainLoss;
  }, 0);
};

// Helper function to ensure string type with undefined handling
const ensureString = (value: string | number | undefined): string => {
  if (value === undefined) return '';
  return typeof value === "string" ? value : value.toString();
};