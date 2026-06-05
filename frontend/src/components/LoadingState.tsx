import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export function LoadingState({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.primary} />
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  title: {
    fontSize: 16,
    fontWeight: "700"
  }
});
