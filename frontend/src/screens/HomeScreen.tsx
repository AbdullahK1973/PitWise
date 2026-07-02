import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { useTheme } from "../hooks/useTheme";
import { Scan, Vehicle } from "../types";

export function HomeScreen({
  vehicle,
  latestScan,
  onEnterCode,
  onBluetooth,
  onHistory,
  onMechanicPrep,
  onVehicleEdit
}: {
  vehicle: Vehicle | null;
  latestScan: Scan | null;
  onEnterCode: () => void;
  onBluetooth: () => void;
  onHistory: () => void;
  onMechanicPrep: () => void;
  onVehicleEdit: () => void;
}) {
  const theme = useTheme();
  const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "No vehicle saved";
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={[styles.brandMark, { borderColor: `${theme.primary}55`, backgroundColor: `${theme.primary}16` }]}>
          <Text style={[styles.brandIcon, { color: theme.primary }]}>RPM</Text>
        </View>
        <Text style={[styles.brand, { color: theme.text }]}>Pit<Text style={{ color: theme.primary }}>Wise</Text></Text>
        <View style={[styles.kicker, { borderColor: `${theme.primary}55`, backgroundColor: `${theme.primary}18` }]}>
          <Text style={[styles.kickerText, { color: theme.primary }]}>PLAIN-ENGLISH OBD2 TRANSLATOR</Text>
        </View>
        <Text style={[styles.headline, { color: theme.text }]}>
          Your check engine light, <Text style={{ color: theme.primary }}>decoded.</Text>
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Enter a diagnostic code or scan with an adapter, then get urgency, likely causes, repair paths, and shop-prep questions without the jargon.
        </Text>
      </View>

      <Card style={styles.scanCard}>
        <View style={styles.scanRow}>
          <View style={styles.searchGlyph}>
            <Text style={[styles.searchGlyphText, { color: theme.primary }]}>OBD</Text>
          </View>
          <View style={styles.scanCopy}>
            <Text style={[styles.scanTitle, { color: theme.text }]}>Ready to translate a code?</Text>
            <Text style={[styles.scanHint, { color: theme.muted }]}>Try P0300, P0171, P0420, P0128, or whatever your scanner found.</Text>
          </View>
          <View style={styles.scanAction}>
            <Button label="Scan / Enter Code" onPress={onEnterCode} />
          </View>
        </View>
        <View style={styles.quickCodes}>
          {["P0300", "P0171", "P0420", "P0128", "P0455", "P0011"].map((code) => (
            <View key={code} style={[styles.codeChip, { borderColor: theme.border, backgroundColor: "#101A2299" }]}>
              <Text style={[styles.codeChipText, { color: theme.code }]}>{code}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.grid}>
        <Card style={styles.gridCard}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: theme.primary }]}>MAIN VEHICLE</Text>
              <Text style={[styles.vehicle, { color: theme.text }]}>{vehicleName}</Text>
              {vehicle?.engine || vehicle?.mileage ? (
                <Text style={[styles.meta, { color: theme.muted }]}>
                  {[vehicle.engine, vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : null].filter(Boolean).join(" | ")}
                </Text>
              ) : (
                <Text style={[styles.meta, { color: theme.muted }]}>Add vehicle details to personalize scan history.</Text>
              )}
            </View>
            <Button label="Edit" variant="ghost" onPress={onVehicleEdit} />
          </View>
        </Card>

        <Card style={styles.gridCard}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Latest insight</Text>
          {latestScan ? (
            <>
              <View style={styles.latestTop}>
                <Text style={[styles.code, { color: theme.code }]}>{latestScan.code}</Text>
                <UrgencyBadge urgency={latestScan.urgency} />
              </View>
              <Text style={[styles.summary, { color: theme.muted }]}>{latestScan.summary}</Text>
            </>
          ) : (
            <Text style={[styles.summary, { color: theme.muted }]}>Enter a code to get a plain-English guide and save the result here.</Text>
          )}
        </Card>
      </View>

      <View style={styles.stack}>
        {Platform.OS === "web" ? null : <Button label="Bluetooth OBD2 Scan" variant="secondary" onPress={onBluetooth} />}
        <Button label="View Scan History" variant="secondary" onPress={onHistory} />
        <Button label="Mechanic Prep" variant="secondary" onPress={onMechanicPrep} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 120
  },
  hero: {
    alignItems: "center",
    marginBottom: 26
  },
  brandMark: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  brandIcon: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1
  },
  brand: {
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 16
  },
  kicker: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 16
  },
  kickerText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1
  },
  headline: {
    maxWidth: 820,
    textAlign: "center",
    fontSize: 48,
    lineHeight: 54,
    fontWeight: "900"
  },
  subtitle: {
    maxWidth: 720,
    textAlign: "center",
    marginTop: 14,
    fontSize: 17,
    lineHeight: 26
  },
  scanCard: {
    padding: 8
  },
  scanRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    padding: 10
  },
  searchGlyph: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#0B151C",
    alignItems: "center",
    justifyContent: "center"
  },
  searchGlyphText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2
  },
  scanCopy: {
    flex: 1,
    flexBasis: 260
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: "900"
  },
  scanHint: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20
  },
  scanAction: {
    minWidth: 180,
    flexGrow: 1
  },
  quickCodes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 10
  },
  codeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  codeChipText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1
  },
  grid: {
    gap: 14
  },
  gridCard: {
    flex: 1
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1
  },
  vehicle: {
    marginTop: 8,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900"
  },
  meta: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20
  },
  stack: {
    gap: 10,
    marginTop: 2
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12
  },
  latestTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8
  },
  code: {
    fontSize: 28,
    fontWeight: "900"
  },
  summary: {
    fontSize: 15,
    lineHeight: 22
  }
});
