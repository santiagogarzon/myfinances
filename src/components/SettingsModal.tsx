import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { styled } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";
import { useNavigation } from "@react-navigation/native";
import { removePasscode } from "../utils/passcodeUtils";
import * as LocalAuthentication from "expo-local-authentication";
import Constants from "expo-constants";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledKeyboardAvoidingView = styled(KeyboardAvoidingView);

const SettingsModal: React.FC = () => {
  const { logout } = useAuthStore();
  const {
    isBiometricEnabled,
    setBiometricEnabled,
    isPasscodeEnabled,
    setIsPasscodeEnabled,
    privacyMode,
    setPrivacyMode,
    notificationPreferences,
    setNotificationPreference,
  } = useSettingsStore();

  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        if (Constants.appOwnership === "expo") {
          setIsBiometricAvailable(false);
          return;
        }

        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricAvailable(compatible && enrolled);
      } catch (error) {
        console.error("Error checking biometrics:", error);
        setIsBiometricAvailable(false);
      }
    };

    checkBiometrics();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value) {
        // When enabling biometric, also set privacy mode to on_app_background
        await setPrivacyMode("on_app_background");
      } else {
        // When disabling biometric, turn off privacy mode
        await setPrivacyMode("off");
      }
      await setBiometricEnabled(value);
    } catch (error) {
      console.error("Failed to update biometric settings:", error);
      Alert.alert("Error", "Could not update biometric settings.");
    }
  };

  const handleDisablePasscode = () => {
    Alert.alert(
      "Disable Passcode",
      "Are you sure you want to disable your passcode? You will need to set it up again to use this feature.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            try {
              await removePasscode();
              setIsPasscodeEnabled(false);
              Alert.alert("Success", "Passcode disabled.");
            } catch (error) {
              console.error("Failed to disable passcode:", error);
              Alert.alert("Error", "Could not disable passcode.");
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.goBack();
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Logout Failed", "Could not log out. Please try again.");
    }
  };

  return (
    <StyledKeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <StyledScrollView className="flex-1 p-4 bg-gray-100 dark:bg-gray-900">
        {isBiometricAvailable && (
          <StyledView className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <StyledText className="text-lg font-semibold text-dark dark:text-white mb-3">
              Security
            </StyledText>
            <StyledText className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Use Face ID or Touch ID to secure your portfolio when the app is
              in the background.
            </StyledText>
            <StyledTouchableOpacity
              className={`flex-row items-center py-3 px-4 rounded-lg ${
                isBiometricEnabled
                  ? "bg-primary"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
              onPress={() => handleBiometricToggle(!isBiometricEnabled)}
            >
              <StyledText
                className={`${
                  isBiometricEnabled
                    ? "text-white"
                    : "text-dark dark:text-white"
                }`}
              >
                {isBiometricEnabled ? "Security Enabled" : "Enable Security"}
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        )}

        <StyledView className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <StyledText className="text-lg font-semibold text-dark dark:text-white mb-3">
            Notifications
          </StyledText>
          <StyledText className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose which notifications you want to receive.
          </StyledText>

          <StyledView className="space-y-4">
            <StyledView className="flex-row items-center justify-between">
              <StyledView className="flex-1">
                <StyledText className="text-dark dark:text-white font-medium">
                  Price Alerts
                </StyledText>
                <StyledText className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when your assets have significant price changes
                </StyledText>
              </StyledView>
              <Switch
                value={notificationPreferences.priceAlerts}
                onValueChange={(value) =>
                  setNotificationPreference("priceAlerts", value)
                }
                trackColor={{ false: "#767577", true: "#34D399" }}
                thumbColor={
                  notificationPreferences.priceAlerts ? "#10B981" : "#f4f3f4"
                }
              />
            </StyledView>

            <StyledView className="flex-row items-center justify-between">
              <StyledView className="flex-1">
                <StyledText className="text-dark dark:text-white font-medium">
                  Portfolio Summary
                </StyledText>
                <StyledText className="text-sm text-gray-600 dark:text-gray-400">
                  Receive daily summaries of your portfolio performance
                </StyledText>
              </StyledView>
              <Switch
                value={notificationPreferences.portfolioSummary}
                onValueChange={(value) =>
                  setNotificationPreference("portfolioSummary", value)
                }
                trackColor={{ false: "#767577", true: "#34D399" }}
                thumbColor={
                  notificationPreferences.portfolioSummary
                    ? "#10B981"
                    : "#f4f3f4"
                }
              />
            </StyledView>

            <StyledView className="flex-row items-center justify-between">
              <StyledView className="flex-1">
                <StyledText className="text-dark dark:text-white font-medium">
                  Market Updates
                </StyledText>
                <StyledText className="text-sm text-gray-600 dark:text-gray-400">
                  Get updates about market trends and news
                </StyledText>
              </StyledView>
              <Switch
                value={notificationPreferences.marketUpdates}
                onValueChange={(value) =>
                  setNotificationPreference("marketUpdates", value)
                }
                trackColor={{ false: "#767577", true: "#34D399" }}
                thumbColor={
                  notificationPreferences.marketUpdates ? "#10B981" : "#f4f3f4"
                }
              />
            </StyledView>
          </StyledView>
        </StyledView>

        <StyledTouchableOpacity
          className="w-full p-4 bg-danger rounded-lg mt-4"
          onPress={handleLogout}
        >
          <StyledText className="text-white text-lg font-semibold text-center">
            Logout
          </StyledText>
        </StyledTouchableOpacity>
      </StyledScrollView>
    </StyledKeyboardAvoidingView>
  );
};

export default SettingsModal;
