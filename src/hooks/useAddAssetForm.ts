import { useForm } from 'react-hook-form';
import { AddAssetFormData, AssetType } from '../types';
import { usePortfolioStore } from '../store/portfolioStore';

export const useAddAssetForm = () => {
  const { addAsset } = usePortfolioStore();
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddAssetFormData>({
    defaultValues: {
      symbol: '',
      quantity: '',
      type: 'stock' as AssetType,
      currency: 'USD', // Default currency for cash
    },
  });

  const onSubmit = async (data: AddAssetFormData) => {
    try {
      await addAsset(
        data.symbol.toUpperCase(),
        parseFloat(data.quantity),
        data.type,
        data.currency
      );
      reset();
    } catch (error) {
      // Error is handled by the store
      console.error('Failed to add asset:', error);
    }
  };

  return {
    control,
    handleSubmit,
    onSubmit,
    errors,
    setValue,
    watch
  };
}; 