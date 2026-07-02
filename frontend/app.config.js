const appName = process.env.PITWISE_APP_NAME || "PitWise";
const appSlug = process.env.PITWISE_APP_SLUG || "pitwise";
const appScheme = process.env.PITWISE_APP_SCHEME || "pitwise";
const iosBundleIdentifier = process.env.PITWISE_IOS_BUNDLE_IDENTIFIER || "com.pitwise.app";
const androidPackage = process.env.PITWISE_ANDROID_PACKAGE || "com.pitwise.app";
const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || "https://pitwise.example/privacy.html";
const termsUrl = process.env.EXPO_PUBLIC_TERMS_URL || "https://pitwise.example/terms.html";
const supportUrl = process.env.EXPO_PUBLIC_SUPPORT_URL || "https://pitwise.example/support.html";

module.exports = {
  expo: {
    name: appName,
    slug: appSlug,
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    scheme: appScheme,
    description: "Plain-English OBD2 code guidance and mechanic-prep help for drivers.",
    icon: "./assets/icon.png",
    assetBundlePatterns: ["**/*"],
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0F172A"
    },
    ios: {
      bundleIdentifier: iosBundleIdentifier,
      buildNumber: "1",
      supportsTablet: true,
      infoPlist: {
        NSBluetoothAlwaysUsageDescription: "PitWise uses Bluetooth to connect to your OBD2 adapter and read diagnostic trouble codes.",
        NSBluetoothPeripheralUsageDescription: "PitWise uses Bluetooth to connect to your OBD2 adapter and read diagnostic trouble codes."
      }
    },
    android: {
      package: androidPackage,
      versionCode: 1,
      permissions: [
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.ACCESS_FINE_LOCATION"
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F172A"
      }
    },
    web: {
      bundler: "metro"
    },
    extra: {
      privacyPolicyUrl,
      termsUrl,
      supportUrl
    },
    plugins: [
      "expo-asset",
      [
        "react-native-ble-plx",
        {
          isBackgroundEnabled: false,
          modes: [],
          bluetoothAlwaysPermission: "PitWise uses Bluetooth to connect to your OBD2 adapter and read diagnostic trouble codes."
        }
      ]
    ]
  }
};
