import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LoadingScreen } from "../components/LoadingScreen";
import { RootStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    console.log("AppNavigator - Auth State:", {
      isLoading,
      hasUser: !!user,
      userId: user?.uid,
    });
  }, [user, isLoading]);

  if (isLoading) {
    console.log("AppNavigator - Showing loading screen");
    return <LoadingScreen />;
  }

  console.log(
    "AppNavigator - Rendering navigation, user:",
    user ? "logged in" : "not logged in"
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F9FAFB" },
          animation: "slide_from_right",
        }}
      >
        {user ? (
          // Authenticated stack
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              gestureEnabled: false,
            }}
          />
        ) : (
          // Non-authenticated stack
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                presentation: "modal",
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
