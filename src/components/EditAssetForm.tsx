import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { Asset, AssetType, AddAssetFormData } from "../types";
import { usePortfolioStore } from "../store/portfolioStore";
import { styled } from "nativewind";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface EditAssetFormProps {
  asset: Asset;
  visible: boolean;
  onClose: () => void;
}

const ASSET_TYPES: AssetType[] = ["stock", "etf", "crypto", "cash"];

export const EditAssetForm: React.FC<EditAssetFormProps> = ({
  asset,
  visible,
  onClose,
}) => {
  const { updateAsset } = usePortfolioStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddAssetFormData>({
    defaultValues: {
      symbol: asset.symbol,
      quantity: asset.quantity?.toString(),
      type: asset.type,
      currency: asset.currency,
      description: asset.description,
      buyPrice: asset.buyPrice?.toString(),
    },
  });

  const assetType = watch("type");

  const onSubmit = async (data: AddAssetFormData) => {
    try {
      setIsSubmitting(true);
      await updateAsset(asset.id, {
        symbol: data.symbol.toUpperCase(),
        quantity: parseFloat(data.quantity),
        type: data.type,
        currency: data.currency,
        description: data.description,
        buyPrice: parseFloat(data.buyPrice),
      });
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Asset updated successfully",
      });
      onClose();
    } catch (error) {
      console.error("Error updating asset:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error instanceof Error ? error.message : "Failed to update asset",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <StyledView className="flex-1 bg-black/50 justify-center items-center p-4">
        <StyledView className="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg p-4">
          <StyledView className="flex-row justify-between items-center mb-4">
            <StyledText className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Asset
            </StyledText>
            <StyledTouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={24}
                color="#6B7280"
                className="dark:text-gray-400"
              />
            </StyledTouchableOpacity>
          </StyledView>

          <Controller
            control={control}
            name="symbol"
            rules={{ required: "Symbol is required" }}
            render={({ field: { onChange, value } }) => (
              <StyledView className="mb-4">
                <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                  Symbol
                </StyledText>
                <StyledTextInput
                  className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-900 dark:text-white"
                  placeholder={
                    assetType === "cash" ? "e.g., USD, EUR" : "e.g., AAPL, BTC"
                  }
                  placeholderTextColor="#9CA3AF"
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize={assetType === "cash" ? "characters" : "none"}
                />
                {errors.symbol && (
                  <StyledText className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.symbol.message}
                  </StyledText>
                )}
              </StyledView>
            )}
          />

          <Controller
            control={control}
            name="quantity"
            rules={{
              required: "Quantity is required",
              pattern: {
                value: /^\d*\.?\d+$/,
                message: "Please enter a valid number",
              },
            }}
            render={({ field: { onChange, value } }) => (
              <StyledView className="mb-4">
                <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                  Quantity
                </StyledText>
                <StyledTextInput
                  className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-900 dark:text-white"
                  placeholder="e.g., 100"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={onChange}
                  value={value}
                  keyboardType="decimal-pad"
                />
                {errors.quantity && (
                  <StyledText className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.quantity.message}
                  </StyledText>
                )}
              </StyledView>
            )}
          />

          <Controller
            control={control}
            name="buyPrice"
            rules={{
              required: "Buy price is required",
              pattern: {
                value: /^\d*\.?\d+$/,
                message: "Please enter a valid number",
              },
            }}
            render={({ field: { onChange, value } }) => (
              <StyledView className="mb-4">
                <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                  Buy Price
                </StyledText>
                <StyledTextInput
                  className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-900 dark:text-white"
                  placeholder="e.g., 150.50"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={onChange}
                  value={value}
                  keyboardType="decimal-pad"
                />
                {errors.buyPrice && (
                  <StyledText className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.buyPrice.message}
                  </StyledText>
                )}
              </StyledView>
            )}
          />

          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <StyledView className="mb-4">
                <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                  Type
                </StyledText>
                <StyledView className="flex-row flex-wrap gap-2">
                  {ASSET_TYPES.map((type) => (
                    <StyledTouchableOpacity
                      key={type}
                      onPress={() => onChange(type)}
                      className={`px-3 py-2 rounded-lg ${
                        value === type
                          ? "bg-blue-600 dark:bg-blue-500"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <StyledText
                        className={`${
                          value === type
                            ? "text-white"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {type.toUpperCase()}
                      </StyledText>
                    </StyledTouchableOpacity>
                  ))}
                </StyledView>
              </StyledView>
            )}
          />

          {assetType === "cash" && (
            <Controller
              control={control}
              name="currency"
              rules={{ required: "Currency is required" }}
              render={({ field: { onChange, value } }) => (
                <StyledView className="mb-4">
                  <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                    Currency
                  </StyledText>
                  <StyledTextInput
                    className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-900 dark:text-white"
                    placeholder="e.g., USD"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="characters"
                  />
                  {errors.currency && (
                    <StyledText className="text-red-600 dark:text-red-400 text-sm mt-1">
                      {errors.currency.message}
                    </StyledText>
                  )}
                </StyledView>
              )}
            />
          )}

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <StyledView className="mb-4">
                <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
                  Description (Optional)
                </StyledText>
                <StyledTextInput
                  className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-900 dark:text-white"
                  placeholder="e.g., Robinhood account, Bank of America savings"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="sentences"
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </StyledView>
            )}
          />

          <StyledTouchableOpacity
            onPress={handleSubmit(onSubmit)}
            className="bg-blue-600 dark:bg-blue-500 p-3 rounded-lg flex-row justify-center items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <StyledText className="text-white text-center font-semibold">
                Update Asset
              </StyledText>
            )}
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>
    </Modal>
  );
};
