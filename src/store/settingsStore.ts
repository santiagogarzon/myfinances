import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

export type PrivacyMode = 'off' | 'on_app_close' | 'on_app_background';

export interface NotificationPreferences {
  priceAlerts: boolean;
  portfolioSummary: boolean;
  marketUpdates: boolean;
}

export interface SettingsState {
  privacyMode: PrivacyMode;
  isBiometricEnabled: boolean;
  isPasscodeEnabled: boolean;
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
  isPasscodeEnabled: false,
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
      if (enabled) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (!hasHardware || !isEnrolled) {
          throw new Error('Biometric authentication is not available on this device');
        }
      }
      
      await AsyncStorage.setItem('@biometric_enabled', enabled.toString());
      set({ isBiometricEnabled: enabled });
    } catch (error) {
      console.error('Error saving biometric setting:', error);
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
      const [privacyMode, biometricEnabled, passcodeEnabled, notificationPrefs] = await Promise.all([
        AsyncStorage.getItem('@privacy_mode'),
        AsyncStorage.getItem('@biometric_enabled'),
        AsyncStorage.getItem('@passcode_enabled'),
        AsyncStorage.getItem('@notification_preferences'),
      ]);

      set({
        privacyMode: (privacyMode as PrivacyMode) || 'off',
        isBiometricEnabled: biometricEnabled === 'true',
        isPasscodeEnabled: passcodeEnabled === 'true',
        notificationPreferences: notificationPrefs ? JSON.parse(notificationPrefs) : DEFAULT_NOTIFICATION_PREFERENCES,
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      throw error;
    }
  },
})); 