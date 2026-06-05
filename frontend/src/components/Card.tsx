import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useTheme } from "../hooks/useTheme";

export function Card({ style, ...props }: ViewProps) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12
  }
});
