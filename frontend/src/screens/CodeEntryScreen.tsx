import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { useTheme } from "../hooks/useTheme";
import { submitCodeLookup, submitIssueDescription } from "../services/api";
import { Scan, Vehicle } from "../types";

const CODE_PATTERN = /^[PCBU][0-3][0-9A-F]{3}$/;
type LookupMode = "code" | "describe";

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
  const [mode, setMode] = useState<LookupMode>("code");
  const [code, setCode] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const normalized = code.trim().toUpperCase().replace(/\s/g, "");
  const valid = CODE_PATTERN.test(normalized);
  const descriptionReady = description.trim().length >= 12;

  async function submit() {
    if (mode === "code") {
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
      return;
    }

    if (!descriptionReady) {
      Alert.alert("Describe the issue", "Add a little more detail, like when it happens and what you notice.");
      return;
    }
    setLoading(true);
    try {
      const scan = await submitIssueDescription(vehicle?.id, description);
      onScanCreated(scan);
    } catch (error) {
      Alert.alert("Issue lookup failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="OBD2 Scanner" subtitle="Enter a scanner code or describe what the vehicle is doing. PitWise will turn it into likely code guidance without treating one clue as proof of a failed part." />
        <Card style={styles.formCard}>
          <View style={[styles.modeSwitch, { backgroundColor: theme.input, borderColor: theme.border }]}>
            {(["code", "describe"] as LookupMode[]).map((item) => {
              const selected = mode === item;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={item}
                  onPress={() => setMode(item)}
                  style={[styles.modeOption, { backgroundColor: selected ? `${theme.primary}22` : "transparent", borderColor: selected ? `${theme.primary}88` : "transparent" }]}
                >
                  <Text style={[styles.modeText, { color: selected ? theme.primary : theme.muted }]}>{item === "code" ? "Enter code" : "Describe issue"}</Text>
                </Pressable>
              );
            })}
          </View>

          {mode === "code" ? (
            <>
              <Text style={[styles.label, { color: theme.text }]}>OBD2 code</Text>
              <TextInput
                autoCapitalize="characters"
                value={code}
                onChangeText={setCode}
                placeholder="P0302"
                placeholderTextColor={theme.muted}
                style={[styles.codeInput, { backgroundColor: "#0B151CCC", borderColor: valid || !code ? `${theme.primary}55` : theme.danger, color: theme.code, fontFamily: theme.fontMono }]}
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
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: theme.text }]}>Describe your issue</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Engine shakes at stoplights, check engine light flashes, smells like fuel..."
                placeholderTextColor={theme.muted}
                multiline
                style={[styles.description, { backgroundColor: theme.input, borderColor: descriptionReady || !description ? theme.border : theme.danger, color: theme.text }]}
                textAlignVertical="top"
              />
              <Text style={[styles.help, { color: theme.muted }]}>
                Include when it happens, warning lights, smells, noises, temperature, shifting, or drivability changes.
              </Text>
            </>
          )}

          <Button label={loading ? "Checking..." : mode === "code" ? "Get Code Guidance" : "Find Likely Code"} disabled={loading} onPress={submit} />
          <Button label="Back" variant="ghost" onPress={onBack} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36
  },
  formCard: {
    padding: 20
  },
  modeSwitch: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 5,
    marginBottom: 18
  },
  modeOption: {
    flex: 1,
    minHeight: 42,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10
  },
  modeText: {
    fontSize: 13,
    fontWeight: "900"
  },
  label: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8
  },
  codeInput: {
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 4,
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
  },
  description: {
    minHeight: 170,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10
  }
});
