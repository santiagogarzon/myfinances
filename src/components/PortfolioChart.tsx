import React from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Asset, AssetType } from "../types";

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

  // Calculate total value by type
  const typeTotals = assets.reduce((acc, asset) => {
    const type = asset.type;
    const value = asset.quantity * asset.currentPrice;
    acc[type] = (acc[type] || 0) + value;
    return acc;
  }, {} as Record<AssetType, number>);

  // Calculate total sum of all values
  const total = Object.values(typeTotals).reduce((sum, v) => sum + v, 0);

  // Prepare chart data with percentage for chart and legend
  const chartData: ChartData[] = Object.entries(typeTotals)
    .filter(([_, value]) => value > 0)
    .map(([type, value]) => ({
      name: capitalize(type),
      value,
      color: COLORS[type as AssetType],
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }));

  // Prepare data specifically for the PieChart component
  const pieChartData = chartData.map((item) => ({
    name: item.name,
    value: item.value,
    color: item.color,
    legendFontColor: item.legendFontColor,
    legendFontSize: item.legendFontSize,
  }));

  if (chartData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noAssetsText}>
          Add assets to see portfolio distribution
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portfolio Distribution</Text>
      <View style={styles.chartContainer}>
        <PieChart
          data={pieChartData}
          width={screenWidth * 0.5}
          height={chartHeight}
          chartConfig={chartConfig}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft="30"
          absolute
          hasLegend={false}
          avoidFalseZero
        />
        {/* Custom Legend */}
        <View style={styles.legendContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[styles.legendColorDot, { backgroundColor: item.color }]}
              />
              <Text style={styles.legendText}>
                {item.name} — {formatCurrency(item.value)} (
                {item.percentage.toFixed(1)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  noAssetsText: {
    textAlign: "center",
    color: "#6B7280",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  legendContainer: {
    flex: 1,
    marginLeft: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  legendColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: "#333",
  },
});
