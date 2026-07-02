import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export function InfoList({ items }: { items: string[] }) {
  const theme = useTheme();
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={[styles.row, { borderColor: `${theme.primary}22`, backgroundColor: "#101A2266" }]}>
          <View style={[styles.dot, { backgroundColor: theme.primary, shadowColor: theme.primary }]} />
          <Text style={[styles.text, { color: theme.text }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 7,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }
  },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21
  }
});
