import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { AddAssetFormData, AssetType } from '../types';
import { usePortfolioStore } from '../store/portfolioStore';

export const useAddAssetForm = () => {
  const { addAsset } = usePortfolioStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddAssetFormData>({
    defaultValues: {
      symbol: '',
      quantity: '',
      type: 'stock' as AssetType,
      currency: '', // We'll set this automatically for cash assets
      buyPrice: '', // Add buy price default
    },
  });

  const onSubmit = async (data: AddAssetFormData) => {
    try {
      setIsSubmitting(true);
      // For cash assets, use the symbol as the currency
      const currency = data.type === 'cash' ? data.symbol : undefined;
      await addAsset(
        data.symbol.toUpperCase(),
        parseFloat(data.quantity),
        data.type,
        parseFloat(data.buyPrice),
        currency,
        data.description
      );
      reset();
    } catch (error) {
      // Error is handled by the store
      console.error('Failed to add asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    control,
    handleSubmit,
    onSubmit,
    errors,
    setValue,
    watch,
    isSubmitting,
    reset
  };
}; 