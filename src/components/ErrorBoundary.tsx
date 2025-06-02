import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="bg-white p-4 rounded-lg shadow mb-4">
          <Text className="text-gray-500 text-center">
            Something went wrong. Please try refreshing.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
