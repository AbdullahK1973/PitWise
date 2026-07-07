import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, useColorScheme, View } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import { BackgroundField } from "./src/components/BackgroundField";
import { BottomTabs } from "./src/components/BottomTabs";
import { LoadingState } from "./src/components/LoadingState";
import { BluetoothScannerScreen } from "./src/screens/BluetoothScannerScreen";
import { CodeEntryScreen } from "./src/screens/CodeEntryScreen";
import { DiagnosisDetailScreen } from "./src/screens/DiagnosisDetailScreen";
import { GuidedRepairPlanScreen } from "./src/screens/GuidedRepairPlanScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MechanicPrepScreen } from "./src/screens/MechanicPrepScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { getScanHistory, getVehicle } from "./src/services/api";
import { getLocalAuthUser, getLocalVehicle, saveLocalVehicle } from "./src/services/storage";
import { colors, makeTheme } from "./src/theme/theme";
import { AppScreen, AuthUser, Scan, Vehicle } from "./src/types";

export default function App() {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => makeTheme(colorScheme), [colorScheme]);
  const [screen, setScreen] = useState<AppScreen>("loading");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<Scan[]>([]);
  const [activeScan, setActiveScan] = useState<Scan | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    const storedAuthUser = await getLocalAuthUser();
    if (!storedAuthUser) {
      setScreen("login");
      return;
    }
    setAuthUser(storedAuthUser);
    await loadUserData();
  }

  async function loadUserData() {
    try {
      const [storedVehicle, apiVehicle, scans] = await Promise.all([getLocalVehicle(), getVehicle(), getScanHistory()]);
      const mainVehicle = apiVehicle ?? storedVehicle;
      if (mainVehicle) {
        setVehicle(mainVehicle);
        await saveLocalVehicle(mainVehicle);
      }
      setHistory(scans);
      setActiveScan(scans[0] ?? null);
      setScreen(mainVehicle ? "home" : "onboarding");
    } catch {
      const storedVehicle = await getLocalVehicle();
      setVehicle(storedVehicle);
      setScreen(storedVehicle ? "home" : "onboarding");
    }
  }

  async function handleAuthenticated(user: AuthUser) {
    setAuthUser(user);
    await loadUserData();
  }

  async function refreshHistory(nextActive?: Scan) {
    const scans = await getScanHistory();
    setHistory(scans);
    setActiveScan(nextActive ?? scans[0] ?? null);
  }

  function renderScreen() {
    if (screen === "loading") return <LoadingState title="Starting PitWise" />;
    if (screen === "login") return <LoginScreen onAuthenticated={handleAuthenticated} />;
    if (screen === "onboarding") {
      return (
        <OnboardingScreen
          initialVehicle={vehicle}
          onSaved={(nextVehicle) => {
            setVehicle(nextVehicle);
            setScreen("home");
          }}
        />
      );
    }
    if (screen === "code") {
      return (
        <CodeEntryScreen
          vehicle={vehicle}
          onBack={() => setScreen("home")}
          onScanCreated={async (scan) => {
            setActiveScan(scan);
            await refreshHistory(scan);
            setScreen("detail");
          }}
        />
      );
    }
    if (screen === "history") {
      return (
        <HistoryScreen
          scans={history}
          onRefresh={refreshHistory}
          onSelect={(scan) => {
            setActiveScan(scan);
            setScreen("detail");
          }}
        />
      );
    }
    if (screen === "detail" && activeScan) {
      return (
        <DiagnosisDetailScreen
          scan={activeScan}
          onMechanicPrep={() => setScreen("prep")}
          onRepairPlan={() => setScreen("repairPlan")}
          onBack={() => setScreen("home")}
        />
      );
    }
    if (screen === "prep" && activeScan) {
      return <MechanicPrepScreen scan={activeScan} onBack={() => setScreen("detail")} />;
    }
    if (screen === "repairPlan" && activeScan) {
      return <GuidedRepairPlanScreen scan={activeScan} onBack={() => setScreen("detail")} onMechanicPrep={() => setScreen("prep")} />;
    }
    if (screen === "bluetooth") {
      return (
        <BluetoothScannerScreen
          vehicle={vehicle}
          onBack={() => setScreen("home")}
          onScanCreated={async (scan) => {
            setActiveScan(scan);
            await refreshHistory(scan);
            setScreen("detail");
          }}
        />
      );
    }
    if (screen === "settings") {
      return (
        <SettingsScreen
          onDataDeleted={() => {
            setAuthUser(null);
            setVehicle(null);
            setHistory([]);
            setActiveScan(null);
            setScreen("login");
          }}
          onEditVehicle={() => setScreen("onboarding")}
        />
      );
    }
    return (
      <HomeScreen
        vehicle={vehicle}
        latestScan={history[0] ?? null}
        onEnterCode={() => setScreen("code")}
        onBluetooth={() => setScreen("bluetooth")}
        onHistory={() => setScreen("history")}
        onMechanicPrep={() => (activeScan ? setScreen("prep") : setScreen("history"))}
        onRepairPlan={() => (activeScan ? setScreen("repairPlan") : setScreen("history"))}
        onVehicleEdit={() => setScreen("onboarding")}
      />
    );
  }

  const showTabs = !["loading", "login", "onboarding", "code", "detail", "prep", "repairPlan", "bluetooth"].includes(screen);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <BackgroundField />
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>{renderScreen()}</View>
      {showTabs ? <BottomTabs active={screen} onNavigate={setScreen} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  container: {
    flex: 1,
    backgroundColor: colors.transparent
  }
});
