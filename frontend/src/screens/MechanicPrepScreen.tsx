import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { InfoList } from "../components/InfoList";
import { SectionHeader } from "../components/SectionHeader";
import { useTheme } from "../hooks/useTheme";
import { Scan } from "../types";

export function MechanicPrepScreen({ scan, onBack }: { scan: Scan; onBack: () => void }) {
  const theme = useTheme();
  const diagnosis = scan.diagnosis;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionHeader title="Mechanic Prep" subtitle={`${diagnosis.code} - ${diagnosis.title}`} />
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>Ask these questions</Text>
        <InfoList items={diagnosis.mechanic_questions_to_ask} />
      </Card>
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>Proof to request</Text>
        <InfoList items={diagnosis.proof_to_request} />
      </Card>
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>Upsell watchouts</Text>
        <InfoList items={diagnosis.upsell_watchouts} />
      </Card>
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>Before approving repairs</Text>
        <InfoList items={diagnosis.before_approving_repairs} />
      </Card>
      <View style={styles.actions}>
        <Button label="Back to Details" onPress={onBack} />
      </View>
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
  title: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10
  },
  actions: {
    marginTop: 4
  }
});
