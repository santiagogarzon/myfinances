import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { styled } from "nativewind";
import { useSettingsStore } from "../store/settingsStore";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";

const PASSCODE_STORAGE_KEY = "app_passcode";

const setPasscode = async (passcode: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(PASSCODE_STORAGE_KEY, passcode);
    console.log("Passcode stored successfully.");
  } catch (error) {
    console.error("Error storing passcode:", error);
    throw new Error("Failed to store passcode.");
  }
};

const checkPasscode = async (passcode: string): Promise<boolean> => {
  try {
    const storedPasscode = await SecureStore.getItemAsync(PASSCODE_STORAGE_KEY);
    if (storedPasscode === null) {
      console.log("No passcode stored.");
      return false;
    }
    return storedPasscode === passcode;
  } catch (error) {
    console.error("Error checking passcode:", error);
    throw new Error("Failed to check passcode.");
  }
};

const hasPasscode = async (): Promise<boolean> => {
  try {
    const storedPasscode = await SecureStore.getItemAsync(PASSCODE_STORAGE_KEY);
    return storedPasscode !== null;
  } catch (error) {
    console.error("Error checking for passcode existence:", error);
    return false;
  }
};

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity) as React.ComponentType<
  React.ComponentProps<typeof TouchableOpacity> & { className?: string }
>;
const StyledKeyboardAvoidingView = styled(KeyboardAvoidingView);

interface PasscodeSetupProps {
  onUnlock?: () => void; // Optional prop for verification mode (when used by LockScreen)
  intendedAction?: "setup" | "verify" | "change"; // New prop to specify the purpose
}

export const PasscodeSetup: React.FC<PasscodeSetupProps> = ({
  onUnlock,
  intendedAction = "setup", // New prop to specify the purpose
}) => {
  const [passcode, setPasscodeState] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);

  console.log("PasscodeSetup: intendedAction =", intendedAction);

  const { setIsPasscodeEnabled } = useSettingsStore(); // Assuming a setter exists

  const navigation = useNavigation();

  const handleSetPasscode = async () => {
    console.log("PasscodeSetup: Calling handleSetPasscode");
    if (passcode.length < 4) {
      setError("Passcode must be at least 4 digits.");
      return;
    }
    if (passcode !== confirmPasscode) {
      setError("Passcodes do not match.");
      return;
    }

    setError(null);
    try {
      await setPasscode(passcode); // Save the passcode securely
      setIsPasscodeEnabled(true); // Enable passcode in settings
      Alert.alert("Success", "Passcode set successfully.");
      if (intendedAction === "setup") {
        navigation.goBack();
      } else if (intendedAction === "verify" && onUnlock) {
        onUnlock();
      }
    } catch (err) {
      console.error("Error setting passcode:", err);
      setError("Failed to set passcode. Please try again.");
    }
  };

  const handleVerifyPasscode = async () => {
    console.log("PasscodeSetup: Calling handleVerifyPasscode");
    if (passcode.length < 4) {
      setError("Please enter your passcode.");
      return;
    }

    setError(null);
    try {
      const isCorrect = await checkPasscode(passcode); // Check the entered passcode
      if (isCorrect) {
        console.log("Passcode verification successful.");
        if (intendedAction === "verify" && onUnlock) {
          onUnlock();
        } else if (intendedAction === "change") {
          setPasscodeState(""); // Clear passcode input
          setConfirmPasscode(""); // Clear confirm input
          setError(null); // Clear any error messages
        } else if (intendedAction === "verify") {
          console.warn(
            "Passcode verified in verify mode, but no onUnlock callback provided."
          );
          navigation.goBack(); // Go back as a fallback
        }
      } else {
        setError("Incorrect passcode.");
      }
    } catch (err) {
      console.error("Error verifying passcode:", err);
      setError("Failed to verify passcode. Please try again.");
    }
  };

  return (
    <StyledView className="flex-1 bg-gray-900 justify-center items-center p-6">
      <StyledKeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, width: "100%" }}
        keyboardVerticalOffset={0}
      >
        <StyledText className="text-white text-2xl font-bold mb-8">
          {intendedAction === "setup"
            ? "Set Your Passcode"
            : intendedAction === "change"
            ? "Verify Current Passcode"
            : "Enter Your Passcode"}
        </StyledText>
        <StyledTextInput
          className="w-full p-4 bg-gray-800 rounded-lg text-white text-lg text-center mb-4"
          placeholder="Enter Passcode"
          placeholderTextColor="#6B7280"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6} // Common passcode length
          value={passcode}
          onChangeText={(text) => setPasscodeState(text.replace(/[^0-9]/g, ""))} // Allow only numeric input
        />
        {intendedAction === "setup" && (
          <StyledTextInput
            className="w-full p-4 bg-gray-800 rounded-lg text-white text-lg text-center mb-6"
            placeholder="Confirm Passcode"
            placeholderTextColor="#6B7280"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            value={confirmPasscode}
            onChangeText={(text) =>
              setConfirmPasscode(text.replace(/[^0-9]/g, ""))
            } // Allow only numeric input
          />
        )}

        {error && <StyledText className="text-danger mb-4">{error}</StyledText>}

        <StyledTouchableOpacity
          onPress={
            intendedAction === "setup"
              ? handleSetPasscode
              : handleVerifyPasscode
          }
          className="w-full p-4 bg-primary rounded-lg mb-4"
          onPressIn={() =>
            console.log(
              "PasscodeSetup: Primary button pressed. intendedAction =",
              intendedAction,
              "Calling:",
              intendedAction === "setup"
                ? "handleSetPasscode"
                : "handleVerifyPasscode"
            )
          }
        >
          <StyledText className="text-white text-lg font-semibold text-center">
            {intendedAction === "setup"
              ? "Set Passcode"
              : intendedAction === "change"
              ? "Verify"
              : "Unlock"}
          </StyledText>
        </StyledTouchableOpacity>

        {intendedAction === "verify" && (
          <StyledTouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-full p-4 rounded-lg border border-gray-600"
          >
            <StyledText className="text-gray-300 text-lg font-semibold text-center">
              Cancel
            </StyledText>
          </StyledTouchableOpacity>
        )}

        {intendedAction === "setup" && (
          <StyledTouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-full p-4 rounded-lg border border-gray-600 mt-2"
          >
            <StyledText className="text-gray-300 text-lg font-semibold text-center">
              Cancel
            </StyledText>
          </StyledTouchableOpacity>
        )}
      </StyledKeyboardAvoidingView>
    </StyledView>
  );
};

const styles = StyleSheet.create({
  // Styles handled by NativeWind
});
 