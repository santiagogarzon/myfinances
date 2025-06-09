import React, { useEffect, useState } from "react";
import {
  View,
  Text,
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
import * as LocalAuthentication from "expo-local-authentication";
import Constants from "expo-constants";
import { auth } from "../config/firebase";
import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledKeyboardAvoidingView = styled(KeyboardAvoidingView);

const SettingsModal: React.FC = () => {
  const { logout, user } = useAuthStore();
  const {
    isBiometricEnabled,
    setBiometricEnabled,
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

  const handleDeleteAccount = async () => {
    // First confirmation
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Ask for password for reauthentication
            Alert.prompt(
              "Confirm Password",
              "Please enter your password to confirm account deletion",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async (password) => {
                    if (!password) {
                      Alert.alert(
                        "Error",
                        "Password is required to delete account"
                      );
                      return;
                    }

                    try {
                      const currentUser = auth.currentUser;
                      if (!currentUser || !currentUser.email) {
                        throw new Error("No user logged in");
                      }

                      // Show loading state
                      Alert.alert(
                        "Deleting Account",
                        "Please wait while we delete your account...",
                        [{ text: "OK" }],
                        { cancelable: false }
                      );

                      // Reauthenticate user
                      const credential = EmailAuthProvider.credential(
                        currentUser.email,
                        password
                      );
                      await reauthenticateWithCredential(
                        currentUser,
                        credential
                      );

                      // Delete user data from AsyncStorage
                      await AsyncStorage.multiRemove([
                        "@privacy_mode",
                        "@biometric_enabled",
                        "@passcode_enabled",
                        "@notification_preferences",
                      ]);

                      // Delete the user account using the auth instance
                      await deleteUser(currentUser);

                      // Logout and navigate to login
                      await logout();
                      navigation.navigate("Login" as never);
                    } catch (error: any) {
                      console.error("Error deleting account:", error);
                      let errorMessage = "Failed to delete account. ";

                      if (error.code === "auth/wrong-password") {
                        errorMessage += "Incorrect password.";
                      } else if (error.code === "auth/requires-recent-login") {
                        errorMessage +=
                          "Please log out and log in again before deleting your account.";
                      } else if (error.code === "auth/network-request-failed") {
                        errorMessage +=
                          "Network error. Please check your connection.";
                      } else {
                        errorMessage += "Please try again later.";
                      }

                      Alert.alert("Error", errorMessage);
                    }
                  },
                },
              ],
              "secure-text"
            );
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Reset biometric and security settings
            await Promise.all([
              setBiometricEnabled(false),
              setPrivacyMode("off"),
              AsyncStorage.multiRemove([
                "@biometric_enabled",
                "@privacy_mode",
                "@passcode_enabled",
              ]),
            ]);

            // Perform logout
            await logout();
            navigation.navigate("Login" as never);
          } catch (error) {
            console.error("Error during logout:", error);
            Alert.alert(
              "Error",
              "Failed to logout properly. Please try again."
            );
          }
        },
      },
    ]);
  };

  return (
    <StyledKeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <StyledScrollView className="flex-1 p-4 bg-gray-100 dark:bg-gray-900">
        {/* {isBiometricAvailable && (
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
        )} */}

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

        {/* Delete Account Section */}
        <StyledView className="mt-8 mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <StyledText className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Danger Zone
          </StyledText>
          <StyledText className="text-sm text-red-700 dark:text-red-300 mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </StyledText>
          <StyledTouchableOpacity
            onPress={handleDeleteAccount}
            className="bg-red-600 dark:bg-red-700 p-3 rounded-lg"
          >
            <StyledView className="flex-row items-center justify-center">
              <Ionicons name="trash-outline" size={20} color="white" />
              <StyledText className="text-white font-semibold ml-2">
                Delete Account
              </StyledText>
            </StyledView>
          </StyledTouchableOpacity>
        </StyledView>

        {/* Logout Button */}
        <StyledTouchableOpacity
          onPress={handleLogout}
          className="mb-6 p-3 bg-gray-200 dark:bg-gray-700 rounded-lg"
        >
          <StyledView className="flex-row items-center justify-center">
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <StyledText className="text-red-500 font-semibold ml-2">
              Logout
            </StyledText>
          </StyledView>
        </StyledTouchableOpacity>
      </StyledScrollView>
    </StyledKeyboardAvoidingView>
  );
};

export default SettingsModal;
