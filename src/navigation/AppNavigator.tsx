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
import LottieView from "lottie-react-native";
import { notificationService } from "../services/notificationService";
import Toast from "react-native-toast-message";
import { NavigationProp, ParamListBase } from "@react-navigation/native";

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
  const [lastUnlockTime, setLastUnlockTime] = useState<number | null>(null);
  const colorScheme = useColorScheme();

  // Initialize app state
  React.useEffect(() => {
    const initialize = async () => {
      try {
        // console.log("AppNavigator: Initializing...");
        await loadSettings();
        setIsReady(true);
        setSettingsLoaded(true);
      } catch (error) {
        console.error("AppNavigator: Failed to initialize:", error);
      }
    };
    initialize();
  }, []);

  React.useEffect(() => {
    // console.log("AppNavigator - Auth State:", {
    //   isReady,
    //   isAuthLoading,
    //   hasUser: !!user,
    //   userId: user?.uid,
    // });
  }, [isReady, user, isAuthLoading]);

  // Handle app state changes for privacy mode
  React.useEffect(() => {
    let lockTimeout: NodeJS.Timeout;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // console.log("AppNavigator: App state changed from", appState, "to", nextAppState);
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        // App has come to the foreground
        if (user && privacyMode !== "off") {
          // Clear any existing timeout
          if (lockTimeout) {
            clearTimeout(lockTimeout);
          }

          // Only lock if it's been more than 2000ms since last unlock
          if (lastUnlockTime && Date.now() - lastUnlockTime > 2000) {
            setIsLocked(true);
          }
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background, clear the timeout and set last active time
        if (lockTimeout) {
          clearTimeout(lockTimeout);
        }
        // Set a timeout to lock after 2000ms of inactivity
        lockTimeout = setTimeout(() => {
          if (user && privacyMode !== "off") {
            setIsLocked(true);
          }
        }, 2000);
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
      if (lockTimeout) {
        clearTimeout(lockTimeout);
      }
    };
  }, [appState, user, privacyMode, lastUnlockTime]);

  // Determine if the app should be locked on initial load
  React.useEffect(() => {
    if (settingsLoaded && user) {
      const shouldBeLocked =
        privacyMode !== "off" && (isBiometricEnabled || isPasscodeEnabled);
      if (privacyMode !== "off" && !lastUnlockTime) {
        setIsLocked(shouldBeLocked);
      }
    } else if (!user) {
      // If user logs out, ensure it's not locked and reset states
      setIsLocked(false);
      setShowingPasscodeInput(false);
      setLastUnlockTime(null);
    }
  }, [
    user,
    privacyMode,
    isBiometricEnabled,
    isPasscodeEnabled,
    settingsLoaded,
    lastUnlockTime,
  ]);

  const handleUnlock = () => {
    setIsLocked(false);
    setShowingPasscodeInput(false);
    setLastUnlockTime(Date.now());
    // console.log("AppNavigator: App unlocked");
  };

  const handleShowPasscode = () => {
    setShowingPasscodeInput(true);
    // console.log("AppNavigator: Showing passcode input");
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
