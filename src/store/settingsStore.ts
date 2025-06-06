import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import Constants from 'expo-constants';

export type PrivacyMode = 'off' | 'on_app_close' | 'on_app_background';

export interface NotificationPreferences {
  priceAlerts: boolean;
  portfolioSummary: boolean;
  marketUpdates: boolean;
}

export interface SettingsState {
  privacyMode: PrivacyMode;
  isBiometricEnabled: boolean;
  isPrivacyModeEnabled: boolean; // Computed property
  notificationPreferences: NotificationPreferences;
  setPrivacyMode: (mode: PrivacyMode) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setPasscodeEnabled: (enabled: boolean) => Promise<void>;
  setNotificationPreference: (key: keyof NotificationPreferences, enabled: boolean) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  priceAlerts: true,
  portfolioSummary: true,
  marketUpdates: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  privacyMode: 'off',
  isBiometricEnabled: false,
  notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
  get isPrivacyModeEnabled() {
    return get().privacyMode !== 'off';
  },

  setPrivacyMode: async (mode: PrivacyMode) => {
    try {
      await AsyncStorage.setItem('@privacy_mode', mode);
      set({ privacyMode: mode });
    } catch (error) {
      console.error('Error saving privacy mode:', error);
      throw error;
    }
  },

  setBiometricEnabled: async (enabled: boolean) => {
    try {
      console.log("SettingsStore: Setting biometric enabled to:", enabled);
      
      if (enabled) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        console.log("SettingsStore: Biometric availability check:", {
          hasHardware,
          isEnrolled,
          isSimulator: Constants.appOwnership === "expo"
        });
        
        if (!hasHardware || !isEnrolled) {
          console.log("SettingsStore: Biometric not available, throwing error");
          throw new Error('Biometric authentication is not available on this device');
        }
      }
      
      await AsyncStorage.setItem('@biometric_enabled', enabled.toString());
      console.log("SettingsStore: Biometric setting saved to storage");
      set({ isBiometricEnabled: enabled });
      console.log("SettingsStore: Biometric state updated in store");
    } catch (error) {
      console.error('SettingsStore: Error saving biometric setting:', error);
      throw error;
    }
  },

  setPasscodeEnabled: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('@passcode_enabled', enabled.toString());
      set({ isPasscodeEnabled: enabled });
    } catch (error) {
      console.error('Error saving passcode setting:', error);
      throw error;
    }
  },

  setNotificationPreference: async (key: keyof NotificationPreferences, enabled: boolean) => {
    try {
      const currentPreferences = get().notificationPreferences;
      const newPreferences = { ...currentPreferences, [key]: enabled };
      await AsyncStorage.setItem('@notification_preferences', JSON.stringify(newPreferences));
      set({ notificationPreferences: newPreferences });
    } catch (error) {
      console.error('Error saving notification preference:', error);
      throw error;
    }
  },

  loadSettings: async () => {
    try {
      console.log("SettingsStore: Loading settings...");
      const [privacyMode, biometricEnabled, passcodeEnabled, notificationPrefs] = await Promise.all([
        AsyncStorage.getItem('@privacy_mode'),
        AsyncStorage.getItem('@biometric_enabled'),
        AsyncStorage.getItem('@passcode_enabled'),
        AsyncStorage.getItem('@notification_preferences'),
      ]);

      console.log("SettingsStore: Loaded raw settings:", {
        privacyMode,
        biometricEnabled,
        passcodeEnabled,
        hasNotificationPrefs: !!notificationPrefs
      });

      const parsedSettings = {
        privacyMode: (privacyMode as PrivacyMode) || 'off',
        isBiometricEnabled: biometricEnabled === 'true',
        notificationPreferences: notificationPrefs ? JSON.parse(notificationPrefs) : DEFAULT_NOTIFICATION_PREFERENCES,
      };

      console.log("SettingsStore: Parsed settings:", parsedSettings);
      
      set(parsedSettings);
      console.log("SettingsStore: Settings state updated in store");
    } catch (error) {
      console.error('SettingsStore: Error loading settings:', error);
      throw error;
    }
  },
})); 