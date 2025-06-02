import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { usePortfolioStore } from "../store/portfolioStore";
import { AssetCard } from "../components/AssetCard";
import { AddAssetForm } from "../components/AddAssetForm";
import { PortfolioChart } from "../components/PortfolioChart";
import { ErrorBoundary } from "../components/ErrorBoundary";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { PortfolioState } from "../store/portfolioStore";
import { Asset } from "../types";
import { styled } from "nativewind";
import { useAuthStore } from "../store/authStore";
import { Easing } from "react-native";
import { formatCurrency } from "../utils/formatUtils";

// Add nativewind types to React Native components
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

// Use the styled components for type safety
type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const ChartErrorFallback = () => (
  <StyledView className="bg-white p-4 rounded-lg shadow mb-4">
    <StyledText className="text-gray-500 text-center">
      Unable to display portfolio chart. Please try refreshing.
    </StyledText>
  </StyledView>
);

export const HomeScreen: React.FC<Props> = ({ route }) => {
  const portfolio = usePortfolioStore() as PortfolioState;
  const {
    assets,
    totalValue,
    totalGainLoss,
    isLoading,
    error,
    loadAssets,
    updatePrices,
  } = portfolio;
  const navigation = useNavigation<any>(); // Use any type for simplicity with multiple navigators
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuthStore();
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  // Show loading state only when refreshing after initial load OR initial load with no assets
  const showLoading = isLoading || isRefreshing;

  const progressAnim = useRef(new Animated.Value(0)).current; // Initial value for progress animation
  const rotateAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  useEffect(() => {
    if (showLoading) {
      // Reset and start progress animation
      progressAnim.setValue(0);
      Animated.loop(
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1000, // Animation duration
          easing: Easing.linear, // Linear animation
          useNativeDriver: false, // useNativeDriver is not supported for width animation
        })
      ).start((status) => {
        // Restart animation if it finishes while still loading
        if (status.finished && showLoading) {
          progressAnim.setValue(0);
          Animated.loop(
            Animated.timing(progressAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.linear,
              useNativeDriver: false,
            })
          ).start();
        }
      });
    } else {
      // Stop animation when not loading
      progressAnim.stopAnimation(); // Stop any running animation
    }
    // Cleanup animation on unmount
    return () => {
      progressAnim.removeAllListeners(); // Clean up listeners on unmount
      progressAnim.stopAnimation(); // Stop any running animation
    };
  }, [showLoading, progressAnim]);

  // Interpolate progress animation for width or translation
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"], // Animate width from 0% to 100%
  });

  // Add effect to load assets when component mounts or user changes
  useEffect(() => {
    const initializeAssets = async () => {
      // Load assets if user is logged in, we haven't attempted to load yet, and store is not loading
      if (user && !hasAttemptedLoad && !isLoading) {
        console.log("HomeScreen: Loading assets for user:", user.uid);
        try {
          await loadAssets();
          console.log(
            "HomeScreen: loadAssets completed. isLoading:",
            portfolio.isLoading,
            "assets.length:",
            assets.length
          );
          setHasAttemptedLoad(true);
        } catch (error) {
          console.error("HomeScreen: Failed to load assets:", error);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to load your assets. Please try again.",
          });
          setHasAttemptedLoad(true);
        }
      }
    };

    initializeAssets();
  }, [user, isLoading, loadAssets, hasAttemptedLoad]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      portfolio.cleanup(); // Clean up the Firestore listener when component unmounts
    };
  }, [portfolio]);

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
    setIsRefreshing(true);
    try {
      await updatePrices();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Prices updated successfully",
      });
    } catch (error) {
      console.error("HomeScreen: Failed to refresh prices:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  console.log("HomeScreen: Rendering main content");

  if (showLoading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-black">
        <StyledView className="w-3/4 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "#34D399", // A green color for the progress bar
                width: progressWidth,
              },
            ]}
          />
        </StyledView>
        <StyledText className="text-white text-lg">
          Loading Portfolio...
        </StyledText>
      </StyledView>
    );
  }

  // Show empty state if not loading and no assets
  if (!showLoading && assets.length === 0) {
    return (
      <StyledView className="flex-1 bg-gray-50 dark:bg-gray-900 justify-center items-center px-4">
        <Ionicons name="wallet-outline" size={64} color="#6B7280" />
        <StyledText className="text-gray-500 dark:text-gray-400 text-center mt-4 text-lg">
          Your portfolio is empty.
        </StyledText>
        <StyledText className="text-gray-500 dark:text-gray-400 text-center mt-2 mb-4">
          Add your first asset to get started!
        </StyledText>
        <AddAssetForm />
      </StyledView>
    );
  }

  return (
    <StyledView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <StyledView className="flex-row justify-between items-center px-4 pt-12 pb-4">
        <StyledView className="mt-4">
          <StyledText className="text-2xl font-bold text-dark dark:text-white">
            Portfolio Value
          </StyledText>
          <StyledText className="text-4xl font-bold text-primary mt-2">
            {formatCurrency(totalValue)}
          </StyledText>
          {assets.length > 0 && (
            <StyledView className="flex-row items-center mt-1">
              <StyledText
                className={`text-lg font-semibold ${
                  totalGainLoss >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {totalGainLoss >= 0 ? "+" : ""}
                {formatCurrency(totalGainLoss)}
              </StyledText>
              <StyledText className="text-gray-500 dark:text-gray-400 ml-2">
                (
                {((totalGainLoss / (totalValue - totalGainLoss)) * 100).toFixed(
                  2
                )}
                %)
              </StyledText>
            </StyledView>
          )}
        </StyledView>
        <StyledTouchableOpacity
          onPress={() => navigation.navigate("SettingsModal")}
          className="mt-4"
        >
          <Ionicons name="settings-outline" size={24} color="#1F2937" />
        </StyledTouchableOpacity>
      </StyledView>

      <StyledScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={showLoading} onRefresh={onRefresh} />
        }
      >
        <AddAssetForm />

        {assets.length > 0 && (
          <StyledView className="mb-4">
            <StyledTouchableOpacity
              onPress={() => setIsChartExpanded(!isChartExpanded)}
              className="flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-2"
            >
              <StyledView className="flex-row items-center">
                <Ionicons name="pie-chart-outline" size={24} color="#6B7280" />
                <StyledText className="text-lg font-semibold text-dark dark:text-white ml-2">
                  Portfolio Distribution
                </StyledText>
              </StyledView>
              <Ionicons
                name={
                  isChartExpanded
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={24}
                color="#6B7280"
              />
            </StyledTouchableOpacity>

            {isChartExpanded && (
              <ErrorBoundary fallback={<ChartErrorFallback />}>
                <PortfolioChart assets={assets} />
              </ErrorBoundary>
            )}
          </StyledView>
        )}

        <StyledView className="mb-4">
          <StyledText className="text-xl font-semibold text-dark dark:text-white mb-2">
            Your Assets
          </StyledText>
          {assets.length === 0 ? (
            <StyledText className="text-gray-500 dark:text-gray-400 text-center py-4">
              No assets added yet. Add your first asset above!
            </StyledText>
          ) : (
            <FlashList<Asset>
              data={assets}
              extraData={expandedAssetId}
              renderItem={({ item }) => (
                <AssetCard
                  key={item.id}
                  asset={item}
                  isExpanded={item.id === expandedAssetId}
                  onToggleExpand={() =>
                    setExpandedAssetId(
                      item.id === expandedAssetId ? null : item.id
                    )
                  }
                />
              )}
              estimatedItemSize={100}
              overrideItemLayout={(layout, item) => {
                layout.size = item.id === expandedAssetId ? 250 : 100;
              }}
            />
          )}
        </StyledView>
      </StyledScrollView>
      <Toast />
    </StyledView>
  );
};
