import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { useTheme } from "../hooks/useTheme";
import { urgencyColor } from "../theme/theme";
import { Scan } from "../types";

type WorkflowStep = {
  id: string;
  phase: string;
  title: string;
  detail: string;
};

function makeWorkflowSteps(scan: Scan): WorkflowStep[] {
  const diagnosis = scan.diagnosis;
  const describedIssue = scan.symptoms?.trim();
  const firstCause = diagnosis.likely_causes[0] ?? "the highest-probability cause";
  const firstRepairPath = diagnosis.common_repair_paths[0] ?? "the simplest validated repair path";
  const firstProofRequest = diagnosis.proof_to_request[0] ?? "clear test results before approving work";
  const firstApprovalCheck = diagnosis.before_approving_repairs[0] ?? "a written estimate with parts, labor, and diagnostic evidence";

  const steps: WorkflowStep[] = [
    {
      id: "triage-risk",
      phase: "Triage",
      title: "Set the drive decision",
      detail: `${diagnosis.drive_safety_guidance.toUpperCase()}: ${diagnosis.confidence_note}`
    },
    {
      id: "confirm-code",
      phase: "Triage",
      title: "Confirm the exact fault context",
      detail: describedIssue
        ? `Work from ${diagnosis.code} (${diagnosis.title}) and keep this symptom description attached: ${describedIssue}`
        : `Work from ${diagnosis.code} (${diagnosis.title}) and note symptoms before clearing any codes.`
    },
    ...(describedIssue
      ? [
          {
            id: "verify-described-issue",
            phase: "Triage",
            title: "Verify the described issue",
            detail: "Confirm when it happens, whether the warning light is steady or flashing, and whether the same symptoms return after a short drive."
          }
        ]
      : []),
    {
      id: "inspect-cause",
      phase: "Diagnose",
      title: "Inspect the leading cause first",
      detail: firstCause
    },
    {
      id: "choose-path",
      phase: "Diagnose",
      title: "Pick the first repair path to validate",
      detail: firstRepairPath
    },
    {
      id: "collect-proof",
      phase: "Evidence",
      title: "Collect proof before parts",
      detail: firstProofRequest
    },
    {
      id: "approval-gate",
      phase: "Approval",
      title: "Run the approval gate",
      detail: firstApprovalCheck
    }
  ];
  return steps;
}

export function GuidedRepairPlanScreen({ scan, onBack, onMechanicPrep }: { scan: Scan; onBack: () => void; onMechanicPrep: () => void }) {
  const theme = useTheme();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const steps = useMemo(() => makeWorkflowSteps(scan), [scan]);
  const completedCount = steps.filter((step) => completed[step.id]).length;
  const progress = completedCount / steps.length;
  const safetyColor = urgencyColor(scan.diagnosis.urgency);

  function toggleStep(id: string) {
    setCompleted((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionHeader title="Guided Repair Plan" subtitle={`${scan.diagnosis.code} - ${scan.diagnosis.title}`} />

      {scan.symptoms ? (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Described issue</Text>
          <Text style={[styles.muted, { color: theme.muted }]}>{scan.symptoms}</Text>
        </Card>
      ) : null}

      <Card style={{ borderColor: safetyColor }}>
        <View style={styles.progressTop}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Repair decision checklist</Text>
            <Text style={[styles.muted, { color: theme.muted }]}>
              Turn the diagnosis into an ordered, evidence-driven plan before money changes hands.
            </Text>
          </View>
          <Text style={[styles.progressCount, { color: theme.primary }]}>
            {completedCount}/{steps.length}
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: "#101A22" }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} />
        </View>
      </Card>

      <View style={styles.steps}>
        {steps.map((step, index) => {
          const done = Boolean(completed[step.id]);
          return (
            <Pressable
              key={step.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              onPress={() => toggleStep(step.id)}
              style={({ pressed }) => [
                styles.step,
                {
                  backgroundColor: done ? `${theme.primary}18` : theme.card,
                  borderColor: done ? `${theme.primary}77` : theme.border,
                  opacity: pressed ? 0.82 : 1
                }
              ]}
            >
              <View style={[styles.check, { borderColor: done ? theme.primary : theme.border, backgroundColor: done ? theme.primary : "#101A22" }]}>
                <Text style={[styles.checkText, { color: done ? "#071017" : theme.muted }]}>{done ? "OK" : index + 1}</Text>
              </View>
              <View style={styles.stepCopy}>
                <Text style={[styles.phase, { color: theme.primary }]}>{step.phase}</Text>
                <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                <Text style={[styles.stepDetail, { color: theme.muted }]}>{step.detail}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Next best handoff</Text>
        <Text style={[styles.muted, { color: theme.muted }]}>
          Use Mechanic Prep when you need the exact questions, proof requests, and upsell checks for a shop visit.
        </Text>
      </Card>

      <View style={styles.actions}>
        <Button label="Open Mechanic Prep" onPress={onMechanicPrep} />
        <Button label="Back to Details" variant="secondary" onPress={onBack} />
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
  progressTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 14
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8
  },
  muted: {
    fontSize: 15,
    lineHeight: 22
  },
  progressCount: {
    fontSize: 26,
    fontWeight: "900"
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999
  },
  steps: {
    gap: 10,
    marginBottom: 14
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 3
  },
  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  checkText: {
    fontSize: 13,
    fontWeight: "900"
  },
  stepCopy: {
    flex: 1
  },
  phase: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1
  },
  stepTitle: {
    marginTop: 5,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900"
  },
  stepDetail: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22
  },
  actions: {
    gap: 10
  }
});
