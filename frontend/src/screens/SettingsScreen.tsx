import React, { useState } from "react";
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { legalLinks } from "../config/links";
import { useTheme } from "../hooks/useTheme";
import { deleteAccountData } from "../services/api";
import { clearLocalData } from "../services/storage";

export function SettingsScreen({ onDataDeleted, onEditVehicle }: { onDataDeleted: () => void; onEditVehicle: () => void }) {
  const theme = useTheme();
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    if (Platform.OS === "web") {
      const webConfirm = (globalThis as typeof globalThis & { confirm?: (message: string) => boolean }).confirm;
      const confirmed = webConfirm
        ? webConfirm("Delete PitWise data? This removes your saved vehicle and scan history from this browser and the PitWise backend.")
        : true;
      if (confirmed) deleteData();
      return;
    }

    Alert.alert(
      "Delete PitWise data?",
      "This removes your saved vehicle and scan history from this app install and the PitWise backend. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteData }
      ]
    );
  }

  async function deleteData() {
    setDeleting(true);
    try {
      await deleteAccountData();
      await clearLocalData();
      onDataDeleted();
    } catch (error) {
      await clearLocalData();
      onDataDeleted();
      Alert.alert(
        "Local data deleted",
        error instanceof Error
          ? `PitWise cleared this device. The backend could not be reached: ${error.message}`
          : "PitWise cleared this device. Try again later if you also need backend deletion."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function openLink(url: string) {
    try {
      if (Platform.OS === "web") {
        const webLocation = (globalThis as typeof globalThis & { location?: { href: string } }).location;
        if (webLocation) {
          webLocation.href = url;
          return;
        }
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Could not open link", url);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionHeader title="Settings" subtitle="Manage your saved vehicle, privacy choices, and safety guidance." />

      <Card>
        <View style={styles.headerRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Vehicle</Text>
          <Button label="Edit" variant="ghost" onPress={onEditVehicle} />
        </View>
        <Text style={[styles.body, { color: theme.muted }]}>Update your main vehicle whenever scans and guidance should be organized around a different car.</Text>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Safety</Text>
        <Text style={[styles.body, { color: theme.muted }]}>
          PitWise is a preparation guide, not a confirmed diagnosis. If a vehicle feels unsafe or has brake, steering, overheating, oil-pressure, charging, or transmission symptoms, stop driving when safe and contact a qualified mechanic or roadside assistance.
        </Text>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Delete data</Text>
        <Text style={[styles.body, { color: theme.muted }]}>Remove this app install's saved vehicle and scan history from PitWise.</Text>
        <View style={styles.deleteAction}>
          <Button label={deleting ? "Deleting..." : "Delete My Data"} variant="secondary" disabled={deleting} onPress={confirmDelete} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Support</Text>
        <Text style={[styles.body, { color: theme.muted }]}>Find nearby mechanics when you need in-person diagnosis, inspection, or repair help.</Text>
        <View style={styles.deleteAction}>
          <Button label="Open Support" variant="secondary" onPress={() => openLink(legalLinks.support)} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Privacy</Text>
        <Text style={[styles.body, { color: theme.muted }]}>
          PitWise stores a random app-install ID, your saved vehicle details, manual OBD2 code lookups, symptoms you choose to enter, and generated guidance. Do not enter private information you do not want saved.
        </Text>
        <View style={styles.linkActions}>
          <Button label="Privacy Policy" variant="secondary" onPress={() => openLink(legalLinks.privacyPolicy)} />
          <Button label="Terms" variant="secondary" onPress={() => openLink(legalLinks.terms)} />
        </View>
      </Card>
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
    paddingBottom: 110
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  },
  linkActions: {
    gap: 10,
    marginTop: 14
  },
  deleteAction: {
    marginTop: 14
  }
});
