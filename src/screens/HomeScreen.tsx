import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { usePortfolioStore } from "../store/portfolioStore";
import { useAuthStore } from "../store/authStore";
import { AssetCard } from "../components/AssetCard";
import { AddAssetForm } from "../components/AddAssetForm";
import { PortfolioChart } from "../components/PortfolioChart";
import Toast from "react-native-toast-message";

export const HomeScreen: React.FC = () => {
  const { assets, totalValue, isLoading, error, loadAssets, updatePrices } =
    usePortfolioStore();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (user) {
      // Load assets when user is authenticated
      loadAssets();
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error,
      });
    }
  }, [error]);

  const onRefresh = async () => {
    await updatePrices();
    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Prices updated successfully",
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Logged out successfully",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: (error as Error).message,
      });
    }
  };

  if (isLoading && assets.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-row justify-between items-center px-4 pt-12 pb-4">
        <View className="mt-4">
          <Text className="text-2xl font-bold text-dark dark:text-white">
            Portfolio Value
          </Text>
          <Text className="text-4xl font-bold text-primary mt-2">
            ${totalValue.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-danger px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        <AddAssetForm />

        {assets.length > 0 && <PortfolioChart assets={assets} />}

        <View className="mb-4">
          <Text className="text-xl font-semibold text-dark dark:text-white mb-2">
            Your Assets
          </Text>
          {assets.length === 0 ? (
            <Text className="text-gray-500 dark:text-gray-400 text-center py-4">
              No assets added yet. Add your first asset above!
            </Text>
          ) : (
            <FlashList
              data={assets}
              renderItem={({ item }) => <AssetCard asset={item} />}
              estimatedItemSize={150}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
      <Toast />
    </View>
  );
};
