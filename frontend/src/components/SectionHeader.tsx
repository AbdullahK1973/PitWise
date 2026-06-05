import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14
  },
  title: {
    fontSize: 26,
    fontWeight: "800"
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22
  }
});
