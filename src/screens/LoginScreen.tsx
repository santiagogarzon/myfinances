import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useAuthStore } from "../store/authStore";
import { RootStackScreenProps } from "../types/navigation";
import Toast from "react-native-toast-message";

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginScreen: React.FC<RootStackScreenProps<"Login">> = ({
  navigation,
}) => {
  const { signIn, isLoading, error } = useAuthStore();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      control._reset();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: (error as Error).message,
      });
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 px-4 pt-12">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-dark dark:text-white">
          Welcome Back
        </Text>
        <Text className="text-gray-600 dark:text-gray-300 mt-2">
          Sign in to continue tracking your investments
        </Text>
      </View>

      <Controller
        control={control}
        name="email"
        rules={{
          required: "Email is required",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Invalid email address",
          },
        }}
        render={({ field: { onChange, value } }) => (
          <View className="mb-4">
            <Text className="text-gray-600 dark:text-gray-300 mb-1">Email</Text>
            <TextInput
              className="bg-white dark:bg-gray-800 p-3 rounded-lg text-dark dark:text-white"
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text className="text-danger text-sm mt-1">
                {errors.email.message}
              </Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        rules={{
          required: "Password is required",
          minLength: {
            value: 6,
            message: "Password must be at least 6 characters",
          },
        }}
        render={({ field: { onChange, value } }) => (
          <View className="mb-6">
            <Text className="text-gray-600 dark:text-gray-300 mb-1">
              Password
            </Text>
            <TextInput
              className="bg-white dark:bg-gray-800 p-3 rounded-lg text-dark dark:text-white"
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              onChangeText={onChange}
              value={value}
              secureTextEntry
            />
            {errors.password && (
              <Text className="text-danger text-sm mt-1">
                {errors.password.message}
              </Text>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        className="bg-primary p-4 rounded-lg mb-4"
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Sign In
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("Register")}
        className="p-4"
      >
        <Text className="text-primary text-center">
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
};
