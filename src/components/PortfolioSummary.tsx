import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { styled } from "nativewind";
import { Asset } from "../types";
import { generatePortfolioSummary } from "../services/geminiService";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface PortfolioSummaryProps {
  assets: Asset[];
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  assets,
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare portfolio data for the summary
      const portfolioData = assets
        .filter(
          (asset) =>
            asset.name &&
            asset.type &&
            !isNaN(asset.quantity) &&
            !isNaN(asset.currentPrice)
        )
        .map((asset) => ({
          name: asset.name,
          value: asset.quantity * asset.currentPrice,
          type: asset.type,
          gainLoss: (asset.currentPrice - asset.buyPrice) * asset.quantity,
          gainLossPercentage:
            ((asset.currentPrice - asset.buyPrice) / asset.buyPrice) * 100,
        }));

      const generatedSummary = await generatePortfolioSummary(portfolioData);
      setSummary(generatedSummary);
    } catch (err: any) {
      console.error("Error generating portfolio summary:", err);
      setError(
        `Failed to generate portfolio summary: ${
          err.message || "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (assets.length === 0) {
    return (
      <StyledView className="bg-white p-4 rounded-lg shadow-sm">
        <StyledText className="text-gray-500 text-center">
          Add assets to generate a portfolio summary
        </StyledText>
      </StyledView>
    );
  }

  return (
    <StyledView className="bg-white p-4 rounded-lg shadow-sm mb-4">
      {!summary && !isLoading && (
        <StyledTouchableOpacity
          onPress={generateSummary}
          className="bg-blue-500 py-2 px-4 rounded-lg"
        >
          <StyledText className="text-white text-center font-semibold">
            Generate AI Portfolio Summary
          </StyledText>
        </StyledTouchableOpacity>
      )}

      {isLoading && (
        <StyledView className="py-4">
          <ActivityIndicator size="large" color="#3B82F6" />
          <StyledText className="text-gray-500 text-center mt-2">
            Generating summary...
          </StyledText>
        </StyledView>
      )}

      {error && (
        <StyledText className="text-red-500 text-center mb-4">
          {error}
        </StyledText>
      )}

      {summary && (
        <StyledView>
          <StyledText className="text-gray-700 text-base leading-6">
            {summary}
          </StyledText>
          <StyledTouchableOpacity
            onPress={generateSummary}
            className="mt-4 bg-gray-100 py-2 px-4 rounded-lg"
          >
            <StyledText className="text-gray-600 text-center">
              Regenerate Summary
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      )}
    </StyledView>
  );
};
