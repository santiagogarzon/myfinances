import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Asset } from "../types";
import { usePortfolioStore } from "../store/portfolioStore";

interface AssetCardProps {
  asset: Asset;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const { removeAsset } = usePortfolioStore();
  const totalValue = asset.quantity * asset.currentPrice;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.symbolText}>{asset.name}</Text>
          <Text style={styles.typeText}>{asset.type.toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          onPress={() => removeAsset(asset.id)}
          style={styles.removeButton}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>{asset.quantity}</Text>
        </View>
        {asset.type !== "cash" && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Price</Text>
            <Text style={styles.detailValue}>
              ${asset.currentPrice.toFixed(2)}
            </Text>
          </View>
        )}
        {asset.type === "cash" && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exchange Rate (to USD)</Text>
            <Text style={styles.detailValue}>
              {`1 ${asset.currency} = ${asset.currentPrice.toFixed(2)} USD`}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Value</Text>
          <Text style={styles.totalValueText}>${totalValue.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.lastUpdatedText}>
        Last updated: {new Date(asset.lastUpdated).toLocaleString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  symbolText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  typeText: {
    fontSize: 14,
    color: "#4B5563",
  },
  removeButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  removeButtonText: {
    color: "white",
    fontSize: 14,
  },
  detailsContainer: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    color: "#4B5563",
  },
  detailValue: {
    color: "#1F2937",
  },
  totalValueText: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  lastUpdatedText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
  },
});
