import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  useColorScheme,
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
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { FinancialInsights } from "../components/FinancialInsights";
import LottieView from "lottie-react-native";

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
  const [showInsights, setShowInsights] = useState(false);
  const colorScheme = useColorScheme();

  // Show loading state only when refreshing after initial load OR initial load with no assets
  const showLoading = isLoading;

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

  // Keep only the notification response handling
  useEffect(() => {
    const handleLastNotificationResponse = async () => {
      const lastNotificationResponse =
        await Notifications.getLastNotificationResponseAsync();
      if (lastNotificationResponse) {
        // Handle the last notification response if needed
      }
    };

    handleLastNotificationResponse();

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // Handle notification response when the app is open
        const data = response.notification.request.content.data;
        if (data?.type === "price_change" && data?.assetId) {
          // Navigate to asset details if needed
        }
      });

    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Handle received notification when the app is in the foreground
        const title = notification.request.content.title;
        const body = notification.request.content.body;
        if (title && body) {
          Toast.show({
            type: "info",
            text1: title,
            text2: body,
          });
        }
      }
    );

    return () => {
      responseListener.remove();
      notificationListener.remove();
    };
  }, []);

  // Initial load and data fetching logic
  useEffect(() => {
    if (!hasAttemptedLoad && user) {
      // console.log("HomeScreen: Loading assets for user:", user.uid);
      loadAssets();
      setHasAttemptedLoad(true);
    }
  }, [user, hasAttemptedLoad, loadAssets]);

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
        text1: "Portfolio Error",
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

  // Full screen loader component
  const FullScreenLoader = () => {
    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;
    const animationSize = Math.min(screenWidth, screenHeight) * 0.8;
    return (
      <StyledView
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor:
            colorScheme === "dark"
              ? "#1F2937" // Solid gray-800
              : "#FFFFFF", // Solid white
        }}
      >
        <StyledView
          style={{
            width: animationSize,
            height: animationSize,
            backgroundColor: "transparent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LottieView
            source={require("../assets/loading-animation.json")}
            autoPlay
            loop
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "transparent",
            }}
          />
        </StyledView>
      </StyledView>
    );
  };

  if (showLoading && !isRefreshing) return <FullScreenLoader />;

  // Show empty state if not loading and no assets
  if (!showLoading && assets.length === 0) {
    return (
      <StyledView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <StyledView className="flex-1 justify-center items-center px-4">
          <StyledView className="items-center mb-8">
            <Ionicons
              name="wallet-outline"
              size={64}
              color="#6B7280"
              className="dark:text-gray-400"
            />
            <StyledText className="text-gray-500 dark:text-gray-400 text-center mt-4 text-lg">
              Your portfolio is empty.
            </StyledText>
            <StyledText className="text-gray-500 dark:text-gray-400 text-center mt-2">
              Add your first asset to get started!
            </StyledText>
          </StyledView>
          <StyledView className="w-full">
            <AddAssetForm />
          </StyledView>
        </StyledView>
      </StyledView>
    );
  }

  return (
    <StyledView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <StyledView className="flex-row justify-between items-center px-4 pt-12 pb-4 bg-white dark:bg-gray-800">
        <StyledView className="mt-4">
          <StyledText className="text-2xl font-bold text-gray-900 dark:text-white">
            Portfolio Value
          </StyledText>
          <StyledText className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {formatCurrency(totalValue)}
          </StyledText>
          {assets.length > 0 && (
            <StyledView className="flex-row items-center mt-1">
              <StyledText
                className={`text-lg font-semibold ${
                  totalGainLoss >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
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
          <Ionicons
            name="settings-outline"
            size={24}
            color={colorScheme === "dark" ? "#E5E7EB" : "#1F2937"}
          />
        </StyledTouchableOpacity>
      </StyledView>
      <StyledScrollView
        className="flex-1 bg-gray-100 dark:bg-gray-900 px-4 mt-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Platform.OS === "ios" ? "#6B7280" : undefined}
            colors={Platform.OS === "android" ? ["#6B7280"] : undefined}
          />
        }
      >
        <AddAssetForm />
        {/* Financial Insights Section */}
        {assets.length > 0 && (
          <StyledView className="mb-2">
            <StyledTouchableOpacity
              onPress={() => setShowInsights(!showInsights)}
              className="flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-2"
            >
              <StyledView className="flex-row items-center">
                <Ionicons
                  name="analytics-outline"
                  size={24}
                  color="#6B7280"
                  className="dark:text-gray-400"
                />
                <StyledText className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
                  Financial Insights
                </StyledText>
              </StyledView>
              <Ionicons
                name={
                  showInsights ? "chevron-up-outline" : "chevron-down-outline"
                }
                size={24}
                color="#6B7280"
                className="dark:text-gray-400"
              />
            </StyledTouchableOpacity>
            {showInsights && (
              <View className="mt-2 mx-2">
                <ErrorBoundary fallback={<ChartErrorFallback />}>
                  <FinancialInsights assets={assets} />
                </ErrorBoundary>
              </View>
            )}
          </StyledView>
        )}
        {/* Portfolio Chart Section */}
        {assets.length > 0 && (
          <StyledView className="mb-4">
            <StyledTouchableOpacity
              onPress={() => setIsChartExpanded(!isChartExpanded)}
              className="flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-2"
            >
              <StyledView className="flex-row items-center">
                <Ionicons
                  name="pie-chart-outline"
                  size={24}
                  color="#6B7280"
                  className="dark:text-gray-400"
                />
                <StyledText className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
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
                className="dark:text-gray-400"
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
          <StyledText className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
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
