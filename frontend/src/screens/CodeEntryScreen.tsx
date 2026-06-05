import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { useTheme } from "../hooks/useTheme";
import { submitCodeLookup } from "../services/api";
import { Scan, Vehicle } from "../types";

const CODE_PATTERN = /^[PCBU][0-9A-F]{4}$/;

export function CodeEntryScreen({
  vehicle,
  onBack,
  onScanCreated
}: {
  vehicle: Vehicle | null;
  onBack: () => void;
  onScanCreated: (scan: Scan) => void;
}) {
  const theme = useTheme();
  const [code, setCode] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const normalized = code.trim().toUpperCase().replace(/\s/g, "");
  const valid = CODE_PATTERN.test(normalized);

  async function submit() {
    if (!valid) {
      Alert.alert("Check the code", "Use a standard format like P0302.");
      return;
    }
    setLoading(true);
    try {
      const scan = await submitCodeLookup(vehicle?.id, normalized, symptoms);
      onScanCreated(scan);
    } catch (error) {
      Alert.alert("Code lookup failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Enter Code" subtitle="Use the code from your scanner or parts-store scan. PitWise will translate it without treating the code as proof of a failed part." />
        <Card>
          <Text style={[styles.label, { color: theme.text }]}>OBD2 code</Text>
          <TextInput
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
            placeholder="P0302"
            placeholderTextColor={theme.muted}
            style={[styles.codeInput, { backgroundColor: theme.input, borderColor: valid || !code ? theme.border : "#EF4444", color: theme.text }]}
          />
          <Text style={[styles.help, { color: theme.muted }]}>Normalized: {normalized || "P0000"}</Text>
          <Text style={[styles.label, { color: theme.text }]}>Symptoms optional</Text>
          <TextInput
            value={symptoms}
            onChangeText={setSymptoms}
            placeholder="Rough idle, flashing check engine light, fuel smell..."
            placeholderTextColor={theme.muted}
            multiline
            style={[styles.symptoms, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
          />
          <Button label={loading ? "Checking..." : "Get Guidance"} disabled={loading} onPress={submit} />
          <Button label="Back" variant="ghost" onPress={onBack} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 36
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8
  },
  codeInput: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8
  },
  help: {
    marginBottom: 16,
    fontSize: 13
  },
  symptoms: {
    minHeight: 100,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    textAlignVertical: "top",
    marginBottom: 16
  }
});
