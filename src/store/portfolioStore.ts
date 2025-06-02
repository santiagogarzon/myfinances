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

      console.log('addAsset: Starting to add asset for user:', user.uid);
      console.log('addAsset: Asset details:', { symbol, quantity, type, buyPrice, currency, description });

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
        console.log('addAsset: Attempting to save to Firestore at path:', `users/${user.uid}/assets/${newAsset.id}`);
        await setDoc(assetRef, newAsset as DocumentData);
        console.log('addAsset: Successfully saved to Firestore');
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

      console.log('addAsset: Successfully added asset, updating local state');
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
        throw new Error('User must be logged in to remove assets');
      }

      // Delete from Firestore
      const assetRef = doc(db, 'users', user.uid, 'assets', id);
      await deleteDoc(assetRef);

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
        throw new Error('User must be logged in to update assets');
      }

      const assets = get().assets;
      const assetIndex = assets.findIndex(asset => asset.id === id);
      
      if (assetIndex === -1) {
        throw new Error('Asset not found');
      }

      const asset = assets[assetIndex];
      let priceData;

      // Filter out undefined values from updates
      const filteredUpdates: any = {};
      for (const key in updates) {
        if (updates[key as keyof typeof updates] !== undefined) {
          filteredUpdates[key] = updates[key as keyof typeof updates];
        }
      }

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
             priceData = await fetchExchangeRate(currencyToFetch);
          }
        } else {
           const symbolToFetch = filteredUpdates.symbol || asset.symbol;
           // Only fetch if symbol has changed or type is changing from cash
           if (symbolToFetch && (symbolToFetch !== asset.symbol || asset.type === 'cash')){
              priceData = await fetchAssetPrice(symbolToFetch, type);
           }
        }
      }

      const updatedAsset: Asset = {
        ...asset,
        ...filteredUpdates, // Use filtered updates
        currentPrice: priceData?.price !== undefined ? priceData.price : asset.currentPrice,
        lastUpdated: priceData?.lastUpdated || asset.lastUpdated,
         // Ensure name is updated if symbol/currency changes, especially for cash
        name: (filteredUpdates.type === 'cash' && (filteredUpdates.currency || filteredUpdates.symbol)) 
           ? `${filteredUpdates.quantity || asset.quantity} ${(filteredUpdates.currency || filteredUpdates.symbol).toUpperCase()}`
           : filteredUpdates.symbol || asset.name,
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

       console.log('PortfolioStore: updateDoc with data:', dataToUpdate);
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
        console.log('loadAssets: No user found, clearing assets');
        set({ assets: [], totalValue: 0, totalGainLoss: 0, isLoading: false });
        return;
      }

      console.log('loadAssets: Starting to load assets for user:', user.uid);
      console.log('loadAssets: User email:', user.email);

      // Cleanup any existing listener
      get().cleanup();

      // Explicitly fetch all documents once using getDocs
      try {
        console.log('loadAssets: Attempting explicit fetch of assets using getDocs...');
        const assetsRef = collection(db, 'users', user.uid, 'assets');
        const querySnapshot = await getDocs(assetsRef);
        console.log('loadAssets: Explicit fetch found', querySnapshot.size, 'documents');
        
        const assets: Asset[] = [];
        querySnapshot.forEach((doc) => {
          const asset = doc.data() as Asset;
          console.log('loadAssets: Explicit fetch - Found asset:', {
            id: doc.id,
            symbol: asset.symbol,
            type: asset.type,
            data: asset
          });
          assets.push(asset);
        });

        if (assets.length > 0) {
          const totalValueUSD = calculateTotalValue(assets);
          const totalGainLoss = calculateTotalGainLoss(assets);

          console.log('loadAssets: Updating state with', assets.length, 'assets from explicit fetch');
          set((state) => ({
            assets,
            totalValue: totalValueUSD,
            totalGainLoss,
            isLoading: false,
          }));
        } else {
          console.log('loadAssets: No assets found in explicit fetch');
          set({ 
            assets: [], 
            totalValue: 0, 
            totalGainLoss: 0, 
            isLoading: false 
          });
        }
      } catch (fetchError) {
        console.error('loadAssets: Explicit fetch failed with error:', fetchError);
        console.error('loadAssets: Error code:', (fetchError as any).code);
        console.error('loadAssets: Error message:', (fetchError as any).message);
        set({ error: (fetchError as Error).message, isLoading: false });
      }

      console.log('loadAssets: Explicit fetch process complete. Final isLoading:', get().isLoading, 'assets.length:', get().assets.length);

      // We are temporarily NOT setting up the real-time listener here
      // so comment out the unsubscribe storing and listener setup below

      // const assetsRef = collection(db, 'users', user.uid, 'assets');
      // console.log('loadAssets: Setting up real-time listener...');
      
      // const unsubscribe = onSnapshot(assetsRef, 
      //   (snapshot) => { /* ... snapshot handling ... */ },\
      //   (error) => { /* ... error handling ... */ }\
      // );

      // Store unsubscribe function
      // set({ unsubscribe });
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