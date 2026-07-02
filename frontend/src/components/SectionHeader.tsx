import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.kicker, { borderColor: `${theme.primary}55`, backgroundColor: `${theme.primary}18` }]}>
        <Text style={[styles.kickerText, { color: theme.primary }]}>PLAIN-ENGLISH OBD2 GUIDE</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
    alignItems: "flex-start"
  },
  kicker: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12
  },
  kickerText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 680
  }
});
