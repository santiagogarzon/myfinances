export default ({ config }) => {
  return {
    ...config,
    name: "MyFinances Pro",
    slug: "myfinances",
    version: "1.0.0",
    runtimeVersion: {
      policy: "sdkVersion",
    },
    updates: {
      url: "https://u.expo.dev/1e00c82f-a08c-4f8d-a395-7aa2554491de",
    },
    orientation: "portrait",
    icon: "./src/assets/logo.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./src/assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.santiagogarzon.myfinances",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription:
          "We need camera access to scan QR codes for crypto transactions",
        NSPhotoLibraryUsageDescription:
          "We need photo library access to import financial documents",
        UIBackgroundModes: ["fetch", "remote-notification"],
        LSApplicationQueriesSchemes: ["itms-apps"],
      },
      config: {
        usesNonExemptEncryption: false,
      },
      appStoreUrl: "https://apps.apple.com/app/myfinances/id6746658180",
    },
    android: {
      package: "com.santiagogarzon.myfinances",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./src/assets/logo.png",
        backgroundColor: "#000000",
      },
      permissions: [
        "INTERNET",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
      ],
      playStoreUrl:
        "https://play.google.com/store/apps/details?id=com.santiagogarzon.myfinances",
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "myfinances",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    extra: {
      eas: {
        projectId: "1e00c82f-a08c-4f8d-a395-7aa2554491de",
      },
    },
    owner: "santiagogarzon", // Your Expo account username
    description:
      "Track your investments and manage your portfolio with ease. Monitor stocks, cryptocurrencies, ETFs, and cash holdings in one place.",
    githubUrl: "https://github.com/santiagogarzon/myfinances",
    primaryColor: "#000000",
    web: {
      favicon: "./src/assets/logo.png",
    },
  };
};
