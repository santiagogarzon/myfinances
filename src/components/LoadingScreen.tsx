import React from "react";
import { View, Dimensions } from "react-native";
import LottieView from "lottie-react-native";
import { styled } from "nativewind";

const StyledView = styled(View);

export const LoadingScreen: React.FC = () => {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const animationSize = Math.min(screenWidth, screenHeight) * 0.8;

  return (
    <StyledView className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
      <StyledView
        style={{
          width: animationSize,
          height: animationSize,
          backgroundColor: "transparent",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <LottieView
          source={require("../assets/loading-animation.json")}
          autoPlay
          loop
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
          }}
        />
      </StyledView>
    </StyledView>
  );
};
