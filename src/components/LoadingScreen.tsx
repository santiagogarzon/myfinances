import React from "react";
import { View, ActivityIndicator } from "react-native";

export const LoadingScreen: React.FC = () => {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
      <ActivityIndicator size={36} color="#007AFF" />
    </View>
  );
};
