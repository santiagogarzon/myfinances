import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import Toast from "react-native-toast-message";
import { enableScreens } from "react-native-screens";
import { useAuthStore } from "./src/store/authStore";
import { LogBox } from "react-native";

// Enable screens for better performance
enableScreens();

// Ignore specific warnings
LogBox.ignoreLogs([
  "AsyncStorage has been extracted from react-native",
  "Non-serializable values were found in the navigation state",
]);

export default function App() {
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
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
      <Toast />
    </SafeAreaProvider>
  );
}
