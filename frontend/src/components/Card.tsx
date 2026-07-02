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
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 4
  }
});
