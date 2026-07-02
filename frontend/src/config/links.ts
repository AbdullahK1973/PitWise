import { Platform } from "react-native";

const defaultPrivacyPolicy = Platform.OS === "web" ? "/privacy.html" : "https://pitwise.example/privacy.html";
const defaultTerms = Platform.OS === "web" ? "/terms.html" : "https://pitwise.example/terms.html";

export const legalLinks = {
  privacyPolicy: process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? defaultPrivacyPolicy,
  terms: process.env.EXPO_PUBLIC_TERMS_URL ?? defaultTerms,
  support: "https://www.google.com/search?q=mechanics+near+me"
};
