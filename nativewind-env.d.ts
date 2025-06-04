/// <reference types="nativewind/types" />

declare module 'nativewind' {
  import type { ComponentType } from 'react';
  import type { ViewProps, TextProps, ImageProps, TouchableOpacityProps } from 'react-native';

  export function styled<T extends ComponentType<any>>(
    Component: T,
    options?: { className?: string }
  ): T;

  export const useColorScheme: () => 'light' | 'dark';
  export const useColorSchemeValue: <T>(light: T, dark: T) => T;
} 