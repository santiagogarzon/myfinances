import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const SETTINGS_STORAGE_KEY = '@app_settings';

export interface SettingsState {
  loadSettings: () => Promise<void>;
  isBiometricEnabled: boolean;
  isPasscodeEnabled: boolean;
  privacyMode: 'off' | 'on_app_close' | 'on_app_background';
  setIsBiometricEnabled: (enabled: boolean) => Promise<void>;
  setIsPasscodeEnabled: (enabled: boolean) => Promise<void>;
  setPrivacyMode: (mode: 'off' | 'on_app_close' | 'on_app_background') => Promise<void>;
  checkBiometricAvailability: () => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isBiometricEnabled: false,
  isPasscodeEnabled: false,
  privacyMode: 'off',

  loadSettings: async () => {
    try {
      console.log('Loading settings...');
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        console.log('Loaded settings from storage:', settings);
        set({
          isBiometricEnabled: settings.isBiometricEnabled ?? false,
          isPasscodeEnabled: settings.isPasscodeEnabled ?? false,
          privacyMode: settings.privacyMode ?? 'off',
        });
      } else {
        console.log('No stored settings found, using defaults');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  setIsBiometricEnabled: async (enabled: boolean) => {
    try {
      if (enabled) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
          throw new Error('Biometric authentication is not available on this device');
        }
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
          throw new Error('No biometric credentials are enrolled on this device');
        }
      }

      const newSettings = {
        ...get(),
        isBiometricEnabled: enabled,
      };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      set({ isBiometricEnabled: enabled });
    } catch (error) {
      console.error('Error setting biometric enabled:', error);
      throw error;
    }
  },

  setIsPasscodeEnabled: async (enabled: boolean) => {
    try {
      const newSettings = {
        ...get(),
        isPasscodeEnabled: enabled,
      };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      set({ isPasscodeEnabled: enabled });
    } catch (error) {
      console.error('Error setting passcode enabled:', error);
      throw error;
    }
  },

  setPrivacyMode: async (mode: 'off' | 'on_app_close' | 'on_app_background') => {
    try {
      const newSettings = {
        ...get(),
        privacyMode: mode,
      };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      set({ privacyMode: mode });
    } catch (error) {
      console.error('Error setting privacy mode:', error);
      throw error;
    }
  },

  checkBiometricAvailability: async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;
      
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  },
})); 