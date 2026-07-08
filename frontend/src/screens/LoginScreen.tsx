import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useTheme } from "../hooks/useTheme";
import { loginWithEmail, loginWithGoogleAccessToken } from "../services/api";
import { saveAuthSession } from "../services/storage";
import { AuthUser } from "../types";

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export function LoginScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const wrenchMotion = useRef(new Animated.Value(0)).current;
  const liftMotion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wrenchMotion, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(wrenchMotion, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(liftMotion, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(liftMotion, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();
  }, [liftMotion, wrenchMotion]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const location = (globalThis as typeof globalThis & { location?: Location }).location;
    if (!location?.hash.includes("access_token=")) return;
    const params = new URLSearchParams(location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    location.hash = "";
    if (accessToken) authenticateWithGoogle(accessToken);
  }, []);

  async function finishLogin(clientId: string, user: AuthUser) {
    await saveAuthSession(clientId, user);
    onAuthenticated(user);
  }

  async function submitEmail() {
    const normalized = email.trim().toLowerCase();
    setErrorMessage(null);
    if (!normalized || !normalized.includes("@")) {
      setErrorMessage("Enter a valid email address to continue.");
      Alert.alert("Email needed", "Enter a valid email address to continue.");
      return;
    }
    setLoading(true);
    try {
      const result = await loginWithEmail(normalized, displayName);
      await finishLogin(result.client_id, result.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Try again.";
      setErrorMessage(message);
      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  }

  function startGoogleLogin() {
    if (Platform.OS !== "web") {
      Alert.alert("Google setup needed", "Google login is currently wired for the website build. Use email login on mobile for now.");
      return;
    }
    if (!GOOGLE_CLIENT_ID) {
      Alert.alert("Google client ID needed", "Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to frontend/.env, then restart the web build.");
      return;
    }

    const location = (globalThis as typeof globalThis & { location?: Location }).location;
    if (!location) return;
    const redirectUri = location.origin;
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: "openid email profile",
      prompt: "select_account"
    });
    location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async function authenticateWithGoogle(accessToken: string) {
    setLoading(true);
    try {
      const result = await loginWithGoogleAccessToken(accessToken);
      await finishLogin(result.client_id, result.user);
    } catch (error) {
      Alert.alert("Google login failed", error instanceof Error ? error.message : "Try email login instead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <MechanicAnimation wrenchMotion={wrenchMotion} liftMotion={liftMotion} />
          <Text style={[styles.brand, { color: theme.text }]}>Pit<Text style={{ color: theme.primary }}>Wise</Text></Text>
          <View style={[styles.kicker, { borderColor: `${theme.primary}55`, backgroundColor: `${theme.primary}18` }]}>
            <Text style={[styles.kickerText, { color: theme.primary }]}>SAVE YOUR SCANS</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Sign in before the repair conversation.</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Save your vehicle, scan history, and mechanic-prep notes to one account.
          </Text>
        </View>

        <Card style={styles.agentPreview}>
          <View style={[styles.agentIcon, { borderColor: `${theme.primary}55`, backgroundColor: `${theme.primary}18` }]}>
            <Text style={[styles.agentIconText, { color: theme.primary }]}>AI</Text>
          </View>
          <View style={styles.agentCopy}>
            <Text style={[styles.agentTitle, { color: theme.text }]}>Autonomous agent</Text>
            <Text style={[styles.agentText, { color: theme.muted }]}>
              After you save a scan, run a background agent that reviews vehicle context, scan history, and mechanic-prep guidance, then returns prioritized next actions.
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={[styles.label, { color: theme.text }]}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="you@example.com"
            placeholderTextColor={theme.muted}
            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
          />
          <Text style={[styles.label, { color: theme.text }]}>Name optional</Text>
          <TextInput
            value={displayName}
            onChangeText={(value) => {
              setDisplayName(value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Abdullah"
            placeholderTextColor={theme.muted}
            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
          />
          <Button label={loading ? "Signing in..." : "Continue with Email"} disabled={loading} onPress={submitEmail} />
          {errorMessage ? (
            <View style={[styles.errorBox, { borderColor: `${theme.danger}66`, backgroundColor: `${theme.danger}18` }]}>
              <Text style={[styles.errorText, { color: theme.danger }]}>{errorMessage}</Text>
            </View>
          ) : null}
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.orText, { color: theme.muted }]}>OR</Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>
          <Button label="Continue with Google" variant="secondary" disabled={loading} onPress={startGoogleLogin} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MechanicAnimation({ wrenchMotion, liftMotion }: { wrenchMotion: Animated.Value; liftMotion: Animated.Value }) {
  const theme = useTheme();
  const wrenchRotate = wrenchMotion.interpolate({ inputRange: [0, 1], outputRange: ["-18deg", "24deg"] });
  const armLift = liftMotion.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const carLift = liftMotion.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <View style={[styles.scene, { backgroundColor: "#101A22CC", borderColor: theme.border }]}>
      <View style={[styles.sceneGrid, { borderColor: `${theme.primary}20` }]} />
      <Animated.View style={[styles.car, { backgroundColor: theme.primary, transform: [{ translateY: carLift }] }]}>
        <View style={styles.window} />
        <View style={[styles.light, { backgroundColor: theme.accent }]} />
      </Animated.View>
      <View style={styles.ground} />
      <View style={[styles.wheel, styles.leftWheel]} />
      <View style={[styles.wheel, styles.rightWheel]} />
      <View style={styles.mechanic}>
        <View style={styles.head} />
        <View style={styles.cap} />
        <View style={styles.bodyBlock} />
        <Animated.View style={[styles.arm, { transform: [{ translateY: armLift }, { rotate: wrenchRotate }] }]}>
          <View style={styles.wrenchHandle} />
          <View style={styles.wrenchHead} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36
  },
  hero: {
    alignItems: "center",
    marginBottom: 18
  },
  scene: {
    width: "100%",
    maxWidth: 420,
    height: 210,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
    overflow: "hidden"
  },
  sceneGrid: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 16,
    bottom: 16,
    borderRadius: 8,
    borderWidth: 1
  },
  car: {
    position: "absolute",
    left: 72,
    right: 24,
    bottom: 62,
    height: 58,
    borderRadius: 8,
    shadowColor: "#8AF5BD",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 }
  },
  window: {
    position: "absolute",
    left: 42,
    top: -24,
    width: 92,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#11232B"
  },
  light: {
    position: "absolute",
    right: 8,
    top: 20,
    width: 16,
    height: 10,
    borderRadius: 5
  },
  ground: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#94A3B8"
  },
  wheel: {
    position: "absolute",
    bottom: 48,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111827",
    borderWidth: 5,
    borderColor: "#26343A"
  },
  leftWheel: {
    left: 102
  },
  rightWheel: {
    right: 48
  },
  mechanic: {
    position: "absolute",
    left: 28,
    bottom: 45,
    width: 70,
    height: 100
  },
  head: {
    position: "absolute",
    left: 25,
    top: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2C9A0"
  },
  cap: {
    position: "absolute",
    left: 22,
    top: 4,
    width: 38,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#6B7280"
  },
  bodyBlock: {
    position: "absolute",
    left: 18,
    top: 42,
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#25323B"
  },
  arm: {
    position: "absolute",
    left: 48,
    top: 38,
    width: 58,
    height: 18,
    transformOrigin: "left center"
  },
  wrenchHandle: {
    position: "absolute",
    left: 8,
    top: 7,
    width: 42,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#9EB2AB"
  },
  wrenchHead: {
    position: "absolute",
    right: 0,
    top: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: "#9EB2AB",
    backgroundColor: "transparent"
  },
  brand: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12
  },
  kicker: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12
  },
  kickerText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1
  },
  title: {
    maxWidth: 440,
    textAlign: "center",
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 42
  },
  subtitle: {
    maxWidth: 440,
    marginTop: 8,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22
  },
  agentPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14
  },
  agentIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  agentIconText: {
    fontSize: 14,
    fontWeight: "900"
  },
  agentCopy: {
    flex: 1
  },
  agentTitle: {
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4
  },
  agentText: {
    fontSize: 14,
    lineHeight: 20
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 14,
    fontSize: 16
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800"
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 16
  },
  divider: {
    flex: 1,
    height: 1
  },
  orText: {
    fontSize: 12,
    fontWeight: "900"
  }
});
