import React from "react";
import { View, ActivityIndicator } from "react-native";

export const LoadingScreen: React.FC = () => {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};
