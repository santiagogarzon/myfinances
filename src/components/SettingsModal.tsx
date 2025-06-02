import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { styled } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";
import { useNavigation } from "@react-navigation/native";
import { removePasscode } from "../utils/passcodeUtils";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

const SettingsModal: React.FC = () => {
  const { logout } = useAuthStore();
  const {
    isBiometricEnabled,
    setIsBiometricEnabled,
    isPasscodeEnabled,
    setIsPasscodeEnabled,
    privacyMode,
    setPrivacyMode,
  } = useSettingsStore();

  const navigation = useNavigation();

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
    <StyledScrollView className="flex-1 p-4 bg-gray-100 dark:bg-gray-900">
      <StyledView className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <StyledText className="text-lg font-semibold text-dark dark:text-white mb-3">
          Privacy Mode
        </StyledText>
        <StyledText className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Control when the app locks and requires authentication.
        </StyledText>
        <StyledTouchableOpacity
          className={`flex-row items-center py-3 px-4 rounded-lg mb-2 ${
            privacyMode === "off"
              ? "bg-primary"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
          onPress={() => setPrivacyMode("off")}
        >
          <StyledText
            className={`${
              privacyMode === "off" ? "text-white" : "text-dark dark:text-white"
            }`}
          >
            Off
          </StyledText>
        </StyledTouchableOpacity>
        <StyledTouchableOpacity
          className={`flex-row items-center py-3 px-4 rounded-lg mb-2 ${
            privacyMode === "on_app_close"
              ? "bg-primary"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
          onPress={() => setPrivacyMode("on_app_close")}
        >
          <StyledText
            className={`${
              privacyMode === "on_app_close"
                ? "text-white"
                : "text-dark dark:text-white"
            }`}
          >
            Lock when app is closed
          </StyledText>
        </StyledTouchableOpacity>
        <StyledTouchableOpacity
          className={`flex-row items-center py-3 px-4 rounded-lg ${
            privacyMode === "on_app_background"
              ? "bg-primary"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
          onPress={() => setPrivacyMode("on_app_background")}
        >
          <StyledText
            className={`${
              privacyMode === "on_app_background"
                ? "text-white"
                : "text-dark dark:text-white"
            }`}
          >
            Lock when app goes to background
          </StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      <StyledView className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <StyledText className="text-lg font-semibold text-dark dark:text-white mb-3">
          Biometric Authentication
        </StyledText>
        <StyledText className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Unlock with Face ID or Touch ID (if available).
        </StyledText>
        <StyledTouchableOpacity
          className={`flex-row items-center py-3 px-4 rounded-lg ${
            isBiometricEnabled ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
          }`}
          onPress={() => setIsBiometricEnabled(!isBiometricEnabled)}
        >
          <StyledText
            className={`${
              isBiometricEnabled ? "text-white" : "text-dark dark:text-white"
            }`}
          >
            {isBiometricEnabled ? "Enabled" : "Enable Biometric Authentication"}
          </StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      {/* <StyledView className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <StyledText className="text-lg font-semibold text-dark dark:text-white mb-3">
          Passcode
        </StyledText>
        <StyledText className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Set or change your passcode for unlocking the app.
        </StyledText>
        {isPasscodeEnabled ? (
          <StyledTouchableOpacity
            onPress={() =>
              navigation.navigate("PasscodeSetup", {
                intendedAction: "change",
              })
            }
            className="flex-row items-center py-3 px-4 rounded-lg bg-gray-200 dark:bg-gray-700"
          >
            <StyledText className="text-dark dark:text-white">
              Change Passcode
            </StyledText>
          </StyledTouchableOpacity>
        ) : (
          <StyledTouchableOpacity
            onPress={() => navigation.navigate("PasscodeSetup")}
            className="flex-row items-center py-3 px-4 rounded-lg bg-primary"
          >
            <StyledText className="text-white">Set Passcode</StyledText>
          </StyledTouchableOpacity>
        )}
        {isPasscodeEnabled && (
          <StyledTouchableOpacity
            onPress={handleDisablePasscode}
            className="flex-row items-center py-3 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 mt-2"
          >
            <StyledText className="text-danger dark:text-red-400">
              Disable Passcode
            </StyledText>
          </StyledTouchableOpacity>
        )}
      </StyledView> */}

      <StyledTouchableOpacity
        className="w-full p-4 bg-danger rounded-lg mt-4"
        onPress={handleLogout}
      >
        <StyledText className="text-white text-lg font-semibold text-center">
          Logout
        </StyledText>
      </StyledTouchableOpacity>
    </StyledScrollView>
  );
};

export default SettingsModal;
