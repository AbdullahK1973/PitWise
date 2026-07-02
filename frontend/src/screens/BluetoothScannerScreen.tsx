import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { useTheme } from "../hooks/useTheme";
import { submitCodeLookup } from "../services/api";
import { BluetoothObdDevice, looksLikeObdDevice, ObdBluetoothClient } from "../services/obdBluetooth";
import { Scan, Vehicle } from "../types";

export function BluetoothScannerScreen({
  vehicle,
  onBack,
  onScanCreated
}: {
  vehicle: Vehicle | null;
  onBack: () => void;
  onScanCreated: (scan: Scan) => void;
}) {
  const theme = useTheme();
  const bluetooth = useMemo(() => (Platform.OS === "web" ? null : new ObdBluetoothClient()), []);
  const [devices, setDevices] = useState<BluetoothObdDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothObdDevice | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [status, setStatus] = useState("Ready to scan for a BLE OBD2 adapter.");
  const [scanning, setScanning] = useState(false);
  const [reading, setReading] = useState(false);
  const [stopScan, setStopScan] = useState<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      stopScan?.();
      bluetooth?.disconnect();
      bluetooth?.destroy();
    };
  }, [bluetooth, stopScan]);

  async function startScan() {
    if (!bluetooth) {
      setStatus("Bluetooth scanning is available in the mobile app. Use manual code entry on the website.");
      return;
    }

    stopScan?.();
    setDevices([]);
    setCodes([]);
    setSelectedDevice(null);
    setStatus("Scanning for BLE adapters");
    setScanning(true);

    const stop = await bluetooth.scan(
      (device) => {
        setDevices((current) => {
          if (current.some((item) => item.id === device.id)) return current;
          const next = [...current, device];
          return next.sort((a, b) => Number(looksLikeObdDevice(b)) - Number(looksLikeObdDevice(a)) || a.name.localeCompare(b.name));
        });
      },
      (message) => {
        setStatus(message);
        setScanning(false);
      }
    );

    setStopScan(() => stop);
    setTimeout(() => {
      stop();
      setScanning(false);
      setStatus("Select an adapter, or scan again if yours did not appear.");
    }, 10000);
  }

  async function readCodes(device: BluetoothObdDevice) {
    stopScan?.();
    setScanning(false);
    setSelectedDevice(device);
    setCodes([]);
    setReading(true);
    setStatus("Connecting");
    try {
      if (!bluetooth) throw new Error("Bluetooth scanning is available in the mobile app. Use manual code entry on the website.");
      const nextCodes = await bluetooth.readStoredCodes(device.id, setStatus);
      setCodes(nextCodes);
      setStatus(nextCodes.length ? "Stored codes found." : "No stored diagnostic codes returned by the adapter.");
    } catch (error) {
      Alert.alert("Bluetooth read failed", error instanceof Error ? error.message : "Try again or use manual code entry.");
      setStatus("Could not read codes from this adapter.");
    } finally {
      await bluetooth?.disconnect();
      setReading(false);
    }
  }

  async function createGuidance(code: string) {
    setReading(true);
    try {
      const scan = await submitCodeLookup(vehicle?.id, code, `Read from Bluetooth OBD2 adapter${selectedDevice ? ` (${selectedDevice.name})` : ""}.`);
      onScanCreated(scan);
    } catch (error) {
      Alert.alert("Could not create guidance", error instanceof Error ? error.message : "Try entering this code manually.");
    } finally {
      setReading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionHeader title="Bluetooth Scan" subtitle="Connect to a BLE ELM327-style adapter and read stored diagnostic trouble codes." />

      {Platform.OS === "web" ? (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Website mode</Text>
          <Text style={[styles.body, { color: theme.muted }]}>
            Browser Bluetooth is not enabled for PitWise yet. Use manual code entry on the website, or use a mobile build for adapter scanning.
          </Text>
          <View style={styles.actions}>
            <Button label="Enter Code Instead" onPress={onBack} />
          </View>
        </Card>
      ) : null}

      {Platform.OS !== "web" ? (
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Adapter scan</Text>
        <Text style={[styles.body, { color: theme.muted }]}>{status}</Text>
        <View style={styles.actions}>
          <Button label={scanning ? "Scanning..." : "Scan for Adapter"} disabled={scanning || reading} onPress={startScan} />
          <Button label="Back" variant="ghost" disabled={reading} onPress={onBack} />
        </View>
      </Card>
      ) : null}

      {devices.length ? (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Nearby devices</Text>
          {devices.map((device) => (
            <Pressable
              key={device.id}
              disabled={reading}
              onPress={() => readCodes(device)}
              style={({ pressed }) => [
                styles.deviceRow,
                {
                  borderColor: selectedDevice?.id === device.id ? theme.primary : theme.border,
                  backgroundColor: pressed ? theme.input : "transparent",
                  opacity: reading ? 0.65 : 1
                }
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.deviceName, { color: theme.text }]}>{device.name}</Text>
                <Text style={[styles.deviceMeta, { color: theme.muted }]}>{looksLikeObdDevice(device) ? "Likely OBD adapter" : "BLE device"}</Text>
              </View>
              <Text style={[styles.connectText, { color: theme.primary }]}>{reading && selectedDevice?.id === device.id ? "Reading" : "Connect"}</Text>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {codes.length ? (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Stored codes</Text>
          {codes.map((code) => (
            <View key={code} style={styles.codeRow}>
              <Text style={[styles.code, { color: theme.code, fontFamily: theme.fontMono }]}>{code}</Text>
              <Button label="Get Guidance" variant="secondary" disabled={reading} onPress={() => createGuidance(code)} />
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Compatibility</Text>
        <Text style={[styles.body, { color: theme.muted }]}>
          PitWise supports BLE ELM327-style adapters. Classic Bluetooth/SPP adapters are common on Android but are not a reliable App Store path for iPhone, so keep manual code entry available.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 920,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  },
  actions: {
    gap: 10,
    marginTop: 14
  },
  deviceRow: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "900"
  },
  deviceMeta: {
    marginTop: 3,
    fontSize: 13
  },
  connectText: {
    fontWeight: "900"
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10
  },
  code: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1
  }
});
