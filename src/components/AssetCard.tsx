import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Modal } from "react-native";
import { Asset } from "../types";
import { usePortfolioStore } from "../store/portfolioStore";
import { styled } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { EditAssetForm } from "./EditAssetForm";
import { formatCurrency, formatCurrencyForCard } from "../utils/formatUtils";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface AssetCardProps {
  asset: Asset;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  isExpanded,
  onToggleExpand,
}) => {
  const { removeAsset } = usePortfolioStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const totalValue = asset.quantity * asset.currentPrice;

  const handleDelete = () => {
    Alert.alert("Delete Asset", "Are you sure you want to delete this asset?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeAsset(asset.id),
      },
    ]);
  };

  return (
    <>
      <StyledTouchableOpacity
        onPress={onToggleExpand}
        className={`bg-white dark:bg-gray-800 py-2 px-4 rounded-lg shadow-sm mb-3 border-l-4 ${
          (asset.currentPrice - asset.buyPrice) * asset.quantity >= 0
            ? "border-green-500 dark:border-green-400"
            : "border-red-500 dark:border-red-400"
        }`}
      >
        <StyledView className="flex-row justify-between items-center">
          <StyledView className="flex-row items-baseline">
            <StyledText className="text-lg font-semibold text-gray-900 dark:text-white">
              {asset.name}
            </StyledText>
            <StyledText className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              ({asset.type.toUpperCase()})
            </StyledText>
          </StyledView>
          <StyledView className="flex-row items-center">
            <StyledTouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="pencil-outline"
                size={20}
                color="#6B7280"
                className="dark:text-gray-400"
              />
            </StyledTouchableOpacity>
            <StyledTouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color="#EF4444"
                className="dark:text-red-400"
              />
            </StyledTouchableOpacity>
            <StyledTouchableOpacity
              onPress={onToggleExpand}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={
                  isExpanded ? "chevron-up-outline" : "chevron-down-outline"
                }
                size={20}
                color="#6B7280"
                className="dark:text-gray-400"
              />
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>

        {!isExpanded && (
          <StyledView className="mt-3 flex-row justify-between items-center">
            {(() => {
              const gainLoss =
                (asset.currentPrice - asset.buyPrice) * asset.quantity;
              const gainLossPercentage =
                asset.buyPrice !== 0
                  ? ((asset.currentPrice - asset.buyPrice) / asset.buyPrice) *
                    100
                  : 0;
              const isGain = gainLoss >= 0;
              const gainLossColor = isGain
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400";

              return (
                <StyledView className="flex-col">
                  <StyledText className="text-gray-500 dark:text-gray-400 text-sm">
                    Gain/Loss
                  </StyledText>
                  <StyledText
                    className={`font-semibold text-base ${gainLossColor}`}
                  >
                    {formatCurrencyForCard(gainLoss)}
                    {` (${gainLossPercentage.toFixed(2)}%)`}
                  </StyledText>
                </StyledView>
              );
            })()}

            <StyledView className="flex-col items-end">
              <StyledText className="text-gray-500 dark:text-gray-400 text-sm">
                Total Value
              </StyledText>
              <StyledText className="text-blue-600 dark:text-blue-400 font-semibold text-base">
                {formatCurrencyForCard(totalValue)}
              </StyledText>
            </StyledView>
          </StyledView>
        )}

        {isExpanded && (
          <>
            {asset.description && (
              <StyledView className="mt-2">
                <StyledText className="text-sm text-gray-600 dark:text-gray-300 italic">
                  {asset.description}
                </StyledText>
              </StyledView>
            )}
            <StyledView className="mt-3">
              <StyledView className="flex-row justify-between mb-1">
                <StyledText className="text-gray-500 dark:text-gray-400">
                  Quantity
                </StyledText>
                <StyledText className="text-gray-900 dark:text-white">
                  {asset.quantity}
                </StyledText>
              </StyledView>
              {asset.type !== "cash" && (
                <StyledView className="flex-row justify-between mb-1">
                  <StyledText className="text-gray-500 dark:text-gray-400">
                    Current Price
                  </StyledText>
                  <StyledText className="text-gray-900 dark:text-white">
                    {formatCurrency(asset.currentPrice)}
                  </StyledText>
                </StyledView>
              )}
              {asset.type === "cash" && (
                <StyledView className="flex-row justify-between mb-1">
                  <StyledText className="text-gray-500 dark:text-gray-400">
                    Exchange Rate (to USD)
                  </StyledText>
                  <StyledText className="text-gray-900 dark:text-white">
                    {`1 ${asset.currency} = ${formatCurrency(
                      asset.currentPrice
                    )}`}
                  </StyledText>
                </StyledView>
              )}
              <StyledView className="flex-row justify-between mb-1">
                <StyledText className="text-gray-500 dark:text-gray-400">
                  Buy Price
                </StyledText>
                <StyledText className="text-gray-900 dark:text-white">
                  {formatCurrency(asset.buyPrice)}
                </StyledText>
              </StyledView>
              <StyledView className="flex-row justify-between mb-1">
                <StyledText className="text-gray-500 dark:text-gray-400">
                  Gain/Loss
                </StyledText>
                <StyledText
                  className={`font-semibold ${
                    (asset.currentPrice - asset.buyPrice) * asset.quantity >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrencyForCard(
                    (asset.currentPrice - asset.buyPrice) * asset.quantity
                  )}
                  {asset.buyPrice !== 0 &&
                    ` (${(
                      ((asset.currentPrice - asset.buyPrice) / asset.buyPrice) *
                      100
                    ).toFixed(2)}%)`}
                </StyledText>
              </StyledView>
              <StyledView className="flex-row justify-between mb-1">
                <StyledText className="text-gray-500 dark:text-gray-400">
                  Total Value
                </StyledText>
                <StyledText className="text-blue-600 dark:text-blue-400 font-semibold text-base">
                  {formatCurrencyForCard(totalValue)}
                </StyledText>
              </StyledView>
            </StyledView>

            <StyledText className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Last updated: {new Date(asset.lastUpdated).toLocaleString()}
            </StyledText>
          </>
        )}
      </StyledTouchableOpacity>

      {/* Edit Asset Form Modal */}
      <EditAssetForm
        asset={asset}
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </>
  );
};
