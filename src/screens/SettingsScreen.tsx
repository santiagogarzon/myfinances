import React, { useEffect, useState } from "react";
import { View, Text, Switch, TouchableOpacity, ScrollView } from "react-native";
import { styled } from "nativewind";
import { useSettingsStore } from "../store/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

export const SettingsScreen: React.FC = () => {
  const {
    isPrivacyModeEnabled,
    isBiometricEnabled,
    setPrivacyMode,
    setBiometricEnabled,
    checkBiometricAvailability,
  } = useSettingsStore();

  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability().then(setIsBiometricAvailable);
  }, []);

  const handlePrivacyModeToggle = async (value: boolean) => {
    try {
      await setPrivacyMode(value);
      Toast.show({
        type: "success",
        text1: "Privacy Mode",
        text2: value ? "Privacy mode enabled" : "Privacy mode disabled",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update privacy mode",
      });
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value && !isBiometricAvailable) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Biometric authentication is not available on this device",
        });
        return;
      }
      await setBiometricEnabled(value);
      Toast.show({
        type: "success",
        text1: "Biometric Authentication",
        text2: value
          ? "Biometric authentication enabled"
          : "Biometric authentication disabled",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update biometric settings",
      });
    }
  };

  return (
    <StyledScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <StyledView className="p-4">
        <StyledView className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
          <StyledView className="p-4 border-b border-gray-200 dark:border-gray-700">
            <StyledText className="text-lg font-semibold text-dark dark:text-white mb-2">
              Privacy & Security
            </StyledText>
            <StyledText className="text-gray-500 dark:text-gray-400">
              Manage your privacy and security settings
            </StyledText>
          </StyledView>

          <StyledView className="p-4">
            <StyledView className="flex-row justify-between items-center mb-4">
              <StyledView className="flex-1 mr-4">
                <StyledText className="text-dark dark:text-white font-medium mb-1">
                  Privacy Mode
                </StyledText>
                <StyledText className="text-gray-500 dark:text-gray-400 text-sm">
                  Lock your portfolio when the app is in the background
                </StyledText>
              </StyledView>
              <Switch
                value={isPrivacyModeEnabled}
                onValueChange={handlePrivacyModeToggle}
                trackColor={{ false: "#D1D5DB", true: "#007AFF" }}
                thumbColor={isPrivacyModeEnabled ? "#FFFFFF" : "#F3F4F6"}
              />
            </StyledView>

            <StyledView className="flex-row justify-between items-center">
              <StyledView className="flex-1 mr-4">
                <StyledText className="text-dark dark:text-white font-medium mb-1">
                  Biometric Authentication
                </StyledText>
                <StyledText className="text-gray-500 dark:text-gray-400 text-sm">
                  Use Face ID or Touch ID to unlock your portfolio
                </StyledText>
              </StyledView>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!isBiometricAvailable}
                trackColor={{ false: "#D1D5DB", true: "#007AFF" }}
                thumbColor={isBiometricEnabled ? "#FFFFFF" : "#F3F4F6"}
              />
            </StyledView>
          </StyledView>
        </StyledView>

        {!isBiometricAvailable && (
          <StyledView className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
            <StyledView className="flex-row items-start">
              <Ionicons
                name="warning"
                size={20}
                color="#92400E"
                className="mt-0.5"
              />
              <StyledView className="ml-2 flex-1">
                <StyledText className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Biometric Authentication Not Available
                </StyledText>
                <StyledText className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                  Your device doesn't support biometric authentication or it's
                  not set up.
                </StyledText>
              </StyledView>
            </StyledView>
          </StyledView>
        )}
      </StyledView>
    </StyledScrollView>
  );
};
