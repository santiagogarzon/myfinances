import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  View,
  Text,
  AppState,
  AppStateStatus,
  TouchableOpacity as RNTouchableOpacity,
  Dimensions,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { useAuthStore } from "../store/authStore";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { RootStackParamList, NavigationRef } from "../types/navigation";
import { useSettingsStore } from "../store/settingsStore";
import { styled } from "nativewind";
import SettingsModal from "../components/SettingsModal";
import { LockScreen } from "../components/LockScreen";
import LottieView from "lottie-react-native";
import { notificationService } from "../services/notificationService";
import Toast from "react-native-toast-message";
import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { BlurView } from "expo-blur";

const Stack = createNativeStackNavigator<RootStackParamList>();
const StyledView = styled(View);
const StyledBlurView = styled(BlurView);

export const AppNavigator: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { loadSettings, privacyMode, isBiometricEnabled } = useSettingsStore();
  const [isReady, setIsReady] = useState(false);
  const navigationRef = React.useRef<NavigationRef>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [lastUnlockTime, setLastUnlockTime] = useState<number | null>(null);
  const [isInBackground, setIsInBackground] = useState(false);
  const colorScheme = useColorScheme();

  // Initialize app state
  React.useEffect(() => {
    const initialize = async () => {
      try {
        await loadSettings();
        setIsReady(true);
        setSettingsLoaded(true);
      } catch (error) {
        console.error("AppNavigator: Failed to initialize:", error);
      }
    };
    initialize();
  }, []);

  // Handle app state changes
  React.useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        console.log("AppNavigator: App state changed", {
          from: appState,
          to: nextAppState,
          lastUnlockTime,
          timeSinceUnlock: lastUnlockTime ? Date.now() - lastUnlockTime : null,
          privacyMode,
          isLocked,
          user: !!user,
          settingsLoaded,
        });

        // Only handle state changes if we have a user and settings are loaded
        if (!user || !settingsLoaded) {
          console.log(
            "AppNavigator: Skipping state change - no user or settings not loaded"
          );
          return;
        }

        // Update background state
        setIsInBackground(
          nextAppState === "background" || nextAppState === "inactive"
        );

        // Don't lock if we just unlocked (within the last 2 seconds)
        const justUnlocked =
          lastUnlockTime && Date.now() - lastUnlockTime < 2000;

        if (nextAppState === "active" && appState !== "active") {
          if (isBiometricEnabled && !justUnlocked) {
            setIsLocked(true);
          }
        } else if (nextAppState === "background" && appState !== "background") {
          if (isBiometricEnabled && !justUnlocked) {
            setIsLocked(true);
          }
        } else if (nextAppState === "inactive" && appState !== "inactive") {
          if (isBiometricEnabled && !justUnlocked) {
            setIsLocked(true);
          }
        }
        setAppState(nextAppState);
      }
    );

    return () => {
      subscription.remove();
    };
  }, [appState, user, privacyMode, settingsLoaded, lastUnlockTime]);

  // Determine if the app should be locked on initial load
  React.useEffect(() => {
    console.log("AppNavigator: Checking initial lock state", {
      settingsLoaded,
      user: !!user,
      isBiometricEnabled,
      lastUnlockTime,
      currentLockState: isLocked,
    });

    if (settingsLoaded && user) {
      const shouldBeLocked = isBiometricEnabled;
      console.log("AppNavigator: Should be locked?", {
        shouldBeLocked,
        reason: "Initial load with biometrics enabled",
      });

      if (!lastUnlockTime) {
        console.log(
          "AppNavigator: Setting initial lock state to:",
          shouldBeLocked
        );
        setIsLocked(shouldBeLocked);
      }
    } else if (!user) {
      console.log("AppNavigator: User logged out, resetting lock state");
      setIsLocked(false);
      setLastUnlockTime(null);
    }
  }, [user, privacyMode, isBiometricEnabled, settingsLoaded, lastUnlockTime]);

  // Add a debug effect to monitor lock state changes
  React.useEffect(() => {
    console.log("AppNavigator: Lock state changed", {
      isLocked,
      isBiometricEnabled,
      user: !!user,
      settingsLoaded,
      lastUnlockTime,
      appState,
    });
  }, [
    isLocked,
    isBiometricEnabled,
    user,
    settingsLoaded,
    lastUnlockTime,
    appState,
  ]);

  const handleUnlock = () => {
    console.log("AppNavigator: Unlocking app");
    setIsLocked(false);
    setLastUnlockTime(Date.now());
  };

  // Set up notification listeners
  useEffect(() => {
    // Register for push notifications
    const setupNotifications = async () => {
      try {
        await notificationService.registerForPushNotifications();
      } catch (error) {
        console.error("Error setting up notifications:", error);
      }
    };

    setupNotifications();

    // Set up notification listeners
    const cleanup = notificationService.setupNotificationListeners(
      // Handle received notification
      (notification) => {
        console.log("Notification received:", notification);
        // You can show a toast or handle the notification here
        const title = notification.request.content.title || "";
        const body = notification.request.content.body || "";

        Toast.show({
          type: "info",
          text1: title,
          text2: body,
        });
      },
      // Handle notification response (when user taps the notification)
      (response) => {
        console.log("Notification response:", response);
        const data = response.notification.request.content.data;

        // Handle different notification types
        if (data?.type === "price_change" && data?.assetId) {
          // Navigate to the asset details or handle the price change
          const navigation = navigationRef.current;
          if (navigation) {
            (navigation as NavigationProp<ParamListBase>).navigate("Home", {
              screen: "AssetDetails",
              params: { assetId: data.assetId },
            });
          }
        }
      }
    );

    // Cleanup listeners on unmount
    return () => {
      cleanup();
      notificationService.removeTokenFromFirestore();
    };
  }, []);

  // Show loading screen only during initial load
  if (!isReady || isAuthLoading) {
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
          backgroundColor:
            colorScheme === "dark"
              ? "#1F2937" // Solid gray-800
              : "#FFFFFF", // Solid white
        }}
      >
        <StyledView
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
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
      </StyledView>
    );
  }

  // Log the final render state
  console.log("AppNavigator: Rendering with state", {
    isLocked,
    isBiometricEnabled,
    user: !!user,
    settingsLoaded,
    appState,
    lastUnlockTime,
    isInBackground,
  });

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        {!isReady || isAuthLoading ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {isLocked ? (
              <Stack.Screen
                name="Lock"
                component={LockScreen}
                initialParams={{
                  onUnlock: handleUnlock,
                  onShowPasscode: () => {
                    console.log("AppNavigator: Showing passcode screen");
                    navigationRef.current?.navigate("PasscodeSetup", {
                      intendedAction: "verify",
                      onUnlock: handleUnlock,
                    });
                  },
                }}
                options={{
                  animation: "fade",
                  presentation: "transparentModal",
                  gestureEnabled: false,
                }}
              />
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen
                  name="SettingsModal"
                  component={SettingsModal}
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />
              </>
            )}
          </>
        )}
      </Stack.Navigator>

      {/* Blur overlay when app is in background */}
      {isInBackground && user && !isLocked && (
        <StyledBlurView
          intensity={100}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      )}
    </NavigationContainer>
  );
};
