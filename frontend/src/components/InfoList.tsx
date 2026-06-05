import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export function InfoList({ items }: { items: string[] }) {
  const theme = useTheme();
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.text, { color: theme.text }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 7
  },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21
  }
});
