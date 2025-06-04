import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import Toast from "react-native-toast-message";
import { enableScreens } from "react-native-screens";
import { useAuthStore } from "./src/store/authStore";
import { LogBox } from "react-native";
import { styled } from "nativewind";

// Enable screens for better performance
enableScreens();

const StyledSafeAreaProvider = styled(SafeAreaProvider);

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        unsubscribe = await initializeAuth();
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Failed to initialize authentication. Please restart the app.",
        });
      }
    };

    initAuth();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array since we only want to initialize once

  return (
    <StyledSafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
      <Toast />
    </StyledSafeAreaProvider>
  );
}

export default App;
