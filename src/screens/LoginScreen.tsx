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
import { styled } from "nativewind";
// import * as Google from "expo-auth-session/providers/google";
// import * as AuthSession from "expo-auth-session";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginScreen: React.FC<RootStackScreenProps<"Login">> = ({
  navigation,
}) => {
  const { signIn, /* signInWithGoogle, */ isLoading, error } = useAuthStore();
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

  // Google Sign-In configuration
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   androidClientId:
  //     "545601338949-bqbppa5vv2jepddv2rq73nkekmc4fu1g.apps.googleusercontent.com",
  //   iosClientId:
  //     "545601338949-bqbppa5vv2jepddv2rq73nkekmc4fu1g.apps.googleusercontent.com",
  //   webClientId:
  //     "545601338949-bqbppa5vv2jepddv2rq73nkekmc4fu1g.apps.googleusercontent.com",
  // });

  // Handle Google Sign-In response
  // React.useEffect(() => {
  //   if (response) {
  //     if (response.type === "success") {
  //       const { authentication } = response;
  //       if (authentication?.idToken) {
  //         signInWithGoogle(authentication.idToken);
  //       }
  //     } else if (response.type === "error") {
  //       console.error("Google Auth Error:", response.error);
  //       const errorMessage =
  //         typeof response.error === "string"
  //           ? response.error
  //           : response.error?.message || "An unknown error occurred";
  //       Toast.show({
  //         type: "error",
  //         text1: "Google Sign-In Failed",
  //         text2: errorMessage,
  //       });
  //     }
  //   }
  // }, [response]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      control._reset();
    } catch (error) {
      console.error("Sign in error:", error);
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: (error as Error).message,
      });
    }
  };

  return (
    <StyledView className="flex-1 bg-gray-50 dark:bg-gray-900 px-4 pt-12 mt-8">
      <StyledView className="mb-8">
        <StyledText className="text-3xl font-bold text-dark dark:text-white">
          Welcome Back
        </StyledText>
        <StyledText className="text-gray-600 dark:text-gray-300 mt-2">
          Sign in to continue tracking your investments
        </StyledText>
      </StyledView>

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
          <StyledView className="mb-4">
            <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
              Email
            </StyledText>
            <StyledTextInput
              className="bg-white dark:bg-gray-800 p-3 rounded-lg text-dark dark:text-white"
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <StyledText className="text-danger text-sm mt-1">
                {errors.email.message}
              </StyledText>
            )}
          </StyledView>
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
          <StyledView className="mb-6">
            <StyledText className="text-gray-600 dark:text-gray-300 mb-1">
              Password
            </StyledText>
            <StyledTextInput
              className="bg-white dark:bg-gray-800 p-3 rounded-lg text-dark dark:text-white"
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              onChangeText={onChange}
              value={value}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
              blurOnSubmit={false}
            />
            {errors.password && (
              <StyledText className="text-danger text-sm mt-1">
                {errors.password.message}
              </StyledText>
            )}
          </StyledView>
        )}
      />

      <StyledTouchableOpacity
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        className="bg-primary p-4 rounded-lg mb-4"
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <StyledText className="text-white text-center font-semibold text-lg">
            Sign In
          </StyledText>
        )}
      </StyledTouchableOpacity>

      {/* Google Sign-In Button - Commented out
      <StyledTouchableOpacity
        onPress={() => {
          promptAsync();
          useAuthStore.getState().clearError();
        }}
        disabled={!request || isLoading}
        className="bg-red-500 p-4 rounded-lg mb-4 flex-row items-center justify-center"
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <StyledText className="text-white text-center font-semibold text-lg ml-2">
              Sign In with Google
            </StyledText>
          </>
        )}
      </StyledTouchableOpacity>
      */}

      <StyledTouchableOpacity
        onPress={() => navigation.navigate("Register")}
        className="p-4"
      >
        <StyledText className="text-primary text-center">
          Don't have an account? Sign Up
        </StyledText>
      </StyledTouchableOpacity>
    </StyledView>
  );
};
