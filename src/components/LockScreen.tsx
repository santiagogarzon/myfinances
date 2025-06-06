import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";
import { styled } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { RootStackScreenProps } from "../types/navigation";
import Constants from "expo-constants";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

type LockScreenProps = RootStackScreenProps<"Lock">;

export const LockScreen: React.FC<LockScreenProps> = ({ route }) => {
  const { onUnlock, onShowPasscode } = route.params;
  const { isBiometricEnabled } = useSettingsStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState<
    boolean | null
  >(null);
  const [biometricType, setBiometricType] =
    useState<LocalAuthentication.AuthenticationType | null>(null);
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);

  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        if (Constants.appOwnership === "expo") {
          // console.log(
          //   "Running in Expo Go, disabling biometric authentication."
          // );
          setIsBiometricAvailable(false);
          return;
        }

        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsBiometricAvailable(compatible);
        if (compatible) {
          const types =
            await LocalAuthentication.supportedAuthenticationTypesAsync();
          setBiometricType(types[0] || null);

          // Only trigger authentication if biometrics are available and enabled
          if (isBiometricEnabled) {
            authenticate();
          }
        }
      } catch (error) {
        console.error("Error checking biometrics:", error);
        setIsBiometricAvailable(false);
      }
    };

    checkBiometrics();
  }, [isBiometricEnabled]);

  // Add a new effect to trigger authentication when biometrics become available
  useEffect(() => {
    if (isBiometricAvailable && isBiometricEnabled && !hasAttemptedAuth) {
      authenticate();
    }
  }, [isBiometricAvailable, isBiometricEnabled, hasAttemptedAuth]);

  const authenticate = async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    // Only clear error if this is a retry attempt
    if (hasAttemptedAuth) {
      setAuthError(null);
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock your portfolio",
        cancelLabel: "Cancel",
      });

      // console.log("LockScreen: Biometric authentication result:", result);

      if (result.success) {
        onUnlock();
      } else if (result.error === "user_cancel") {
        // Only show error message if this is a retry attempt
        if (hasAttemptedAuth) {
          setAuthError("Authentication cancelled.");
        }
      } else if (result.error === "system_cancel") {
        // Only show error message if this is a retry attempt
        if (hasAttemptedAuth) {
          setAuthError("Authentication cancelled by system. Try again.");
        }
      } else if (result.error === "lockout") {
        setAuthError(
          "Too many attempts. Authentication is temporarily locked."
        );
      } else {
        // Only show error message if this is a retry attempt
        if (hasAttemptedAuth) {
          setAuthError(`Authentication failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("LockScreen: Error during authentication:", error);
      // Only show error message if this is a retry attempt
      if (hasAttemptedAuth) {
        setAuthError("An unexpected error occurred during authentication.");
      }
    } finally {
      setIsAuthenticating(false);
      setHasAttemptedAuth(true);
    }
  };

  if (isAuthenticating) {
    return (
      <StyledView
        style={styles.container}
        className="bg-gray-900 justify-center items-center"
      >
        <ActivityIndicator size="large" color="#34D399" />
        <StyledText style={styles.message} className="text-white mt-4 text-lg">
          Authenticating...
        </StyledText>
      </StyledView>
    );
  }

  if (authError) {
    return (
      <StyledView
        style={styles.container}
        className="bg-gray-900 justify-center items-center"
      >
        <Ionicons name="close-circle-outline" size={64} color="#EF4444" />
        <StyledText
          style={[styles.message, { color: "#EF4444" }]}
          className="mt-4 text-lg"
        >
          {authError}
        </StyledText>
        {isBiometricEnabled && isBiometricAvailable && (
          <StyledTouchableOpacity
            onPress={authenticate}
            className="mt-8 rounded-lg bg-primary"
          >
            <StyledView className="p-3">
              <StyledText className="text-white font-semibold text-center">
                Retry Biometric
              </StyledText>
            </StyledView>
          </StyledTouchableOpacity>
        )}
      </StyledView>
    );
  }

  return (
    <StyledView
      style={styles.container}
      className="bg-gray-900 justify-center items-center"
    >
      <Ionicons name="lock-closed-outline" size={64} color="#6B7280" />
      <StyledText
        style={styles.title}
        className="text-white text-2xl font-bold mt-4 mb-2"
      >
        Portfolio Locked
      </StyledText>
      {isBiometricAvailable && isBiometricEnabled && (
        <StyledTouchableOpacity
          onPress={authenticate}
          className="mt-8 rounded-lg bg-primary"
        >
          <StyledView className="p-3">
            <StyledText className="text-white font-semibold text-center">
              {biometricType ===
              LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
                ? "Unlock with Face ID"
                : "Unlock with Touch ID"}
            </StyledText>
          </StyledView>
        </StyledTouchableOpacity>
      )}
      {!isBiometricEnabled && isBiometricAvailable && (
        <StyledText
          style={styles.message}
          className="text-gray-400 mt-4 text-center"
        >
          Biometric authentication is available but not enabled in settings.
        </StyledText>
      )}
    </StyledView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    maxWidth: "80%",
  },
});
