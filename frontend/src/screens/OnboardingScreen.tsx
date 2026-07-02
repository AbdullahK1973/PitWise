import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { useTheme } from "../hooks/useTheme";
import { saveVehicle } from "../services/api";
import { saveLocalVehicle } from "../services/storage";
import { Vehicle } from "../types";

export function OnboardingScreen({ initialVehicle, onSaved }: { initialVehicle: Vehicle | null; onSaved: (vehicle: Vehicle) => void }) {
  const theme = useTheme();
  const [make, setMake] = useState(initialVehicle?.make ?? "");
  const [model, setModel] = useState(initialVehicle?.model ?? "");
  const [year, setYear] = useState(String(initialVehicle?.year ?? ""));
  const [engine, setEngine] = useState(initialVehicle?.engine ?? "");
  const [mileage, setMileage] = useState(initialVehicle?.mileage ? String(initialVehicle.mileage) : "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const parsedYear = Number(year);
    if (!make.trim() || !model.trim() || !parsedYear) {
      Alert.alert("Vehicle info needed", "Add make, model, and year so PitWise can keep your scans organized.");
      return;
    }
    setSaving(true);
    try {
      const vehicle = await saveVehicle({
        make: make.trim(),
        model: model.trim(),
        year: parsedYear,
        engine: engine.trim() || null,
        mileage: mileage ? Number(mileage) : null
      });
      await saveLocalVehicle(vehicle);
      onSaved(vehicle);
    } catch (error) {
      Alert.alert("Could not save vehicle", error instanceof Error ? error.message : "Check that the API is running.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="PitWise"
          subtitle="Set up your main vehicle. PitWise translates car issues into plain language and helps you prepare for the repair conversation."
        />
        <Card style={styles.formCard}>
          <Text style={[styles.label, { color: theme.text }]}>Make</Text>
          <TextInput value={make} onChangeText={setMake} placeholder="Toyota" placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]} />
          <Text style={[styles.label, { color: theme.text }]}>Model</Text>
          <TextInput value={model} onChangeText={setModel} placeholder="Camry" placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]} />
          <Text style={[styles.label, { color: theme.text }]}>Year</Text>
          <TextInput value={year} onChangeText={setYear} keyboardType="number-pad" placeholder="2017" placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]} />
          <Text style={[styles.label, { color: theme.text }]}>Engine optional</Text>
          <TextInput value={engine} onChangeText={setEngine} placeholder="2.5L I4" placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]} />
          <Text style={[styles.label, { color: theme.text }]}>Mileage optional</Text>
          <TextInput value={mileage} onChangeText={setMileage} keyboardType="number-pad" placeholder="86300" placeholderTextColor={theme.muted} style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]} />
          <Button label={saving ? "Saving..." : "Save Vehicle"} disabled={saving} onPress={submit} />
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
  label: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8
  },
  input: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 16
  }
});
