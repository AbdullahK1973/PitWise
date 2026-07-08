import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { useTheme } from "../hooks/useTheme";
import { AgentTask, Scan, Vehicle } from "../types";

export function HomeScreen({
  vehicle,
  latestScan,
  onEnterCode,
  onBluetooth,
  onHistory,
  onMechanicPrep,
  onRepairPlan,
  agentTask,
  agentError,
  onRunAgent,
  onVehicleEdit
}: {
  vehicle: Vehicle | null;
  latestScan: Scan | null;
  onEnterCode: () => void;
  onBluetooth: () => void;
  onHistory: () => void;
  onMechanicPrep: () => void;
  onRepairPlan: () => void;
  agentTask: AgentTask | null;
  agentError: string | null;
  onRunAgent: () => void;
  onVehicleEdit: () => void;
}) {
  const theme = useTheme();
  const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "No vehicle saved";
  const agentBusy = agentTask ? ["queued", "running"].includes(agentTask.status) : false;
  const agentStatus = agentTask ? agentTask.status.replace("_", " ").toUpperCase() : "IDLE";
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

      <Card style={styles.agentCard}>
        <View style={styles.agentTop}>
          <View style={[styles.agentGlyph, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}55` }]}>
            <Text style={[styles.agentGlyphText, { color: theme.primary }]}>AI</Text>
          </View>
          <View style={styles.agentCopy}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Autonomous agent</Text>
            <Text style={[styles.summary, { color: theme.muted }]}>
              {agentTask?.result?.summary ?? "Run a background check that calls the backend, reviews your vehicle and scan history, then returns next actions."}
            </Text>
          </View>
          <View style={styles.agentAction}>
            <Button label={agentBusy ? "Agent Running" : "Run Agent"} onPress={onRunAgent} disabled={agentBusy} />
          </View>
        </View>

        <View style={styles.agentMeta}>
          <View style={[styles.statusPill, { borderColor: theme.border, backgroundColor: "#0B151CCC" }]}>
            <Text style={[styles.statusPillText, { color: agentBusy ? theme.primary : theme.muted }]}>{agentStatus}</Text>
          </View>
          <Text style={[styles.agentProgressLabel, { color: theme.muted }]}>{agentTask ? `${agentTask.progress}% complete` : "Ready"}</Text>
        </View>

        <View style={[styles.agentProgressTrack, { backgroundColor: "#101A22" }]}>
          <View style={[styles.agentProgressFill, { width: `${agentTask?.progress ?? 0}%`, backgroundColor: theme.primary }]} />
        </View>

        {agentError ? <Text style={[styles.agentError, { color: "#FFB3A6" }]}>{agentError}</Text> : null}

        {agentTask?.activities.length ? (
          <View style={styles.agentLog}>
            {agentTask.activities.slice(-3).map((activity, index) => (
              <View key={`${activity.label}-${index}`} style={styles.agentLogItem}>
                <Text style={[styles.agentLogLabel, { color: theme.text }]}>{activity.label}</Text>
                <Text style={[styles.agentLogDetail, { color: theme.muted }]}>{activity.detail}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {agentTask?.result ? (
          <View style={styles.agentResults}>
            <View style={styles.backendCalls}>
              {agentTask.result.backend_calls.map((call) => (
                <View key={call} style={[styles.callChip, { borderColor: theme.border, backgroundColor: "#101A2299" }]}>
                  <Text style={[styles.callChipText, { color: theme.code }]}>{call}</Text>
                </View>
              ))}
            </View>
            <View style={styles.nextActions}>
              {agentTask.result.next_actions.slice(0, 3).map((action) => (
                <View key={action.title} style={[styles.nextAction, { borderColor: theme.border }]}>
                  <View style={styles.nextActionTop}>
                    <Text style={[styles.nextActionTitle, { color: theme.text }]}>{action.title}</Text>
                    <UrgencyBadge urgency={action.priority} />
                  </View>
                  <Text style={[styles.nextActionDetail, { color: theme.muted }]}>{action.detail}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
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

      <View style={[styles.actionPanel, { backgroundColor: "#101A22AA", borderColor: theme.border }]}>
        {Platform.OS === "web" ? null : (
          <View style={styles.actionSlot}>
            <Button label="Bluetooth OBD2 Scan" variant="secondary" onPress={onBluetooth} />
          </View>
        )}
        <View style={styles.actionSlot}>
          <Button label="View Scan History" variant="secondary" onPress={onHistory} />
        </View>
        <View style={styles.actionSlot}>
          <Button label="Guided Repair Plan" variant="secondary" onPress={onRepairPlan} />
        </View>
        <View style={styles.actionSlot}>
          <Button label="Mechanic Prep" variant="secondary" onPress={onMechanicPrep} />
        </View>
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
  agentCard: {
    gap: 14,
    marginBottom: 14
  },
  agentTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12
  },
  agentGlyph: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  agentGlyphText: {
    fontSize: 14,
    fontWeight: "900"
  },
  agentCopy: {
    flex: 1,
    flexBasis: 280
  },
  agentAction: {
    minWidth: 160,
    flexGrow: 1
  },
  agentMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "900"
  },
  agentProgressLabel: {
    fontSize: 13,
    fontWeight: "800"
  },
  agentProgressTrack: {
    height: 9,
    borderRadius: 999,
    overflow: "hidden"
  },
  agentProgressFill: {
    height: "100%",
    borderRadius: 999
  },
  agentError: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  },
  agentLog: {
    gap: 8
  },
  agentLogItem: {
    gap: 3
  },
  agentLogLabel: {
    fontSize: 14,
    fontWeight: "900"
  },
  agentLogDetail: {
    fontSize: 13,
    lineHeight: 19
  },
  agentResults: {
    gap: 12
  },
  backendCalls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  callChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  callChipText: {
    fontSize: 11,
    fontWeight: "900"
  },
  nextActions: {
    gap: 8
  },
  nextAction: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12
  },
  nextActionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6
  },
  nextActionTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "900"
  },
  nextActionDetail: {
    fontSize: 14,
    lineHeight: 20
  },
  grid: {
    gap: 14,
    marginBottom: 14
  },
  gridCard: {
    width: "100%"
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
  actionPanel: {
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 3
  },
  actionSlot: {
    flexBasis: 220,
    flexGrow: 1
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
