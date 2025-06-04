import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { styled } from "nativewind";
import { Asset } from "../types";
import {
  analyzeRiskProfile,
  suggestRebalancing,
  analyzeMarketTrends,
  suggestNewInvestments,
  generatePortfolioSummary,
} from "../services/geminiService";
import { Ionicons } from "@expo/vector-icons";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

interface FinancialInsightsProps {
  assets: Asset[];
}

type InsightType = "summary" | "risk" | "rebalance" | "market" | "suggestions";

interface InsightState {
  type: InsightType;
  content: string | null;
  isLoading: boolean;
  error: string | null;
}

// Helper function to parse and format AI insight content
const formatInsightContent = (content: string | null) => {
  if (!content) return null;

  const parts = [];
  let lastIndex = 0;
  // Regex to find patterns like **Text:** or **Text**: followed by optional space
  const regex = /\*\*(.*?):\*\*\s*/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const beforeText = content.substring(lastIndex, match.index);
    if (beforeText) {
      parts.push(
        <StyledText
          key={`text-before-${lastIndex}`}
          className="text-gray-700 dark:text-gray-300 text-base leading-6"
        >
          {beforeText}
        </StyledText>
      );
    }

    const boldText = match[1]; // Text inside the asterisks
    parts.push(
      <StyledText
        key={`bold-${match.index}`}
        className="font-semibold text-gray-900 dark:text-white text-base leading-6"
      >
        {boldText}:
      </StyledText>
    );

    lastIndex = regex.lastIndex;
  }

  // Add any remaining text after the last match
  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(
      <StyledText
        key={`text-after-${lastIndex}`}
        className="text-gray-700 dark:text-gray-300 text-base leading-6"
      >
        {remainingText}
      </StyledText>
    );
  }

  return parts;
};

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({
  assets,
}) => {
  const [insights, setInsights] = useState<Record<InsightType, InsightState>>({
    summary: { type: "summary", content: null, isLoading: false, error: null },
    risk: { type: "risk", content: null, isLoading: false, error: null },
    rebalance: {
      type: "rebalance",
      content: null,
      isLoading: false,
      error: null,
    },
    market: { type: "market", content: null, isLoading: false, error: null },
    suggestions: {
      type: "suggestions",
      content: null,
      isLoading: false,
      error: null,
    },
  });

  // State to track visibility of generated content
  const [contentVisibility, setContentVisibility] = useState<
    Record<InsightType, boolean>
  >({
    summary: false,
    risk: false,
    rebalance: false,
    market: false,
    suggestions: false,
  });

  const preparePortfolioData = () => {
    return assets
      .filter(
        (asset) =>
          asset.name &&
          asset.type &&
          !isNaN(asset.quantity) &&
          !isNaN(asset.currentPrice) &&
          asset.currentPrice !== 0
      )
      .map((asset) => ({
        name: asset.name,
        value: asset.quantity * asset.currentPrice,
        type: asset.type,
        gainLoss: (asset.currentPrice - asset.buyPrice) * asset.quantity,
        gainLossPercentage:
          asset.buyPrice !== 0
            ? ((asset.currentPrice - asset.buyPrice) / asset.buyPrice) * 100
            : 0,
      }));
  };

  const generateInsight = async (type: InsightType) => {
    if (insights[type].isLoading) {
      return;
    }

    try {
      setInsights((prev) => ({
        ...prev,
        [type]: { ...prev[type], isLoading: true, error: null },
      }));
      // Hide content while regenerating/generating
      setContentVisibility((prev) => ({ ...prev, [type]: false }));

      const portfolioData = preparePortfolioData();
      if (portfolioData.length === 0) {
        setInsights((prev) => ({
          ...prev,
          [type]: {
            ...prev[type],
            content: "No valid assets to generate this insight.",
            isLoading: false,
            error: null,
          },
        }));
        // Show message if no valid assets
        setContentVisibility((prev) => ({ ...prev, [type]: true }));
        return;
      }

      let content: string;

      switch (type) {
        case "summary":
          content = await generatePortfolioSummary(portfolioData);
          break;
        case "risk":
          content = await analyzeRiskProfile(portfolioData);
          break;
        case "rebalance":
          content = await suggestRebalancing(portfolioData);
          break;
        case "market":
          content = await analyzeMarketTrends(portfolioData);
          break;
        case "suggestions":
          content = await suggestNewInvestments(portfolioData);
          break;
        default:
          throw new Error("Invalid insight type");
      }

      setInsights((prev) => ({
        ...prev,
        [type]: { ...prev[type], content, isLoading: false },
      }));
      // Show content after successful generation
      setContentVisibility((prev) => ({ ...prev, [type]: true }));
    } catch (err: any) {
      setInsights((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          error: err.message || "Failed to generate insight",
          isLoading: false,
        },
      }));
      // Show error message
      setContentVisibility((prev) => ({ ...prev, [type]: true }));
    }
  };

  const getInsightTitle = (type: InsightType): string => {
    switch (type) {
      case "summary":
        return "Portfolio Summary";
      case "risk":
        return "Risk Analysis";
      case "rebalance":
        return "Rebalancing Suggestions";
      case "market":
        return "Market Trends";
      case "suggestions":
        return "Investment Opportunities";
      default:
        return "";
    }
  };

  const getInsightIcon = (type: InsightType): string => {
    switch (type) {
      case "summary":
        return "document-text-outline";
      case "risk":
        return "alert-circle-outline";
      case "rebalance":
        return "swap-horizontal-outline";
      case "market":
        return "trending-up-outline";
      case "suggestions":
        return "bulb-outline";
      default:
        return "help-circle-outline";
    }
  };

  if (assets.length === 0) {
    return (
      <StyledView className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <StyledText className="text-gray-500 dark:text-gray-400 text-center">
          Add assets to get financial insights
        </StyledText>
      </StyledView>
    );
  }

  return (
    <StyledScrollView className="flex-1 mb-2">
      {Object.entries(insights).map(([type, insight]) => {
        const insightType = type as InsightType; // Cast type to InsightType
        const isContentVisible = contentVisibility[insightType]; // Use the typed variable
        const hasContentOrError =
          insight.content !== null || insight.error !== null;

        return (
          <StyledView
            key={type}
            className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm mb-4"
          >
            {/* Header area acts as toggle */}
            <StyledTouchableOpacity
              onPress={() =>
                setContentVisibility((prev) => ({
                  ...prev,
                  [insightType]: !prev[insightType],
                }))
              }
              className="flex-row items-center justify-between "
            >
              <StyledView className="flex-row items-center flex-1 pr-2">
                {/* Main Insight Icon */}
                <Ionicons
                  name={getInsightIcon(insightType) as any}
                  size={24}
                  color="#3B82F6"
                  className="dark:text-blue-400"
                />
                <StyledText className="text-lg font-semibold text-gray-800 dark:text-gray-200 ml-2">
                  {getInsightTitle(insightType)}
                </StyledText>
              </StyledView>
              <StyledView className="flex-row items-center">
                {/* Generate Icon (visible when no content and not loading) */}
                {!hasContentOrError && !insight.isLoading && (
                  <StyledTouchableOpacity
                    onPress={() => generateInsight(insightType)}
                    className="bg-blue-500 dark:bg-blue-600 p-2 rounded-full ml-2"
                  >
                    <Ionicons name="sparkles-outline" size={20} color="white" />
                  </StyledTouchableOpacity>
                )}

                {/* Loading Indicator (visible when loading) */}
                {insight.isLoading && (
                  <StyledView className="ml-2 dark:text-blue-400">
                    <ActivityIndicator size="small" color="#3B82F6" />
                  </StyledView>
                )}

                {/* Toggle Icon (visible when content or error exists) */}
                {hasContentOrError && (
                  <StyledTouchableOpacity
                    onPress={() =>
                      setContentVisibility((prev) => ({
                        ...prev,
                        [insightType]: !prev[insightType],
                      }))
                    }
                    className="p-1 ml-2"
                  >
                    <Ionicons
                      name={
                        isContentVisible
                          ? "chevron-up-outline"
                          : "chevron-down-outline"
                      }
                      size={24}
                      color="#6B7280"
                      className="dark:text-gray-400"
                    />
                  </StyledTouchableOpacity>
                )}
              </StyledView>
            </StyledTouchableOpacity>

            {/* Content Area (visible only if isContentVisible is true and has content or error) */}
            {isContentVisible && hasContentOrError && (
              <StyledView className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {insight.error && (
                  <StyledText className="text-red-500 dark:text-red-400 text-sm mb-2">
                    {insight.error}
                  </StyledText>
                )}

                {insight.content && (
                  <StyledView>
                    {/* Use helper function to format content */}
                    {formatInsightContent(insight.content)}
                    {/* Regenerate button (visible when content exists) */}
                    <StyledTouchableOpacity
                      onPress={() => generateInsight(insightType)}
                      className="mt-2 bg-gray-100 dark:bg-gray-700 py-2 px-4 rounded-lg flex-row items-center justify-center "
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={18}
                        color="#4B5563"
                        className="mr-2 dark:text-gray-300"
                      />
                      <StyledText className="text-gray-600 dark:text-gray-300">
                        Regenerate
                      </StyledText>
                    </StyledTouchableOpacity>
                  </StyledView>
                )}
              </StyledView>
            )}
          </StyledView>
        );
      })}
    </StyledScrollView>
  );
};
