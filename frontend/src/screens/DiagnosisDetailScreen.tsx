import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { InfoList } from "../components/InfoList";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { useTheme } from "../hooks/useTheme";
import { urgencyColor } from "../theme/theme";
import { Scan } from "../types";

export function DiagnosisDetailScreen({ scan, onBack, onMechanicPrep }: { scan: Scan; onBack: () => void; onMechanicPrep: () => void }) {
  const theme = useTheme();
  const diagnosis = scan.diagnosis;
  const safetyColor = urgencyColor(diagnosis.urgency);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.code, { color: theme.code, fontFamily: theme.fontMono }]}>{diagnosis.code}</Text>
          <Text style={[styles.title, { color: theme.muted }]}>{diagnosis.title}</Text>
        </View>
        <UrgencyBadge urgency={diagnosis.urgency} />
      </View>

      <Card style={{ borderColor: safetyColor }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Plain-English read</Text>
        <Text style={[styles.body, { color: theme.text }]}>{diagnosis.plain_english_explanation}</Text>
        {diagnosis.symptoms_note ? <Text style={[styles.note, { color: theme.muted }]}>{diagnosis.symptoms_note}</Text> : null}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Drive guidance</Text>
        <Text style={[styles.safety, { color: safetyColor }]}>{diagnosis.drive_safety_guidance.toUpperCase()}</Text>
        <Text style={[styles.body, { color: theme.muted }]}>{diagnosis.confidence_note}</Text>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Likely causes</Text>
        <InfoList items={diagnosis.likely_causes} />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Common repair paths</Text>
        <InfoList items={diagnosis.common_repair_paths} />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Rough cost placeholder</Text>
        <Text style={[styles.cost, { color: theme.text }]}>{diagnosis.estimated_repair_cost_range}</Text>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Questions to ask</Text>
        <InfoList items={diagnosis.mechanic_questions_to_ask} />
      </Card>

      <Card>
        <Text style={[styles.disclaimer, { color: theme.muted }]}>{diagnosis.disclaimer}</Text>
      </Card>

      <View style={styles.actions}>
        <Button label="Mechanic Prep" onPress={onMechanicPrep} />
        <Button label="Back Home" variant="secondary" onPress={onBack} />
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18
  },
  code: {
    fontSize: 46,
    lineHeight: 52,
    fontWeight: "900",
    letterSpacing: 2
  },
  title: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 240
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10
  },
  body: {
    fontSize: 16,
    lineHeight: 24
  },
  note: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12
  },
  safety: {
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 8
  },
  cost: {
    fontSize: 22,
    fontWeight: "900"
  },
  disclaimer: {
    fontSize: 13,
    lineHeight: 19
  },
  actions: {
    gap: 10
  }
});
