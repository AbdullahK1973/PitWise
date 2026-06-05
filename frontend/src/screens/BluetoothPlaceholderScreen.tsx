import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { useTheme } from "../hooks/useTheme";

export function BluetoothPlaceholderScreen({ onBack }: { onBack: () => void }) {
  const theme = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionHeader title="Bluetooth Scanner" subtitle="Planned support for ELM327-style adapters will live here after the manual-code MVP proves useful." />
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>Future flow</Text>
        <Text style={[styles.body, { color: theme.muted }]}>
          Pair adapter, read stored codes, add freeze-frame data, then translate issues with the same conservative PitWise guidance.
        </Text>
      </Card>
      <Button label="Back" onPress={onBack} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 36
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  }
});
