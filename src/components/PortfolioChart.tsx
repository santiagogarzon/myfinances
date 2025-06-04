import React from "react";
import { View, Text, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Asset, AssetType } from "../types";
import { styled } from "nativewind";

const StyledView = styled(View);
const StyledText = styled(Text);

interface PortfolioChartProps {
  assets: Asset[];
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
  percentage: number;
}

const COLORS: Record<AssetType, string> = {
  stock: "#FF6B6B",
  etf: "#4ECDC4",
  crypto: "#45B7D1",
  cash: "#FFD166",
};

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return `$${Math.round(value).toLocaleString()}`;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ assets }) => {
  const screenWidth = Dimensions.get("window").width;
  const chartHeight = 180;

  // Early return if no assets
  if (!assets || assets.length === 0) {
    return (
      <StyledView className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
        <StyledText className="text-gray-500 dark:text-gray-400 text-center">
          Add assets to see portfolio distribution
        </StyledText>
      </StyledView>
    );
  }

  // Calculate total value by type
  const typeTotals = assets.reduce((acc, asset) => {
    if (
      !asset ||
      !asset.type ||
      typeof asset.quantity !== "number" ||
      typeof asset.currentPrice !== "number"
    ) {
      console.warn("Invalid asset data:", asset);
      return acc;
    }
    const type = asset.type;
    const value = asset.quantity * asset.currentPrice;
    if (isNaN(value) || !isFinite(value)) {
      console.warn("Invalid value calculated for asset:", asset);
      return acc;
    }
    acc[type] = (acc[type] || 0) + value;
    return acc;
  }, {} as Record<AssetType, number>);

  // Calculate total sum of all values
  const total = Object.values(typeTotals).reduce((sum, v) => sum + v, 0);

  // If total is 0 or invalid, show message
  if (!total || isNaN(total) || !isFinite(total)) {
    return (
      <StyledView className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
        <StyledText className="text-gray-500 dark:text-gray-400 text-center">
          Unable to calculate portfolio distribution
        </StyledText>
      </StyledView>
    );
  }

  // Prepare chart data with percentage for chart and legend
  const chartData: ChartData[] = Object.entries(typeTotals)
    .filter(([_, value]) => value > 0)
    .map(([type, value]) => {
      const percentage = total > 0 ? (value / total) * 100 : 0;
      return {
        name: capitalize(type),
        value,
        color: COLORS[type as AssetType] || "#CCCCCC",
        legendFontColor: "#6B7280",
        legendFontSize: 12,
        percentage,
      };
    });

  // If no valid chart data, show message
  if (chartData.length === 0) {
    return (
      <StyledView className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
        <StyledText className="text-gray-500 dark:text-gray-400 text-center">
          No valid assets to display
        </StyledText>
      </StyledView>
    );
  }

  // Prepare data specifically for the PieChart component
  const pieChartData = chartData.map((item) => ({
    name: `${item.name} - ${formatCurrency(
      Math.round(item.value)
    )} - (${item.percentage.toFixed(1)}%)`,
    value: item.value,
    color: item.color,
    legendFontColor: "#6B7280",
    legendFontSize: item.legendFontSize,
  }));

  return (
    <StyledView className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
      <StyledView className="flex-row">
        <StyledView className="flex-1">
          <PieChart
            data={pieChartData}
            width={screenWidth - 200}
            height={chartHeight}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="30"
            absolute
            hasLegend={false}
          />
        </StyledView>
        <StyledView className="flex-1 justify-center ml-4">
          {chartData.map((item) => (
            <StyledView key={item.name} className="flex-row items-center mb-2">
              <StyledView
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <StyledText className="text-gray-900 dark:text-white text-sm">
                {`${item.name} ${formatCurrency(
                  Math.round(item.value)
                )} (${item.percentage.toFixed(1)}%)`}
              </StyledText>
            </StyledView>
          ))}
        </StyledView>
      </StyledView>
    </StyledView>
  );
};
const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};
