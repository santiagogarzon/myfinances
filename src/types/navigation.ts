import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = {
  Loading: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Lock: {
    onUnlock: () => void;
    onShowPasscode: () => void;
  };
  SettingsModal: undefined;
  PasscodeSetup: {
    intendedAction: 'setup' | 'verify' | 'change';
    onUnlock?: () => void;
  };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type NavigationRef = NavigationContainerRef<RootStackParamList>; 