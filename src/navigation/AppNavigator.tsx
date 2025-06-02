import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  View,
  ActivityIndicator,
  Text,
  AppState,
  AppStateStatus,
  TouchableOpacity as RNTouchableOpacity,
} from "react-native";
import { useAuthStore } from "../store/authStore";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { RootStackParamList, NavigationRef } from "../types/navigation";
import { useSettingsStore } from "../store/settingsStore";
import { styled } from "nativewind";
import SettingsModal from "../components/SettingsModal";
import { Easing, Animated } from "react-native";
import { LockScreen } from "../components/LockScreen";
import { PasscodeSetup } from "../components/PasscodeSetup";
import { Ionicons } from "@expo/vector-icons";

const Stack = createNativeStackNavigator<RootStackParamList>();
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(RNTouchableOpacity);

export const AppNavigator: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { loadSettings, privacyMode, isBiometricEnabled, isPasscodeEnabled } =
    useSettingsStore();
  const [isReady, setIsReady] = useState(false);
  const navigationRef = React.useRef<NavigationRef>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showingPasscodeInput, setShowingPasscodeInput] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  // Initialize app state
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("AppNavigator: Initializing...");
        await loadSettings();
        setIsReady(true);
        setSettingsLoaded(true);
      } catch (error) {
        console.error("AppNavigator: Failed to initialize:", error);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    console.log("AppNavigator - Auth State:", {
      isReady,
      isAuthLoading,
      hasUser: !!user,
      userId: user?.uid,
    });
  }, [isReady, user, isAuthLoading]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log("App State changed:", appState, "->", nextAppState);

      if (appState.match(/inactive|background/) && nextAppState === "active") {
        console.log("App has come to the foreground!");
        if (
          user &&
          settingsLoaded &&
          privacyMode !== "off" &&
          (isBiometricEnabled || isPasscodeEnabled)
        ) {
          if (privacyMode === "on_app_background") {
            setIsLocked(true);
          }
        }
      } else if (nextAppState.match(/inactive|background/)) {
        console.log("App has gone to the background.");
        if (
          user &&
          settingsLoaded &&
          privacyMode !== "off" &&
          (isBiometricEnabled || isPasscodeEnabled)
        ) {
          if (
            privacyMode === "on_app_close" ||
            privacyMode === "on_app_background"
          ) {
            setIsLocked(true);
          }
        }
      }
      setAppState(nextAppState);
    };

    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Check initial app state
    if (AppState.currentState !== "active") {
      if (
        user &&
        settingsLoaded &&
        privacyMode !== "off" &&
        (isBiometricEnabled || isPasscodeEnabled)
      ) {
        if (
          privacyMode === "on_app_close" ||
          privacyMode === "on_app_background"
        ) {
          setIsLocked(true);
        }
      }
    }

    return () => {
      appStateSubscription.remove();
    };
  }, [
    user,
    privacyMode,
    isBiometricEnabled,
    isPasscodeEnabled,
    settingsLoaded,
    appState,
  ]);

  // Determine if the app should be locked
  useEffect(() => {
    console.log("AppNavigator: User state changed", {
      user: !!user,
      privacyMode,
      isBiometricEnabled,
      isPasscodeEnabled,
      settingsLoaded,
    });

    if (settingsLoaded && user) {
      const shouldBeLocked =
        privacyMode !== "off" && (isBiometricEnabled || isPasscodeEnabled);
      console.log(
        "AppNavigator: Determining lock state. Should be locked:",
        shouldBeLocked
      );
      if (privacyMode !== "off") {
        setIsLocked(shouldBeLocked);
      }
    } else if (!user) {
      // If user logs out, ensure it's not locked and reset states
      setIsLocked(false);
      setShowingPasscodeInput(false);
    }
  }, [
    user,
    privacyMode,
    isBiometricEnabled,
    isPasscodeEnabled,
    settingsLoaded,
  ]);

  const handleUnlock = () => {
    setIsLocked(false);
    setShowingPasscodeInput(false);
    console.log("AppNavigator: App unlocked");
  };

  const handleShowPasscode = () => {
    setShowingPasscodeInput(true);
    console.log("AppNavigator: Showing passcode input");
  };

  // Show loading screen only during initial load
  if (!isReady || isAuthLoading) {
    return (
      <StyledView className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#34D399" />
        <StyledText className="text-white mt-4 text-lg">Loading...</StyledText>
      </StyledView>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : isLocked ? (
          // Lock Stack
          <>
            {showingPasscodeInput ? (
              <Stack.Screen
                name="PasscodeSetup"
                component={PasscodeSetup}
                initialParams={{
                  intendedAction: "verify",
                  onUnlock: handleUnlock,
                }}
              />
            ) : (
              <Stack.Screen
                name="Lock"
                component={LockScreen}
                initialParams={{
                  onUnlock: handleUnlock,
                  onShowPasscode: handleShowPasscode,
                }}
              />
            )}
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="PasscodeSetup"
              component={PasscodeSetup}
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="SettingsModal"
              component={SettingsModal}
              options={{
                presentation: "modal",
                headerShown: false, // Hide header for the modal itself
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
