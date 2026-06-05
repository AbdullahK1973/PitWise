import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { useTheme } from "../hooks/useTheme";
import { Scan, Vehicle } from "../types";

export function HomeScreen({
  vehicle,
  latestScan,
  onEnterCode,
  onHistory,
  onMechanicPrep,
  onVehicleEdit,
  onBluetooth
}: {
  vehicle: Vehicle | null;
  latestScan: Scan | null;
  onEnterCode: () => void;
  onHistory: () => void;
  onMechanicPrep: () => void;
  onVehicleEdit: () => void;
  onBluetooth: () => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionHeader title="PitWise" subtitle="A second-opinion assistant for understanding codes before you approve repairs." />
      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: theme.muted }]}>MAIN VEHICLE</Text>
            <Text style={[styles.vehicle, { color: theme.text }]}>
              {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "No vehicle saved"}
            </Text>
            {vehicle?.engine || vehicle?.mileage ? (
              <Text style={[styles.meta, { color: theme.muted }]}>
                {[vehicle.engine, vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : null].filter(Boolean).join(" | ")}
              </Text>
            ) : null}
          </View>
          <Button label="Edit" variant="ghost" onPress={onVehicleEdit} />
        </View>
      </Card>

      <View style={styles.stack}>
        <Button label="Scan / Enter Code" onPress={onEnterCode} />
        <Button label="View Scan History" variant="secondary" onPress={onHistory} />
        <Button label="Mechanic Prep" variant="secondary" onPress={onMechanicPrep} />
      </View>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Latest insight</Text>
        {latestScan ? (
          <>
            <View style={styles.latestTop}>
              <Text style={[styles.code, { color: theme.text }]}>{latestScan.code}</Text>
              <UrgencyBadge urgency={latestScan.urgency} />
            </View>
            <Text style={[styles.summary, { color: theme.muted }]}>{latestScan.summary}</Text>
          </>
        ) : (
          <Text style={[styles.summary, { color: theme.muted }]}>Enter a code to get a plain-English guide and save the result here.</Text>
        )}
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Future scanner support</Text>
        <Text style={[styles.summary, { color: theme.muted }]}>Bluetooth OBD2 integration is planned. For now, manual code entry keeps the MVP focused and reliable.</Text>
        <View style={{ marginTop: 12 }}>
          <Button label="Bluetooth Placeholder" variant="secondary" onPress={onBluetooth} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 110
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800"
  },
  vehicle: {
    marginTop: 6,
    fontSize: 21,
    fontWeight: "800"
  },
  meta: {
    marginTop: 5,
    fontSize: 14
  },
  stack: {
    gap: 10,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10
  },
  latestTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8
  },
  code: {
    fontSize: 24,
    fontWeight: "900"
  },
  summary: {
    fontSize: 15,
    lineHeight: 22
  }
});
